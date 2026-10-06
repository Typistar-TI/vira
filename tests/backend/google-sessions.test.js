import { describe, it, expect, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { jwtVerify } from 'jose';
import { customer, request } from './helpers';
import { POST } from '../../backend/features/auth/controller/google';
import {
  createAdminSession,
  getSessionAdmin,
  getSessionUser,
} from '../../backend/features/auth/service/session';

// Google's verification handshake is mocked; role selection and D1 sessions are real.
vi.mock('jose', () => ({ createRemoteJWKSet: vi.fn(), jwtVerify: vi.fn() }));

function googleRequest(scope, cookie) {
  return new Request(`https://example.test/api/auth/google?next=${scope}`, {
    method: 'POST',
    headers: { origin: 'https://example.test', cookie: `${cookie}; g_csrf_token=test-csrf` },
    body: new URLSearchParams({ g_csrf_token: 'test-csrf', credential: 'test.signed.jwt' }),
  });
}

describe('Google session role selection', () => {
  it.each(['app', 'admin'])(
    'creates only the %s session for an email registered in both roles',
    async (scope) => {
      const { email, cookie: appCookie } = await customer();
      await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
        .bind(email, Math.floor(Date.now() / 1000))
        .run();
      await env.DB.prepare(
        "UPDATE app_settings SET value = 'test-client-id', encrypted = 0 WHERE key = 'GOOGLE_CLIENT_ID'",
      ).run();
      const adminCookie = (await createAdminSession(email)).split(';')[0];
      const cookie = `${appCookie}; ${adminCookie}`;
      jwtVerify.mockResolvedValue({
        payload: { sub: 'google-test-sub', email, email_verified: true },
      });
      const response = await POST(googleRequest(scope, cookie));
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toBe(`/${scope}`);
      expect(response.headers.get('set-cookie')).toMatch(
        scope === 'admin' ? /^__Host-vira_admin_session=/ : /^__Host-vira_session=/,
      );
      expect(response.headers.get('set-cookie')).toContain('Max-Age=2592000');
      expect((await getSessionUser(request('/app', undefined, { cookie }))).email).toBe(email);
      expect((await getSessionAdmin(request('/admin', undefined, { cookie }))).email).toBe(email);
      if (scope === 'app') {
        const combined = `${response.headers.get('set-cookie').split(';')[0]}; ${adminCookie}`;
        expect((await getSessionUser(request('/app', undefined, { cookie: combined }))).email).toBe(
          email,
        );
        expect(
          (
            await env.DB.prepare('SELECT google_sub FROM admin_accounts WHERE email = ?')
              .bind(email)
              .first()
          ).google_sub,
        ).toBeNull();
      }
    },
  );

  it('rejects a non-admin Google identity and preserves the admin sign-in destination on error', async () => {
    const { email, cookie } = await customer();
    await env.DB.prepare(
      "UPDATE app_settings SET value = 'test-client-id', encrypted = 0 WHERE key = 'GOOGLE_CLIENT_ID'",
    ).run();
    jwtVerify.mockResolvedValue({ payload: { sub: 'not-admin-sub', email, email_verified: true } });
    const response = await POST(googleRequest('admin', cookie));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toMatch(/^\/login\?next=admin&error=/);
    expect(response.headers.has('set-cookie')).toBe(false);
  });
});
