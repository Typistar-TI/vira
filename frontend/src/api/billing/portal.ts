import { apiMutation } from '../request';
export const billingPortal = () => apiMutation<{ url: string }>('/api/billing/portal');
