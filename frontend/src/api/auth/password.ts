import { apiMutation } from '../request';
export const passwordLogin = (email: string, password: string) =>
  apiMutation<{ redirect: string }>('/api/auth/password', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
