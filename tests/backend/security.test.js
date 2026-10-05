import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { api } from '../../backend/app';
import { consumeLimit } from '../../backend/features/auth/repository/users';
import { readBody, readJson } from '../../backend/platform/http';
import { encrypt, setting } from '../../backend/platform/config';
import { request, customer } from './helpers';
import { sameOriginRead } from '../../backend/features/auth/service/session';

it('grants exactly the available rate-limit slots under concurrency and resets expired windows', async () => {
  const key = crypto.randomUUID();
  const outcomes = await Promise.all(Array.from({ length: 20 }, () => consumeLimit(key, 5, 60)));
  expect(outcomes.filter(Boolean)).toHaveLength(5);
  expect(await consumeLimit(key, 5, 60)).toBe(false);
  await env.DB.prepare('UPDATE rate_limits SET reset_at = 1 WHERE key = ?').bind(key).run();
  expect(await consumeLimit(key, 5, 60)).toBe(true);
});

it.each(['/api/site/save', '/api/site/publish', '/api/account/delete', '/api/admin/settings'])(
  'protects %s from anonymous and cross-origin writes',
  async (path) => {
    expect([401, 403]).toContain((await api.fetch(request(path, {}))).status);
    const { cookie } = await customer();
    expect(
      (await api.fetch(request(path, {}, { cookie, origin: 'https://evil.test' }))).status,
    ).toBe(403);
  },
);

it.each(['https://example.test/api/missing', 'https://tenant.example.test/api/site/save'])(
  'adds no-store and security headers even on rejection: %s',
  async (url) => {
    const response = await api.fetch(new Request(url));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('strict-transport-security')).toContain('includeSubDomains');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
  },
);

it('returns 429 and Retry-After for authenticated route exhaustion', async () => {
  const { cookie, user } = await customer();
  await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)')
    .bind(`api-total:${user.id}`, 120, Math.floor(Date.now() / 1000) + 60)
    .run();
  const response = await api.fetch(request('/api/site/publish', {}, { cookie }));
  expect(response.status).toBe(429);
  expect(response.headers.get('retry-after')).toBe('60');
});

it('enforces declared and streamed body size limits', async () => {
  const declared = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-length': '100' },
    body: 'small',
  });
  await expect(readBody(declared, 10)).rejects.toThrow();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(6));
      controller.enqueue(new Uint8Array(6));
      controller.close();
    },
  });
  await expect(
    readBody(new Request('https://example.test', { method: 'POST', body: stream }), 10),
  ).rejects.toThrow();
});

it.each([null, [], 42, 'value'])('rejects non-object JSON bodies: %j', async (body) => {
  await expect(readJson(request('/api/test', body))).rejects.toThrow('Envie um objeto JSON');
});

it('accepts same-origin browser read metadata, but rejects cross-site reads and writes without Origin', () => {
  expect(
    sameOriginRead(
      new Request('https://example.test', { headers: { 'sec-fetch-site': 'same-origin' } }),
    ),
  ).toBe(true);
  expect(
    sameOriginRead(
      new Request('https://example.test', { headers: { 'sec-fetch-site': 'cross-site' } }),
    ),
  ).toBe(false);
  expect(
    sameOriginRead(
      new Request('https://example.test', {
        method: 'POST',
        headers: { 'sec-fetch-site': 'same-origin' },
      }),
    ),
  ).toBe(false);
});

it('encrypts configuration with randomized authenticated encryption and rejects tampering', async () => {
  const value = 'sensitive-api-key',
    ciphertext = await encrypt(value);
  expect(ciphertext).not.toContain(value);
  expect(await encrypt(value)).not.toBe(ciphertext);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO app_settings (key,value,encrypted,updated_at) VALUES (?,?,1,unixepoch())',
  )
    .bind('TEST_SECRET', ciphertext)
    .run();
  expect(await setting('TEST_SECRET')).toBe(value);
  const bytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  bytes[bytes.length - 1] ^= 1;
  await env.DB.prepare('UPDATE app_settings SET value = ? WHERE key = ?')
    .bind(btoa(String.fromCharCode(...bytes)), 'TEST_SECRET')
    .run();
  await expect(setting('TEST_SECRET')).rejects.toThrow();
});
