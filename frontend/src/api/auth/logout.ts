import { apiMutation, clearApiCache } from '../request';
export async function logout() {
  await apiMutation('/api/auth/logout');
  clearApiCache();
}
