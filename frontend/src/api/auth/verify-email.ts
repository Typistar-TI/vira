import { apiMutation } from '../request';
export const verifyEmail = (
  email: string,
  code: string,
  purpose: 'login' | 'password' = 'login',
  password?: string,
) =>
  apiMutation<{ redirect: string }>('/api/auth/email/verify', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, code, purpose, password }),
  });
