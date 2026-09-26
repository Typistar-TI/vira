import { env } from 'cloudflare:workers';
import Stripe from 'stripe';
import { requiredSetting } from '../config';

export type Plan = 'monthly' | 'yearly' | 'lifetime';
export type Currency = 'brl' | 'usd';

export interface PriceRow {
  plan: Plan;
  currency: Currency;
  amount_minor: number | null;
  stripe_price_id: string | null;
  active: number;
}

export async function stripe() {
  return new Stripe(await requiredSetting('STRIPE_SECRET_KEY'), {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function publicPrices(): Promise<PriceRow[]> {
  const result = await env.DB.prepare("SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices WHERE active = 1 AND amount_minor > 0 AND stripe_price_id LIKE 'price_%'").all<PriceRow>();
  return result.results;
}

export async function priceFor(plan: Plan, currency: Currency): Promise<PriceRow> {
  const row = await env.DB.prepare('SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices WHERE plan = ? AND currency = ?')
    .bind(plan, currency).first<PriceRow>();
  if (!row?.active || !row.stripe_price_id?.startsWith('price_') || !row.amount_minor || row.amount_minor <= 0) {
    throw new Error('Preço ainda não configurado');
  }
  return row;
}

export async function planForPrice(priceId: string): Promise<Plan | null> {
  const row = await env.DB.prepare('SELECT plan FROM stripe_price_catalog WHERE stripe_price_id = ?')
    .bind(priceId).first<{ plan: Plan }>();
  return row?.plan || null;
}
