import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { POST as webhook } from '../../backend/features/billing/controller/webhook';
import { customer } from './helpers';

const secret = 'whsec_test_only_not_production';
async function signedEvent(
  event,
  { timestamp = Math.floor(Date.now() / 1000), tamper = false } = {},
) {
  await env.DB.prepare(
    "UPDATE app_settings SET value = ?, encrypted = 0 WHERE key = 'STRIPE_WEBHOOK_SECRET'",
  )
    .bind(secret)
    .run();
  const body = JSON.stringify(event);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`)),
  );
  const signature = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return new Request('https://example.test/api/billing/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` },
    body: tamper ? body + ' ' : body,
  });
}

it.each(['missing', 'forged', 'stale'])(
  'rejects %s webhook authentication without changing billing',
  async (kind) => {
    const event = { id: crypto.randomUUID(), type: 'test.ignored', data: { object: {} } };
    const req =
      kind === 'missing'
        ? new Request('https://example.test/api/billing/webhook', { method: 'POST', body: '{}' })
        : await signedEvent(event, {
            tamper: kind === 'forged',
            timestamp: kind === 'stale' ? 1 : Math.floor(Date.now() / 1000),
          });
    expect((await webhook(req)).status).toBe(400);
    expect((await env.DB.prepare('SELECT count(*) AS n FROM stripe_events').first()).n).toBe(0);
  },
);

it('updates the plan from a subscription event', async () => {
  const { user } = await customer();
  await env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
    .bind('cus_sub', user.id)
    .run();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO stripe_price_catalog (stripe_price_id, plan, currency, amount_minor) VALUES ('price_month_test', 'monthly', 'brl', 3000)",
  ).run();
  const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
  const event = {
    id: 'evt_' + crypto.randomUUID(),
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test',
        customer: 'cus_sub',
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ price: 'price_month_test', current_period_end: periodEnd }] },
      },
    },
  };
  expect((await webhook(await signedEvent(event))).status).toBe(200);
  const row = await env.DB.prepare(
    'SELECT plan, stripe_subscription_id, access_until FROM users WHERE id = ?',
  )
    .bind(user.id)
    .first();
  expect(row.plan).toBe('monthly');
  expect(row.stripe_subscription_id).toBe('sub_test');
  expect(row.access_until).toBe(periodEnd);
});
