import { publicPrices } from '@backend/features/billing/service/billing';
export const getPublicPrices = () => publicPrices();
export type Plan = 'monthly' | 'yearly' | 'lifetime';
