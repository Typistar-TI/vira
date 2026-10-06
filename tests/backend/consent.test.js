import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { api } from '../../backend/app';
import { request } from './helpers';
import { getOrCreateEmailUser } from '../../backend/features/auth/repository/users';

it('records an anonymous cookie consent', async () => {
  const response = await api.fetch(request('/api/consent', { kind: 'cookies', version: '1' }));
  expect(response.status).toBe(200);
  const row = await env.DB.prepare(
    "SELECT user_id, subject, kind, version FROM consents WHERE kind = 'cookies' ORDER BY created_at DESC LIMIT 1",
  ).first();
  expect(row.version).toBe('1');
  expect(row.user_id).toBeNull();
  expect(row.subject).toBeNull();
});

it('rejects unknown consent kinds and cross-origin writes', async () => {
  expect((await api.fetch(request('/api/consent', { kind: 'ads' }))).status).toBe(400);
  expect(
    (await api.fetch(request('/api/consent', { kind: 'cookies' }, { origin: 'https://evil.test' })))
      .status,
  ).toBe(403);
});

it('requires acceptance at signup and persists terms and privacy', async () => {
  const email = `${crypto.randomUUID()}@example.test`;
  await expect(getOrCreateEmailUser(email, 'pt')).rejects.toThrow('consent_required');
  const user = await getOrCreateEmailUser(email, 'pt', true);
  const rows = await env.DB.prepare('SELECT kind FROM consents WHERE user_id = ?')
    .bind(user.id)
    .all();
  expect(rows.results.map((row) => row.kind).sort()).toEqual(['privacy', 'terms']);
});
