import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { api } from '../../backend/app';
import { customer, request } from './helpers';
import { getSiteForUser } from '../../backend/features/sites/repository/sites';
import { getSessionUser } from '../../backend/features/auth/service/session';

it('exports only the authenticated account without credentials', async () => {
  const a = await customer(),
    b = await customer();
  const response = await api.fetch(request('/api/account/export', undefined, { cookie: a.cookie }));
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.account.id).toBe(a.user.id);
  expect(JSON.stringify(data)).not.toContain(b.email);
  expect(data.account).not.toHaveProperty('password_hash');
  expect(response.headers.get('cache-control')).toBe('no-store');
});

it('requires confirmation for deletion and removes only the authenticated account', async () => {
  const a = await customer(),
    b = await customer(),
    site = await getSiteForUser(a.user.id);
  expect(
    (await api.fetch(request('/api/account/delete', { email: b.email }, { cookie: a.cookie })))
      .status,
  ).toBe(400);
  expect(
    (
      await api.fetch(
        request(
          '/api/account/delete',
          { email: a.email, user_id: b.user.id },
          { cookie: a.cookie },
        ),
      )
    ).status,
  ).toBe(200);
  expect(
    await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(a.user.id).first(),
  ).toBeNull();
  expect(await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(site.id).first()).toBeNull();
  expect(await getSessionUser(request('/app', undefined, { cookie: a.cookie }))).toBeNull();
  expect((await getSessionUser(request('/app', undefined, { cookie: b.cookie }))).id).toBe(
    b.user.id,
  );
});
