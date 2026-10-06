import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { api } from '../../backend/app';
import { defaultSite, hasAccess, parseSite } from '../../backend/features/sites/entities/site';
import { getSiteForUser } from '../../backend/features/sites/repository/sites';
import { readMedia } from '../../backend/features/media/controller/read';
import { customer, request } from './helpers';
import { templatePreset } from '../../backend/features/sites/entities/template-presets';

it.each(['guardiao', 'central', 'perfil', 'estudio', 'classico'])(
  'loads a complete generic editable %s preset without publishing',
  async (layout) => {
    const { user, cookie } = await customer();
    const before = await getSiteForUser(user.id);
    for (const language of ['pt', 'en']) {
      const preset = templatePreset(layout, language);
      expect(parseSite(preset)).toEqual(preset);
      expect(preset.layout).toBe(layout);
      expect(preset.language).toBe(language);
      expect(preset.benefits.length).toBeGreaterThan(0);
      expect(preset.steps.length).toBe(3);
      expect(preset.products.length).toBeGreaterThan(0);
      expect(preset.faq.length).toBeGreaterThan(0);
      expect(JSON.stringify(preset)).not.toMatch(
        /Valkyris|DashLab|Fertec|Forastieri|Miriam|\/templates\/assets/,
      );
      expect((await api.fetch(request('/api/site/save', preset, { cookie }))).status).toBe(200);
      const after = await getSiteForUser(user.id);
      expect(JSON.parse(after.draft_json)).toEqual(preset);
      expect(after.published_json).toBe(before.published_json);
    }
  },
);

it('returns independent template content and keeps image ownership restrictions', async () => {
  const first = templatePreset('perfil');
  first.products[0].title = 'Edited';
  expect(templatePreset('perfil').products[0].title).not.toBe('Edited');
  expect(() => parseSite({ ...first, heroImage: '/templates/assets/imported.png' })).toThrow();
});

it('saves only the authenticated customer draft and rejects foreign images', async () => {
  const a = await customer(),
    b = await customer();
  const own = await getSiteForUser(a.user.id),
    other = await getSiteForUser(b.user.id);
  const draft = { ...defaultSite, title: 'My draft', site_id: other.id, user_id: b.user.id };
  expect((await api.fetch(request('/api/site/save', draft, { cookie: a.cookie }))).status).toBe(
    200,
  );
  expect(JSON.parse((await getSiteForUser(a.user.id)).draft_json).title).toBe('My draft');
  expect((await getSiteForUser(b.user.id)).draft_json).toBe(other.draft_json);
  expect(
    (
      await api.fetch(
        request(
          '/api/site/save',
          { ...draft, logo: `/media/${other.id}/${crypto.randomUUID()}.png` },
          { cookie: a.cookie },
        ),
      )
    ).status,
  ).toBe(400);
  expect((await getSiteForUser(a.user.id)).published_json).toBe(own.published_json);
});

it.each(['trial', 'lifetime', 'expired'])('publishes only with valid access (%s)', async (plan) => {
  const { cookie, user } = await customer(plan);
  const response = await api.fetch(request('/api/site/publish', {}, { cookie }));
  expect(response.status).toBe(plan === 'expired' ? 403 : 200);
  expect((await getSiteForUser(user.id)).auto_published).toBe(plan === 'expired' ? 1 : 0);
});

it.each([
  ['trial', 1, null, false],
  ['monthly', 1, null, false],
  ['monthly', 1, 9999999999, true],
  ['yearly', 1, 1, false],
  ['lifetime', 1, null, true],
  ['expired', 9999999999, 9999999999, false],
])('enforces plan access boundaries: %s', (plan, trial_ends_at, access_until, expected) => {
  expect(hasAccess({ plan, trial_ends_at, access_until })).toBe(expected);
});

it.each(['javascript:alert(1)', 'data:text/html,hi', 'https://valid.test'])(
  'validates site links: %s',
  (url) => {
    if (url.startsWith('https:'))
      expect(parseSite({ ...defaultSite, primaryUrl: url }).primaryUrl).toBe(url);
    else expect(() => parseSite({ ...defaultSite, primaryUrl: url })).toThrow();
  },
);

it('restricts media from expired sites to its owner and rejects traversal', async () => {
  const owner = await customer('expired'),
    stranger = await customer();
  const site = await getSiteForUser(owner.user.id),
    key = `${site.id}/${crypto.randomUUID()}.png`;
  await env.DB.prepare(
    'INSERT INTO media_assets (key,site_id,bytes,created_at) VALUES (?,?,1,unixepoch())',
  )
    .bind(key, site.id)
    .run();
  await env.MEDIA.put(key, 'test', { httpMetadata: { contentType: 'image/png' } });
  expect((await readMedia(request('/media/' + key), key)).status).toBe(404);
  expect(
    (await readMedia(request('/media/' + key, undefined, { cookie: stranger.cookie }), key)).status,
  ).toBe(404);
  const allowed = await readMedia(
    request('/media/' + key, undefined, { cookie: owner.cookie }),
    key,
  );
  expect(allowed.status).toBe(200);
  expect(allowed.headers.get('cache-control')).toBe('private, no-store');
  expect((await readMedia(request('/media/x'), '../secret')).status).toBe(404);
});
