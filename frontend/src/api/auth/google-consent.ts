import { apiMutation } from '../request';

export const googleConsent = () =>
  apiMutation<{ redirect: string }>('/api/auth/google/consent', {
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
