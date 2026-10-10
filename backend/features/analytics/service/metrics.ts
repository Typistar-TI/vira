import { setting } from '@backend/platform/config';
import { emptyReport, type MetricsReport } from '../entities/metrics';

type AnalyticsRow = Record<string, unknown>;

async function analyticsQuery(
  accountId: string,
  token: string,
  sql: string,
): Promise<AnalyticsRow[] | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'text/plain' },
        body: sql,
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { data?: AnalyticsRow[] };
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return null;
  }
}

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const list = (rows: AnalyticsRow[] | null) => rows ?? [];

/** Detailed 30-day (or custom) report for a site, read from Analytics Engine. */
export async function siteMetrics(siteId: string, days = 30): Promise<MetricsReport> {
  const [accountId, token] = await Promise.all([
    setting('CLOUDFLARE_ACCOUNT_ID'),
    setting('CLOUDFLARE_ANALYTICS_TOKEN'),
  ]);
  if (!accountId || !token) return { ...emptyReport(days), unavailable: true };
  const id = siteId.replace(/'/g, "''");
  const range = `index1 = '${id}' AND timestamp > NOW() - INTERVAL '${days}' DAY`;
  const [totals, daily, byType, byLabel, paths, referrers, countries, devices, visitorRows] =
    await Promise.all([
      analyticsQuery(
        accountId,
        token,
        `SELECT blob1 AS kind, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} GROUP BY kind`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT formatDateTime(timestamp, '%Y-%m-%d') AS day, blob1 AS kind, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} GROUP BY day, kind ORDER BY day`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob2 AS type, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'click' GROUP BY type ORDER BY total DESC LIMIT 20`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob3 AS label, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'click' GROUP BY label ORDER BY total DESC LIMIT 20`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob2 AS path, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'view' GROUP BY path ORDER BY total DESC LIMIT 20`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob3 AS referrer, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'view' GROUP BY referrer ORDER BY total DESC LIMIT 20`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob4 AS country, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'view' GROUP BY country ORDER BY total DESC LIMIT 20`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT blob5 AS device, SUM(_sample_interval) AS total FROM vira_metrics WHERE ${range} AND blob1 = 'view' GROUP BY device ORDER BY total DESC`,
      ),
      analyticsQuery(
        accountId,
        token,
        `SELECT count(DISTINCT blob6) AS visitors FROM vira_metrics WHERE ${range} AND blob1 = 'view'`,
      ),
    ]);
  if (totals === null) return { ...emptyReport(days), unavailable: true };
  const views = num(totals.find((row) => row.kind === 'view')?.total);
  const clicks = num(totals.find((row) => row.kind === 'click')?.total);
  const byDay = new Map<string, { views: number; clicks: number }>();
  for (const row of list(daily)) {
    const day = String(row.day ?? '').slice(0, 10);
    if (!day) continue;
    const entry = byDay.get(day) ?? { views: 0, clicks: 0 };
    if (row.kind === 'view') entry.views += num(row.total);
    if (row.kind === 'click') entry.clicks += num(row.total);
    byDay.set(day, entry);
  }
  return {
    days,
    views,
    clicks,
    ctr: views ? clicks / views : 0,
    visitors: num(list(visitorRows)[0]?.visitors),
    viewsByDay: [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, value]) => ({ day, ...value })),
    clicksByType: list(byType).map((row) => ({
      type: String(row.type ?? '') || 'outro',
      total: num(row.total),
    })),
    clicksByLabel: list(byLabel).map((row) => ({
      label: String(row.label ?? '') || '—',
      total: num(row.total),
    })),
    topPaths: list(paths).map((row) => ({
      path: String(row.path ?? '') || '/',
      total: num(row.total),
    })),
    topReferrers: list(referrers).map((row) => ({
      referrer: String(row.referrer ?? '') || 'direto',
      total: num(row.total),
    })),
    countries: list(countries).map((row) => ({
      country: String(row.country ?? '') || '—',
      total: num(row.total),
    })),
    devices: list(devices).map((row) => ({
      device: String(row.device ?? '') || 'outro',
      total: num(row.total),
    })),
  };
}
