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
  it('creates the admin session for an admin email and blocks the app scope', async () => {
    const { email } = await customer();
    await env.DB.prepare('INSERT INTO admin_accounts (email, created_at) VALUES (?, ?)')
      .bind(email, Math.floor(Date.now() / 1000))
      .run();
    await env.DB.prepare(
      "UPDATE app_settings SET value = 'test-client-id', encrypted = 0 WHERE key = 'GOOGLE_CLIENT_ID'",
    ).run();
    jwtVerify.mockResolvedValue({
      payload: { sub: 'google-test-sub', email, email_verified: true },
    });
    const appResponse = await POST(googleRequest('app', 'g_csrf_token=test-csrf'));
    expect(appResponse.status).toBe(303);
    expect(appResponse.headers.get('location')).toMatch(/^\/login\?next=app&error=/);
    expect(appResponse.headers.has('set-cookie')).toBe(false);
    const adminResponse = await POST(googleRequest('admin', 'g_csrf_token=test-csrf'));
    expect(adminResponse.status).toBe(303);
    expect(adminResponse.headers.get('location')).toBe('/admin');
    expect(adminResponse.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
  });

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
