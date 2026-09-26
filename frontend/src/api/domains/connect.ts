import { apiMutation } from '../request';
export const connectDomain = (hostname: string) =>
  apiMutation<{ hostname: string; target: string }>('/api/domains/connect', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ hostname }),
  });
