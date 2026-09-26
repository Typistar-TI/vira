import type { APIRoute } from 'astro';
import { stripe } from '@/server/billing';
import { isResponse, json, requireUser } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  if (!user.stripe_customer_id) return json({ error: 'Nenhuma assinatura encontrada' }, 400);
  const session = await (await stripe()).billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${new URL(request.url).origin}/app`,
  });
  return json({ url: session.url });
};
