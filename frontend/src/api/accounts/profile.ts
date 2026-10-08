import { apiMutation } from '../request';

export const updateAccountProfile = (displayName: string, avatar: string | null) =>
  apiMutation('/api/account/profile', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName, avatar }),
  });
