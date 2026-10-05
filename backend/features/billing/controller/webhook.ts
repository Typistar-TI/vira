import { env } from 'cloudflare:workers';
import Stripe from 'stripe';
import { planForPrice, stripe } from '@backend/features/billing/service/billing';
import { setting } from '@backend/platform/config';
import {
  dashboardUrl,
  endDate,
  endDateParts,
  planNames,
  queueEmail,
  siteUrl,
} from '@backend/features/emails/service/emails';
import { readText } from '@backend/platform/http';

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const item = subscription.items.data[0];
  const plan = item
    ? await planForPrice(typeof item.price === 'string' ? item.price : item.price.id)
    : null;
  const active = subscription.status === 'active' || subscription.status === 'trialing';
  const periodEnd = item?.current_period_end ?? 0;
  const endingAt =
    active && (subscription.cancel_at_period_end || subscription.cancel_at)
      ? subscription.cancel_at || periodEnd
      : null;
  if (plan !== 'monthly' && plan !== 'yearly') return;
  await env.DB.prepare(
    `UPDATE users SET stripe_subscription_id = ?, plan = ?, access_until = ?, expired_at = ?, subscription_ending_at = ?
    WHERE stripe_customer_id = ? AND plan != 'lifetime'`,
  )
    .bind(
      subscription.id,
      active ? plan : 'expired',
      active ? periodEnd : 0,
      active ? null : Math.floor(Date.now() / 1000),
      endingAt,
      customerId,
    )
    .run();
  if (active) {
    const owner = await env.DB.prepare(
      'SELECT u.id, u.email, s.slug FROM users u JOIN sites s ON s.user_id = u.id WHERE u.stripe_customer_id = ? AND u.plan != ?',
    )
      .bind(customerId, 'lifetime')
      .first<{ id: string; email: string | null; slug: string }>();
    if (owner?.email) {
      const [pageUrl, panelUrl] = await Promise.all([siteUrl(owner.slug), dashboardUrl()]);
      const names = planNames(plan);
      await queueEmail(
        'subscription_created',
        `subscription-created:${subscription.id}`,
        owner.email,
        {
          email: owner.email,
          plan: `${names.pt} / ${names.en}`,
          plan_pt: names.pt,
          plan_en: names.en,
          site_url: pageUrl,
          dashboard_url: panelUrl,
        },
      );
      if (
        endingAt &&
        endingAt > Math.floor(Date.now() / 1000) &&
        endingAt <= Math.floor(Date.now() / 1000) + 7 * 86400
      ) {
        const date = endDateParts(endingAt);
        await queueEmail('subscription_ending', `ending:${owner.id}:${endingAt}`, owner.email, {
          email: owner.email,
          plan: `${names.pt} / ${names.en}`,
          plan_pt: names.pt,
          plan_en: names.en,
          site_url: pageUrl,
          dashboard_url: panelUrl,
          end_date: endDate(endingAt),
          end_date_pt: date.pt,
          end_date_en: date.en,
        });
      }
    }
  }
}

export const POST = async (request: Request): Promise<Response> => {
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
            "UPDATE users SET plan = 'lifetime', access_until = NULL, expired_at = NULL, subscription_ending_at = NULL, lifetime_payment_intent = ?, stripe_subscription_id = NULL WHERE id = ?",
          )
            .bind(paymentIntent || null, userId)
            .run();
          const owner = await env.DB.prepare(
            'SELECT u.email, s.slug FROM users u JOIN sites s ON s.user_id = u.id WHERE u.id = ?',
          )
            .bind(userId)
            .first<{ email: string | null; slug: string }>();
          if (owner?.email)
            await queueEmail(
              'subscription_created',
              `lifetime-created:${paymentIntent || session.id}`,
              owner.email,
              {
                email: owner.email,
                plan: 'vitalício / lifetime',
                plan_pt: 'vitalício',
                plan_en: 'lifetime',
                site_url: await siteUrl(owner.slug),
                dashboard_url: await dashboardUrl(),
              },
            );
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
