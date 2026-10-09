import { describe, it, expect, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { request, customer } from './helpers';
import { POST as start } from '../../backend/features/auth/controller/start-email';
import { POST as verify } from '../../backend/features/auth/controller/verify-email';
import { POST as password } from '../../backend/features/auth/controller/password';
import { POST as signOut } from '../../backend/features/auth/controller/logout';
import { passwordRecord } from '../../backend/features/auth/service/credentials';
import {
  getSessionUser,
  createAdminSession,
  getSessionAdmin,
  logout,
  sha256,
} from '../../backend/features/auth/service/session';
import { sendLoginEmail } from '../../backend/features/emails/service/emails';

vi.mock('../../backend/features/emails/service/emails', async (importOriginal) => ({
  ...(await importOriginal()),
  sendLoginEmail: vi.fn(async () => {}),
}));

async function issue(email, purpose = 'login') {
  const response = await start(request('/api/auth/email/start', { email, purpose }));
  expect(response.status).toBe(200);
  return sendLoginEmail.mock.calls.at(-1)[1];
}

describe('Email authentication and password lifecycle', () => {
  it('creates a one-day trial, stores only the code hash and consumes the code once', async () => {
    const email = `${crypto.randomUUID()}@example.test`;
    const code = await issue(email);
    expect(code).toMatch(/^\d{6}$/);
    const stored = await env.DB.prepare('SELECT * FROM email_login_codes WHERE email = ?')
      .bind(email)
      .first();
    expect(stored.code_hash).not.toBe(code);
    expect(stored.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(stored.expires_at).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 600);
    const response = await verify(
      request('/api/auth/email/verify', { email, code, acceptTerms: true }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toMatch(
      /^__Host-vira_session=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax;/,
    );
    expect(response.headers.get('set-cookie')).not.toMatch(/Domain=/i);
    expect(await response.json()).toEqual({ redirect: '/app' });
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    expect(user.trial_ends_at - user.created_at).toBe(86400);
    expect((await verify(request('/api/auth/email/verify', { email, code }))).status).toBe(400);
  });

  it.each(['expired', 'locked', 'wrong purpose'])('rejects a %s code', async (state) => {
    const email = `${crypto.randomUUID()}@example.test`;
    const code = await issue(email);
    if (state === 'expired')
      await env.DB.prepare('UPDATE email_login_codes SET expires_at = 1').run();
    if (state === 'locked') {
      const wrong = code === '000000' ? '000001' : '000000';
      for (let i = 0; i < 5; i++)
        expect(
          (await verify(request('/api/auth/email/verify', { email, code: wrong }))).status,
        ).toBe(400);
    }
    expect(
      (
        await verify(
          request('/api/auth/email/verify', {
            email,
            code,
            purpose: state === 'wrong purpose' ? 'password' : 'login',
            password: 'a valid long password',
          }),
        )
      ).status,
    ).toBe(400);
  });

  it('allows only one concurrent redemption', async () => {
    const email = `${crypto.randomUUID()}@example.test`,
      code = await issue(email);
    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        verify(request('/api/auth/email/verify', { email, code, acceptTerms: true })),
      ),
    );
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
  });

  it('throttles resend before sending another email', async () => {
    const email = `${crypto.randomUUID()}@example.test`;
    await issue(email);
    const response = await start(request('/api/auth/email/start', { email }));
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(sendLoginEmail).toHaveBeenCalledTimes(1);
  });

  it('creates and resets a salted password for a customer', async () => {
    const { email, cookie } = await customer();
    const code = await issue(email, 'password');
    expect(
      (
        await verify(
          request('/api/auth/email/verify', {
            email,
            code,
            purpose: 'password',
            password: 'short',
          }),
        )
      ).status,
    ).toBe(400);
    const secret = 'original-long-password';
    expect(
      (
        await verify(
          request('/api/auth/email/verify', { email, code, purpose: 'password', password: secret }),
        )
      ).status,
    ).toBe(200);
    const first = await env.DB.prepare('SELECT * FROM auth_passwords WHERE email = ?')
      .bind(email)
      .first();
    expect(first.password_hash).not.toBe(secret);
    expect(first.salt).toHaveLength(32);
    expect(first.iterations).toBe(100000);
    expect(await getSessionUser(request('/app', undefined, { cookie }))).toBeNull();
    const login = await password(request('/api/auth/password', { email, password: secret }));
    expect(login.status).toBe(200);
    await env.DB.prepare('DELETE FROM rate_limits').run();
    const resetCode = await issue(email, 'password');
    expect(
      (
        await verify(
          request('/api/auth/email/verify', {
            email,
            code: resetCode,
            purpose: 'password',
            password: 'replacement-long-password',
          }),
        )
      ).status,
    ).toBe(200);
    const second = await env.DB.prepare('SELECT * FROM auth_passwords WHERE email = ?')
      .bind(email)
      .first();
    expect(second.salt).not.toBe(first.salt);
    expect(
      await getSessionUser(
        request('/app', undefined, { cookie: login.headers.get('set-cookie').split(';')[0] }),
      ),
    ).toBeNull();
    expect(
      (await password(request('/api/auth/password', { email, password: secret }))).status,
    ).toBe(401);
    expect(
      (
        await password(
          request('/api/auth/password', { email, password: 'replacement-long-password' }),
        )
      ).status,
    ).toBe(200);
  });

  it('sets an admin password without creating a customer account', async () => {
    const email = `${crypto.randomUUID()}@example.test`;
    await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, unixepoch())')
      .bind(email)
      .run();
    const code = await issue(email, 'password');
    const response = await verify(
      request('/api/auth/email/verify', {
        email,
        code,
        purpose: 'password',
        password: 'admin-long-password',
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirect: '/admin' });
    expect(response.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
    expect(
      await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first(),
    ).toBeNull();
    const login = await password(
      request('/api/auth/password', { email, password: 'admin-long-password' }),
    );
    expect(login.status).toBe(200);
    expect(login.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
  });

  it('asks for consent to create an account and rate-limits password attempts', async () => {
    const { email } = await customer();
    const existing = await password(
      request('/api/auth/password', { email, password: 'unknown-password' }),
    );
    expect(existing.status).toBe(401);
    const missing = await password(
      request('/api/auth/password', { email: 'absent@example.test', password: 'unknown-password' }),
    );
    expect(missing.status).toBe(400);
    expect(await missing.text()).toContain('consent');
    for (let i = 1; i < 10; i++)
      expect(
        (await password(request('/api/auth/password', { email, password: 'unknown-password' })))
          .status,
      ).toBe(401);
    const blocked = await password(
      request('/api/auth/password', { email, password: 'unknown-password' }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('900');
  });

  it.each([start, verify, password])('rejects cross-origin authentication', async (handler) => {
    expect(
      (
        await handler(
          request(
            '/api/auth/test',
            { email: 'test@example.test', code: '123456', password: 'long-password' },
            { origin: 'https://evil.test' },
          ),
        )
      ).status,
    ).toBe(403);
  });
});

describe('Sessions', () => {
  it('signs an admin email into the admin area', async () => {
    const { email } = await customer();
    await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
      .bind(email, Math.floor(Date.now() / 1000))
      .run();
    const secret = 'a long secure password';
    const record = await passwordRecord(secret);
    await env.DB.prepare(
      'INSERT INTO auth_passwords (email, password_hash, salt, iterations, updated_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(email, record.hash, record.salt, record.iterations, Math.floor(Date.now() / 1000))
      .run();
    const login = await password(request('/api/auth/password', { email, password: secret }));
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ redirect: '/admin' });
    expect(login.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
  });

  it('email-code login signs an admin email into the admin area', async () => {
    const { email } = await customer();
    await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
      .bind(email, Math.floor(Date.now() / 1000))
      .run();
    const code = await issue(email);
    const response = await verify(request('/api/auth/email/verify', { email, code }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirect: '/admin' });
    expect(response.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
  });

  it('does not grant administrative access to a customer email', async () => {
    const { email } = await customer();
    const code = await issue(email);
    const response = await verify(request('/api/auth/email/verify?next=admin', { email, code }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirect: '/app' });
    expect(response.headers.get('set-cookie')).toMatch(/^__Host-vira_session=/);
    expect(response.headers.get('set-cookie')).not.toContain('admin_session');
  });

  it.each(['app', 'admin'])(
    'logout revokes only %s and leaves the other persistent session intact',
    async (scope) => {
      const { email, cookie: appCookie } = await customer();
      await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
        .bind(email, Math.floor(Date.now() / 1000))
        .run();
      const adminCookie = (await createAdminSession(email)).split(';')[0];
      const cookie = `${appCookie}; ${adminCookie}`;
      expect(
        (
          await signOut(
            request(`/api/auth/logout?scope=${scope}`, {}, { cookie, origin: 'https://evil.test' }),
          )
        ).status,
      ).toBe(403);
      expect((await signOut(request('/api/auth/logout?scope=all', {}, { cookie }))).status).toBe(
        400,
      );
      const response = await signOut(request(`/api/auth/logout?scope=${scope}`, {}, { cookie }));
      expect(response.status).toBe(200);
      expect(response.headers.get('set-cookie')).toMatch(
        scope === 'admin' ? /^__Host-vira_admin_session=;/ : /^__Host-vira_session=;/,
      );
      expect(await getSessionUser(request('/app', undefined, { cookie }))).toEqual(
        scope === 'app' ? null : expect.objectContaining({ email }),
      );
      expect(await getSessionAdmin(request('/admin', undefined, { cookie }))).toEqual(
        scope === 'admin' ? null : expect.objectContaining({ email }),
      );
    },
  );

  it('uses host-only secure HttpOnly cookies, hashes tokens, rejects forged/expired tokens and revokes logout', async () => {
    const { user, cookie } = await customer();
    const token = cookie.split('=')[1];
    const row = await env.DB.prepare('SELECT token_hash FROM sessions WHERE user_id = ?')
      .bind(user.id)
      .first();
    expect(row.token_hash).toBe(await sha256(token));
    expect(row.token_hash).not.toBe(token);
    expect((await getSessionUser(request('/app', undefined, { cookie }))).id).toBe(user.id);
    expect(
      await getSessionUser(request('/app', undefined, { cookie: '__Host-vira_session=forged' })),
    ).toBeNull();
    const headers = await logout(request('/api/auth/logout', {}, { cookie }));
    expect(headers.get('set-cookie')).toContain('Max-Age=0');
    expect(await getSessionUser(request('/app', undefined, { cookie }))).toBeNull();
  });
  it('separates admin sessions from customer sessions and enforces expiry', async () => {
    const { email, cookie } = await customer();
    expect(await getSessionAdmin(request('/admin', undefined, { cookie }))).toBeNull();
    await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
      .bind(email, Math.floor(Date.now() / 1000))
      .run();
    const adminCookie = await createAdminSession(email);
    expect(adminCookie).toMatch(
      /^__Host-vira_admin_session=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax;/,
    );
    expect(adminCookie).not.toMatch(/Domain=/i);
    expect(
      (await getSessionAdmin(request('/admin', undefined, { cookie: adminCookie }))).email,
    ).toBe(email);
    await env.DB.prepare('UPDATE admin_sessions SET expires_at = 1').run();
    expect(await getSessionAdmin(request('/admin', undefined, { cookie: adminCookie }))).toBeNull();
    await env.DB.prepare('UPDATE sessions SET expires_at = 1').run();
    expect(await getSessionUser(request('/app', undefined, { cookie }))).toBeNull();
  });
});
