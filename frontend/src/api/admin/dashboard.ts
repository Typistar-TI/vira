import { getAdminDashboard, type LogFilters } from '@backend/features/admin/repository/dashboard';
export const adminDashboard = (search: string, section: string, filters?: LogFilters) =>
  getAdminDashboard(search, section, filters);
