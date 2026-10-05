import { it, expect } from 'vitest';
import { POST as upload } from '../../backend/features/media/controller/upload';
import { imageMatchesType } from '../../backend/features/media/service/validation';
import { customer } from './helpers';
import { reserveAsset } from '../../backend/features/media/repository/assets';
import { getSiteForUser } from '../../backend/features/sites/repository/sites';
import { env } from 'cloudflare:workers';

it.each(['image/jpeg', 'image/png', 'image/webp'])('rejects forged %s MIME types', async (type) => {
  expect(await imageMatchesType(new File(['<html>Not an image</html>'], 'fake', { type }))).toBe(
    false,
  );
});

it('rejects malformed uploads before storing them', async () => {
  const { cookie } = await customer();
  const form = new FormData();
  form.set('file', new File(['<script>alert(1)</script>'], 'fake.png', { type: 'image/png' }));
  const req = new Request('https://example.test/api/media/upload', {
    method: 'POST',
    headers: { origin: 'https://example.test', cookie },
    body: form,
  });
  expect((await upload(req)).status).toBe(400);
});

it('enforces image-count and byte quotas atomically under parallel uploads', async () => {
  const { user } = await customer(),
    site = await getSiteForUser(user.id);
  const outcomes = await Promise.all(
    Array.from({ length: 40 }, () =>
      reserveAsset(`${site.id}/${crypto.randomUUID()}.png`, site.id, 1),
    ),
  );
  expect(outcomes.filter(Boolean)).toHaveLength(30);
  const another = await customer(),
    otherSite = await getSiteForUser(another.user.id);
  expect(
    await reserveAsset(
      `${otherSite.id}/${crypto.randomUUID()}.png`,
      otherSite.id,
      50 * 1024 * 1024,
    ),
  ).toBe(true);
  expect(await reserveAsset(`${otherSite.id}/${crypto.randomUUID()}.png`, otherSite.id, 1)).toBe(
    false,
  );
  expect(
    (
      await env.DB.prepare('SELECT count(*) AS n FROM media_assets WHERE site_id = ?')
        .bind(site.id)
        .first()
    ).n,
  ).toBe(30);
});
