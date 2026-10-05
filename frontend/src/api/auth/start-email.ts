import { apiMutation } from '../request';
export const startEmail = (email: string, purpose: 'login' | 'password' = 'login') =>
  apiMutation<{ message: string }>('/api/auth/email/start', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
