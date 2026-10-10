import type { MetricsReport } from '@backend/features/analytics/entities/metrics';
import { apiQuery } from '../request';

export type { MetricsReport };

export const getMetrics = (days = 30) =>
  apiQuery<MetricsReport>(`/api/metrics?days=${encodeURIComponent(String(days))}`);
