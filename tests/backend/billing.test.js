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

it.each(['paid', 'unpaid'])(
  'grants lifetime only after verified paid checkout (%s)',
  async (payment_status) => {
    const { user } = await customer();
    const event = {
      id: 'evt_' + crypto.randomUUID(),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          client_reference_id: user.id,
          customer: 'cus_test',
          mode: 'payment',
          payment_status,
          payment_intent: 'pi_test',
          metadata: { plan: 'lifetime' },
        },
      },
    };
    expect((await webhook(await signedEvent(event))).status).toBe(200);
    expect(
      (await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(user.id).first()).plan,
    ).toBe(payment_status === 'paid' ? 'lifetime' : 'trial');
    expect((await webhook(await signedEvent(event))).status).toBe(200);
    expect(
      (
        await env.DB.prepare('SELECT count(*) AS n FROM stripe_events WHERE id = ?')
          .bind(event.id)
          .first()
      ).n,
    ).toBe(1);
    expect(
      (
        await env.DB.prepare('SELECT count(*) AS n FROM email_outbox WHERE dedupe_key = ?')
          .bind('lifetime-created:pi_test')
          .first()
      ).n,
    ).toBe(payment_status === 'paid' ? 1 : 0);
  },
);

it('revokes lifetime only for a full refund of the matching payment', async () => {
  const { user } = await customer('lifetime');
  await env.DB.prepare(
    'UPDATE users SET stripe_customer_id = ?, lifetime_payment_intent = ? WHERE id = ?',
  )
    .bind('cus_test', 'pi_matching', user.id)
    .run();
  const charge = {
    customer: 'cus_test',
    payment_intent: 'pi_other',
    refunded: true,
    amount: 100,
    amount_refunded: 100,
  };
  const event = () => ({
    id: 'evt_' + crypto.randomUUID(),
    type: 'charge.refunded',
    data: { object: charge },
  });
  expect((await webhook(await signedEvent(event()))).status).toBe(200);
  expect(
    (await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(user.id).first()).plan,
  ).toBe('lifetime');
  charge.payment_intent = 'pi_matching';
  charge.amount_refunded = 50;
  expect((await webhook(await signedEvent(event()))).status).toBe(200);
  expect(
    (await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(user.id).first()).plan,
  ).toBe('lifetime');
  charge.amount_refunded = 100;
  expect((await webhook(await signedEvent(event()))).status).toBe(200);
  expect(
    (await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(user.id).first()).plan,
  ).toBe('expired');
});
