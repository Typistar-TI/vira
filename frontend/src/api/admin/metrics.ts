import type { MetricsReport } from '@backend/features/analytics/entities/metrics';
import { apiQuery } from '../request';

export const getAdminMetrics = (site: string, days = 30) =>
  apiQuery<MetricsReport>(
    `/api/admin/metrics?site=${encodeURIComponent(site)}&days=${encodeURIComponent(String(days))}`,
  );
