import { env } from 'cloudflare:workers';
import { stripe, type Currency, type Plan } from '@backend/features/billing/service/billing';
import { logEvent } from '@backend/features/logs/repository/logs';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

export const GET = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const rows = await env.DB.prepare(
    'SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices ORDER BY currency, plan',
  ).all();
  return json(rows.results);
};

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 4096);
    const plan = String(body.plan) as Plan;
    const currency = String(body.currency) as Currency;
    const active = body.active === true;
    const amount = Number(body.amount_minor);
    const priceId = String(body.stripe_price_id || '').trim();
    if (!['monthly', 'yearly'].includes(plan) || !['brl', 'usd'].includes(currency))
      return json({ error: 'Plano ou moeda inválidos' }, 400);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000)
      return json({ error: 'Preço inválido' }, 400);
    if (priceId && !/^price_[A-Za-z0-9]+$/.test(priceId))
      return json({ error: 'ID de preço Stripe inválido' }, 400);
    if (active) {
      if (!amount || !priceId) return json({ error: 'Informe valor e ID Stripe para ativar' }, 400);
      const price = await (await stripe()).prices.retrieve(priceId);
      if (
        !price.active ||
        price.currency !== currency ||
        price.unit_amount !== amount ||
        price.recurring?.interval !== (plan === 'monthly' ? 'month' : 'year')
      ) {
        return json({ error: 'O preço na Stripe não corresponde ao plano, moeda ou valor' }, 400);
      }
      const mapped = await env.DB.prepare(
        'SELECT plan, currency, amount_minor FROM stripe_price_catalog WHERE stripe_price_id = ?',
      )
        .bind(priceId)
        .first<{ plan: string; currency: string; amount_minor: number }>();
      if (
        mapped &&
        (mapped.plan !== plan || mapped.currency !== currency || mapped.amount_minor !== amount)
      ) {
        return json({ error: 'Este Price ID já pertence a outro plano ou valor' }, 400);
      }
    }
    const queries = [
      env.DB.prepare(
        'UPDATE plan_prices SET amount_minor = ?, stripe_price_id = ?, active = ?, updated_at = unixepoch() WHERE plan = ? AND currency = ?',
      ).bind(amount || null, priceId || null, active ? 1 : 0, plan, currency),
    ];
    if (active)
      queries.push(
        env.DB.prepare(
          'INSERT OR IGNORE INTO stripe_price_catalog (stripe_price_id, plan, currency, amount_minor) VALUES (?, ?, ?, ?)',
        ).bind(priceId, plan, currency, amount),
      );
    await env.DB.batch(queries);
    await logEvent(request, {
      kind: 'admin',
      action: 'update_price',
      actorType: 'admin',
      actorId: admin.id,
      target: `${plan}:${currency}`,
      metadata: { amount, active },
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao salvar preço' }, 400);
  }
};
