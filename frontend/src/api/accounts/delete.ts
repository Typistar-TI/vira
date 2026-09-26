import { apiMutation, clearApiCache } from '../request';
export async function deleteAccount(email: string) {
  const result = await apiMutation('/api/account/delete', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  clearApiCache();
  return result;
}
