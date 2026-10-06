import { apiMutation } from '../request';
export const passwordLogin = (email: string, password: string, scope: 'app' | 'admin' = 'app') =>
  apiMutation<{ redirect: string }>(`/api/auth/password?next=${scope}`, {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
