import { apiMutation } from '../request';
export const updateUser = (body: Record<string, unknown>) =>
  apiMutation('/api/admin/users', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
