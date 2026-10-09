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
  it('creates the admin session for an admin email', async () => {
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
    const response = await POST(googleRequest('app', 'g_csrf_token=test-csrf'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/admin');
    expect(response.headers.get('set-cookie')).toMatch(/^__Host-vira_admin_session=/);
  });

  it('signs a customer Google identity into the app', async () => {
    const { email } = await customer();
    await env.DB.prepare(
      "UPDATE app_settings SET value = 'test-client-id', encrypted = 0 WHERE key = 'GOOGLE_CLIENT_ID'",
    ).run();
    jwtVerify.mockResolvedValue({ payload: { sub: 'not-admin-sub', email, email_verified: true } });
    const response = await POST(googleRequest('app', 'g_csrf_token=test-csrf'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/app');
    expect(response.headers.get('set-cookie')).toMatch(/^__Host-vira_session=/);
  });
});
