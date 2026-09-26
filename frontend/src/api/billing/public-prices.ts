import { publicPrices } from '@backend/features/billing/service';
export const getPublicPrices = () => publicPrices();
export type Plan = 'monthly' | 'yearly' | 'lifetime';
