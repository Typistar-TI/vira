export type Plan = 'monthly' | 'yearly';
export type Currency = 'brl' | 'usd';
export interface PriceRow {
  plan: Plan;
  currency: Currency;
  amount_minor: number | null;
  stripe_price_id: string | null;
  active: number;
}
