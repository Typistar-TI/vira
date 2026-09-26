import { getAdminDashboard } from '@backend/features/admin/dashboard';
export const adminDashboard = (search: string) => getAdminDashboard(search);
