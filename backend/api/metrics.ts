import type { APIRoute } from 'astro';
import { setting } from '@backend/config';
import { getSiteForUser } from '@backend/db';
import { isResponse, json, requireUser } from '@backend/http';

export const GET: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ views: 0, clicks: 0 });
  const [accountId, analyticsToken] = await Promise.all([
    setting('CLOUDFLARE_ACCOUNT_ID'),
    setting('CLOUDFLARE_ANALYTICS_TOKEN'),
  ]);
  if (!accountId || !analyticsToken) return json({ views: 0, clicks: 0, unavailable: true });
  const query = `SELECT blob1 AS kind, SUM(_sample_interval) AS total FROM vira_metrics WHERE index1 = '${site.id}' AND timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1`;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${analyticsToken}`, 'content-type': 'text/plain' },
      body: query,
    },
  );
  if (!response.ok) return json({ views: 0, clicks: 0, unavailable: true });
  const data = (await response.json()) as { data: { kind: string; total: number }[] };
  return json({
    views: data.data.find((x) => x.kind === 'view')?.total || 0,
    clicks: data.data.find((x) => x.kind === 'click')?.total || 0,
  });
};
