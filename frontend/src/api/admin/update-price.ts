import { apiMutation } from '../request';
export const updatePrice = (body: {
  plan?: string;
  currency?: string;
  amount_minor: number;
  stripe_price_id: string;
  active: boolean;
}) =>
  apiMutation('/api/admin/prices', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
