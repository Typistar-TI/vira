import { getAdminDashboard } from '@backend/features/admin/repository/dashboard';
export const adminDashboard = (search: string, section: string) =>
  getAdminDashboard(search, section);
