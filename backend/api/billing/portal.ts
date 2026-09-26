import { stripe } from '@backend/billing';
import { isResponse, json, requireUser } from '@backend/http';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  if (!user.stripe_customer_id) return json({ error: 'Nenhuma assinatura encontrada' }, 400);
  const session = await (
    await stripe()
  ).billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${new URL(request.url).origin}/app`,
  });
  return json({ url: session.url });
};
