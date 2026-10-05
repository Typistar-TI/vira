import Stripe from 'stripe';
import { requiredSetting } from '@backend/platform/config';

import type { Plan, Currency, PriceRow } from '../entities/price';
export type { Plan, Currency, PriceRow } from '../entities/price';
import { listPrices, findPrice, findPlanForPrice } from '../repository/prices';

export async function stripe() {
  return new Stripe(await requiredSetting('STRIPE_SECRET_KEY'), {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function publicPrices(): Promise<PriceRow[]> {
  return listPrices();
}

export async function priceFor(plan: Plan, currency: Currency): Promise<PriceRow> {
  const row = await findPrice(plan, currency);
  if (
    !row?.active ||
    !row.stripe_price_id?.startsWith('price_') ||
    !row.amount_minor ||
    row.amount_minor <= 0
  ) {
    throw new Error('Preço ainda não configurado');
  }
  return row;
}

export async function planForPrice(priceId: string): Promise<Plan | null> {
  return findPlanForPrice(priceId);
}
