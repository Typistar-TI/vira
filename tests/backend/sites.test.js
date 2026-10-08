import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { api } from '../../backend/app';
import { defaultSite, hasAccess, parseSite } from '../../backend/features/sites/entities/site';
import { getSiteForUser } from '../../backend/features/sites/repository/sites';
import { readMedia } from '../../backend/features/media/controller/read';
import { customer, request } from './helpers';
import { exampleSite } from '../../backend/features/sites/entities/example';

it('starts every account from the single fixed black-and-white page', async () => {
  const { user, cookie } = await customer();
  const before = await getSiteForUser(user.id);
  for (const language of ['pt', 'en']) {
    const preset = exampleSite(language);
    expect(parseSite(preset)).toEqual(preset);
    expect(preset.language).toBe(language);
    expect(preset.backgroundColor).toBe('#ffffff');
    expect(preset.accentColor).toBe('#17130d');
    expect(preset.sections.length).toBeGreaterThan(0);
    expect(JSON.stringify(preset)).not.toMatch(
      /Valkyris|DashLab|Fertec|Forastieri|Miriam|\/templates\/assets/,
    );
    expect((await api.fetch(request('/api/site/save', preset, { cookie }))).status).toBe(200);
    const after = await getSiteForUser(user.id);
    expect(JSON.parse(after.draft_json)).toEqual(preset);
    expect(after.published_json).toBe(before.published_json);
  }
});

it('example content is independent and image ownership is enforced', () => {
  const first = exampleSite('pt');
  const services = first.sections.find((section) => section.type === 'services');
  services.items[0].title = 'Edited';
  const second = exampleSite('pt');
  expect(second.sections.find((section) => section.type === 'services').items[0].title).not.toBe(
    'Edited',
  );
  expect(() => parseSite({ ...first, logo: '/templates/assets/imported.png' })).toThrow();
});

it('migrates legacy flat content into editable sections', () => {
  const migrated = parseSite({
    ...defaultSite,
    layout: 'classico',
    title: 'Legacy page',
    subtitle: 'Old intro',
    about: 'Old about',
    products: [{ title: 'P1', description: 'D1', image: '', url: '' }],
    faq: [{ question: 'Q1', answer: 'A1' }],
    footerText: 'Old footer',
    links: [{ label: 'Site', url: 'https://example.com' }],
  });
  const types = migrated.sections.map((section) => section.type);
  expect(types).toContain('hero');
  expect(types).toContain('about');
  expect(types).toContain('services');
  expect(types).toContain('faq');
  expect(types).toContain('footer');
  expect(migrated.sections.find((s) => s.type === 'hero').title).toBe('Legacy page');
  expect(migrated.sections.find((s) => s.type === 'faq').items[0].question).toBe('Q1');
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

it.each(['trial', 'expired'])('publishes only with valid access (%s)', async (plan) => {
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
  ['expired', 9999999999, 9999999999, false],
])('enforces plan access boundaries: %s', (plan, trial_ends_at, access_until, expected) => {
  expect(hasAccess({ plan, trial_ends_at, access_until })).toBe(expected);
});

it.each(['javascript:alert(1)', 'data:text/html,hi', 'https://valid.test'])(
  'validates site links: %s',
  (url) => {
    const section = {
      id: 'hero',
      type: 'hero',
      variant: 'left',
      eyebrow: '',
      title: 'Hi',
      subtitle: '',
      image: '',
      primaryLabel: 'Go',
      primaryUrl: url,
    };
    if (url.startsWith('https:'))
      expect(parseSite({ ...defaultSite, sections: [section] }).sections[0].primaryUrl).toBe(url);
    else expect(() => parseSite({ ...defaultSite, sections: [section] })).toThrow();
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
