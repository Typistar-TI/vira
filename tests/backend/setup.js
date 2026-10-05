import { beforeEach, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { applyD1Migrations, reset } from 'cloudflare:test';

beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE app_settings SET value = 'Test', encrypted = 0 WHERE key = 'PRIVACY_CONTROLLER_NAME'",
    ),
    env.DB.prepare(
      "UPDATE app_settings SET value = 'privacy@example.test', encrypted = 0 WHERE key = 'PRIVACY_CONTACT_EMAIL'",
    ),
    env.DB.prepare(
      "UPDATE app_settings SET value = 'example.test', encrypted = 0 WHERE key = 'ROOT_DOMAIN'",
    ),
    env.DB.prepare(
      "UPDATE app_settings SET value = 'test-only', encrypted = 0 WHERE key IN ('RESEND_API_KEY', 'AUTH_EMAIL_FROM', 'STRIPE_SECRET_KEY')",
    ),
  ]);
  // Tests never send real emails or call Stripe/Google/Cloudflare APIs.
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('Unexpected outbound request');
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
