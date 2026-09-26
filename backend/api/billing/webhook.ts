import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import Stripe from 'stripe';
import { planForPrice, stripe } from '@backend/billing';
import { setting } from '@backend/config';
import { readText } from '@backend/http';

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const item = subscription.items.data[0];
  const plan = item
    ? await planForPrice(typeof item.price === 'string' ? item.price : item.price.id)
    : null;
  const active = subscription.status === 'active' || subscription.status === 'trialing';
  const periodEnd = item?.current_period_end ?? 0;
  if (plan !== 'monthly' && plan !== 'yearly') return;
  await env.DB.prepare(
    `UPDATE users SET stripe_subscription_id = ?, plan = ?, access_until = ?, expired_at = ?
    WHERE stripe_customer_id = ? AND plan != 'lifetime'`,
  )
    .bind(
      subscription.id,
      active ? plan : 'expired',
      active ? periodEnd : 0,
      active ? null : Math.floor(Date.now() / 1000),
      customerId,
    )
    .run();
}

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = await setting('STRIPE_WEBHOOK_SECRET');
  if (!signature || !webhookSecret) return new Response('Missing signature', { status: 400 });
  let event: Stripe.Event;
  try {
    event = await (
      await stripe()
    ).webhooks.constructEventAsync(
      await readText(request),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
  const seen = await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?')
    .bind(event.id)
    .first();
  if (seen) return new Response('OK');
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.user_id;
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (userId && customerId) {
        await env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
          .bind(customerId, userId)
          .run();
        if (
          session.mode === 'payment' &&
          session.payment_status === 'paid' &&
          session.metadata?.plan === 'lifetime'
        ) {
          const paymentIntent =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id;
          const oldSubscription = await env.DB.prepare(
            'SELECT stripe_subscription_id FROM users WHERE id = ?',
          )
            .bind(userId)
            .first<{ stripe_subscription_id: string | null }>();
          if (oldSubscription?.stripe_subscription_id)
            await (await stripe()).subscriptions.cancel(oldSubscription.stripe_subscription_id);
          await env.DB.prepare(
            "UPDATE users SET plan = 'lifetime', access_until = NULL, expired_at = NULL, lifetime_payment_intent = ?, stripe_subscription_id = NULL WHERE id = ?",
          )
            .bind(paymentIntent || null, userId)
            .run();
        } else if (session.mode === 'subscription' && session.subscription) {
          const id =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          await updateSubscription(await (await stripe()).subscriptions.retrieve(id));
        }
      }
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await updateSubscription(event.data.object);
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      if (
        charge.refunded &&
        charge.amount_refunded >= charge.amount &&
        charge.customer &&
        charge.payment_intent
      ) {
        const customerId =
          typeof charge.customer === 'string' ? charge.customer : charge.customer.id;
        const paymentIntent =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent.id;
        await env.DB.prepare(
          "UPDATE users SET plan = 'expired', access_until = 0, expired_at = ?, lifetime_payment_intent = NULL WHERE stripe_customer_id = ? AND lifetime_payment_intent = ? AND plan = 'lifetime'",
        )
          .bind(Math.floor(Date.now() / 1000), customerId, paymentIntent)
          .run();
      }
    }
    await env.DB.prepare('INSERT INTO stripe_events (id, created_at) VALUES (?, ?)')
      .bind(event.id, Math.floor(Date.now() / 1000))
      .run();
    return new Response('OK');
  } catch {
    return new Response('Retry later', { status: 500 });
  }
};
