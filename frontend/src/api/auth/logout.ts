import { apiMutation, clearApiCache } from '../request';
export async function logout(scope: 'app' | 'admin' = 'app') {
  await apiMutation(`/api/auth/logout?scope=${scope}`);
  clearApiCache();
}
