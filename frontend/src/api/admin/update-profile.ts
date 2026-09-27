import { apiMutation } from '../request';

export const updateProfile = (displayName: string) =>
  apiMutation('/api/admin/profile', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
