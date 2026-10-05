import { env } from 'cloudflare:workers';
import type { Currency, Plan, PriceRow } from '../entities/price';
export async function listPrices(): Promise<PriceRow[]> {
  return (
    await env.DB.prepare(
      'SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices WHERE amount_minor > 0',
    ).all<PriceRow>()
  ).results;
}
export function findPrice(plan: Plan, currency: Currency) {
  return env.DB.prepare(
    'SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices WHERE plan = ? AND currency = ?',
  )
    .bind(plan, currency)
    .first<PriceRow>();
}
export async function findPlanForPrice(priceId: string): Promise<Plan | null> {
  return (
    (
      await env.DB.prepare('SELECT plan FROM stripe_price_catalog WHERE stripe_price_id = ?')
        .bind(priceId)
        .first<{ plan: Plan }>()
    )?.plan ?? null
  );
}
