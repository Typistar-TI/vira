import { apiQuery } from '../request';
export const domainStatus = () =>
  apiQuery<{ domain?: { hostname: string; status: string; sslStatus: string } }>(
    '/api/domains/status',
  );
