import { setting } from '@backend/platform/config';
import type { MetricRow, SiteMetrics } from '../entities/metrics';
export async function siteMetrics(siteId: string): Promise<SiteMetrics> {
  const [accountId, token] = await Promise.all([
    setting('CLOUDFLARE_ACCOUNT_ID'),
    setting('CLOUDFLARE_ANALYTICS_TOKEN'),
  ]);
  if (!accountId || !token) return { views: 0, clicks: 0, unavailable: true };
  const query = `SELECT blob1 AS kind, SUM(_sample_interval) AS total FROM vira_metrics WHERE index1 = '${siteId.replace(/'/g, "''")}' AND timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1`;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'text/plain' },
      body: query,
    },
  );
  if (!response.ok) return { views: 0, clicks: 0, unavailable: true };
  const data = (await response.json()) as { data: MetricRow[] };
  return {
    views: data.data.find((row) => row.kind === 'view')?.total || 0,
    clicks: data.data.find((row) => row.kind === 'click')?.total || 0,
  };
}
