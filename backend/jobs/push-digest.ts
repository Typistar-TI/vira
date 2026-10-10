import { env } from 'cloudflare:workers';
import { siteMetrics } from '@backend/features/analytics/service/metrics';
import { sendUserPush } from '@backend/features/push/service/send';

/** Weekly performance digest for clients who enabled metrics notifications. */
export async function sendMetricsDigest(limit = 50): Promise<void> {
  const users = await env.DB.prepare(
    `SELECT DISTINCT u.id AS id, s.id AS site_id
     FROM users u
     JOIN sites s ON s.user_id = u.id
     JOIN push_subscriptions p ON p.audience = 'user' AND p.owner = u.id
     WHERE (u.plan IN ('monthly', 'yearly') AND (u.access_until IS NULL OR u.access_until > unixepoch()))
        OR (u.plan = 'trial' AND u.trial_ends_at > unixepoch())
     LIMIT ?`,
  )
    .bind(limit)
    .all<{ id: string; site_id: string }>();
  for (const user of users.results) {
    try {
      const report = await siteMetrics(user.site_id, 7);
      if (report.unavailable || (report.views === 0 && report.clicks === 0)) continue;
      await sendUserPush(user.id, 'metrics', {
        title: 'Resumo da sua página',
        body: `${report.views} visualizações e ${report.clicks} cliques nos últimos 7 dias.`,
        url: '/app/metricas',
        tag: 'metrics-digest',
      });
    } catch {
      /* ignore a single failure */
    }
  }
}
