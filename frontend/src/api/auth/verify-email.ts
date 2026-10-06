import { apiMutation } from '../request';
export const verifyEmail = (
  email: string,
  code: string,
  purpose: 'login' | 'password' = 'login',
  password?: string,
  scope: 'app' | 'admin' = 'app',
) =>
  apiMutation<{ redirect: string }>(`/api/auth/email/verify?next=${scope}`, {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, code, purpose, password }),
  });
