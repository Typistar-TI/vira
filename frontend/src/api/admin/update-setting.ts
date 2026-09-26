import { apiMutation } from '../request';
export const updateSetting = (key: string, value: string) =>
  apiMutation('/api/admin/settings', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
