import { apiMutation } from '../request';
export const checkout = (plan: string | undefined, currency: string) =>
  apiMutation<{ url: string }>('/api/billing/checkout', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ plan, currency }),
  });
