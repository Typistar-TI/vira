import { env } from 'cloudflare:workers';
import {
  dashboardUrl,
  endDate,
  endDateParts,
  planNames,
  queueEmail,
  siteUrl,
} from '@backend/features/emails/service';

export async function queueEndingReminders() {
  const now = Math.floor(Date.now() / 1000);
  const due = await env.DB.prepare(
    `SELECT u.id, u.email, u.plan, u.trial_ends_at, u.subscription_ending_at, s.slug
     FROM users u JOIN sites s ON s.user_id = u.id
     WHERE u.email IS NOT NULL AND
       ((u.plan = 'trial' AND u.trial_ends_at > ? AND u.trial_ends_at <= ?)
       OR (u.plan IN ('monthly', 'yearly') AND u.subscription_ending_at > ? AND u.subscription_ending_at <= ?))
     AND NOT EXISTS (
       SELECT 1 FROM email_outbox e
       WHERE e.dedupe_key = 'ending:' || u.id || ':' ||
         CASE WHEN u.plan = 'trial' THEN u.trial_ends_at ELSE u.subscription_ending_at END
     )
     ORDER BY u.created_at LIMIT 200`,
  )
    .bind(now, now + 2 * 86400, now, now + 7 * 86400)
    .all<{
      id: string;
      email: string;
      plan: string;
      trial_ends_at: number;
      subscription_ending_at: number | null;
      slug: string;
    }>();
  const panelUrl = await dashboardUrl();
  for (const user of due.results) {
    const endingAt = user.plan === 'trial' ? user.trial_ends_at : user.subscription_ending_at!;
    const names = planNames(user.plan as 'trial' | 'monthly' | 'yearly');
    const date = endDateParts(endingAt);
    await queueEmail('subscription_ending', `ending:${user.id}:${endingAt}`, user.email, {
      email: user.email,
      plan: `${names.pt} / ${names.en}`,
      plan_pt: names.pt,
      plan_en: names.en,
      end_date: endDate(endingAt),
      end_date_pt: date.pt,
      end_date_en: date.en,
      site_url: await siteUrl(user.slug),
      dashboard_url: panelUrl,
    });
  }
}
