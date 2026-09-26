import { apiMutation } from '../request';
export const verifyEmail = (token: string) =>
  apiMutation<{ redirect: string }>('/api/auth/email/verify', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
