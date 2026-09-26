import { apiQuery } from '../request';
export const getMetrics = () => apiQuery<{ views: number; clicks: number }>('/api/metrics');
