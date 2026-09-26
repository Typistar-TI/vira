import type { APIRoute } from 'astro';
import { priceFor, stripe, type Currency, type Plan } from '@backend/billing';
import { isResponse, json, readJson, requireUser } from '@backend/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  try {
    const { plan, currency } = await readJson(request, 2048) as { plan: Plan; currency: Currency };
    if (!['monthly', 'yearly', 'lifetime'].includes(plan) || !['brl', 'usd'].includes(currency)) return json({ error: 'Plano inválido' }, 400);
    if (user.plan === 'lifetime') return json({ error: 'Você já tem acesso vitalício' }, 400);
    if (plan !== 'lifetime' && user.stripe_subscription_id && (user.plan === 'monthly' || user.plan === 'yearly')) {
      return json({ error: 'Gerencie ou altere sua assinatura atual no portal de cobrança' }, 400);
    }
    const price = await priceFor(plan, currency);
    const stripeClient = await stripe();
    const stripePrice = await stripeClient.prices.retrieve(price.stripe_price_id!);
    if (!stripePrice.active || stripePrice.currency !== currency || stripePrice.unit_amount !== price.amount_minor ||
      (plan === 'lifetime' ? !!stripePrice.recurring : stripePrice.recurring?.interval !== (plan === 'monthly' ? 'month' : 'year'))) {
      return json({ error: 'O preço cadastrado não confere com o Stripe' }, 409);
    }
    const origin = new URL(request.url).origin;
    const session = await stripeClient.checkout.sessions.create({
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer: user.stripe_customer_id || undefined,
      client_reference_id: user.id,
      line_items: [{ price: price.stripe_price_id!, quantity: 1 }],
      success_url: `${origin}/app?payment=success`,
      cancel_url: `${origin}/app?payment=cancel`,
      metadata: { user_id: user.id, plan },
    });
    return json({ url: session.url });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Não foi possível iniciar a compra' }, 400);
  }
};
