import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/platform/config';

export async function getAdminDashboard(search: string, section: string = 'visao') {
  const [
    settingsResult,
    pricesResult,
    customersResult,
    domainsResult,
    auditResult,
    emailTemplatesResult,
    emailOutboxResult,
    counts,
    signupsResult,
    domain,
  ] = await Promise.all([
    section === 'visao' || section === 'configuracoes'
      ? env.DB.prepare('SELECT key, value, encrypted FROM app_settings ORDER BY key').all<{
          key: string;
          value: string;
          encrypted: number;
        }>()
      : null,
    section === 'precos'
      ? env.DB.prepare(
          'SELECT plan, currency, amount_minor, stripe_price_id, active FROM plan_prices ORDER BY currency, plan',
        ).all<{
          plan: string;
          currency: string;
          amount_minor: number | null;
          stripe_price_id: string | null;
          active: number;
        }>()
      : null,
    section === 'clientes' || section === 'visao'
      ? env.DB.prepare(
          `SELECT u.email, u.plan, u.created_at, u.trial_ends_at, u.access_until, u.stripe_subscription_id, s.slug, s.published_at,
        d.hostname, d.status AS domain_status FROM users u JOIN sites s ON s.user_id = u.id
        LEFT JOIN domains d ON d.site_id = s.id WHERE u.email LIKE ? OR s.slug LIKE ? ORDER BY u.created_at DESC LIMIT ${section === 'visao' ? 6 : 50}`,
        )
          .bind(`%${search}%`, `%${search}%`)
          .all<{
            email: string | null;
            plan: string;
            created_at: number;
            trial_ends_at: number;
            access_until: number | null;
            stripe_subscription_id: string | null;
            slug: string;
            published_at: number | null;
            hostname: string | null;
            domain_status: string | null;
          }>()
      : null,
    section === 'dominios'
      ? env.DB.prepare(
          `SELECT d.hostname, d.status, d.ssl_status, d.created_at, u.email, s.slug FROM domains d
        JOIN sites s ON s.id = d.site_id JOIN users u ON u.id = s.user_id ORDER BY d.created_at DESC LIMIT 100`,
        ).all<{
          hostname: string;
          status: string;
          ssl_status: string;
          created_at: number;
          email: string | null;
          slug: string;
        }>()
      : null,
    section === 'atividade'
      ? env.DB.prepare(
          'SELECT action, target, created_at FROM admin_audit ORDER BY created_at DESC LIMIT 10',
        ).all<{ action: string; target: string; created_at: number }>()
      : null,
    section === 'emails'
      ? env.DB.prepare(
          'SELECT key, enabled, subject, html, updated_at FROM email_templates ORDER BY key',
        ).all<{
          key: 'login' | 'site_created' | 'subscription_created' | 'subscription_ending';
          enabled: number;
          subject: string;
          html: string;
          updated_at: number;
        }>()
      : null,
    section === 'emails'
      ? env.DB.prepare(
          'SELECT template_key, recipient, status, created_at, sent_at, last_error FROM email_outbox ORDER BY created_at DESC LIMIT 20',
        ).all<{
          template_key: string;
          recipient: string;
          status: string;
          created_at: number;
          sent_at: number | null;
          last_error: string | null;
        }>()
      : null,
    section === 'visao'
      ? env.DB.prepare(
          `SELECT
            (SELECT count(*) FROM users) AS users,
            (SELECT count(*) FROM users WHERE created_at >= unixepoch() - 7 * 86400) AS new_users_7d,
            (SELECT count(*) FROM users WHERE plan = 'trial' AND trial_ends_at > unixepoch()) AS trials_active,
            (SELECT count(*) FROM users WHERE plan = 'monthly' AND access_until > unixepoch()) AS monthly_active,
            (SELECT count(*) FROM users WHERE plan = 'yearly' AND access_until > unixepoch()) AS yearly_active,
            (SELECT count(*) FROM users WHERE plan = 'lifetime') AS lifetime,
            (SELECT count(*) FROM users WHERE plan = 'expired' OR (plan = 'trial' AND trial_ends_at <= unixepoch()) OR (plan IN ('monthly', 'yearly') AND (access_until IS NULL OR access_until <= unixepoch()))) AS access_ended,
            (SELECT count(*) FROM sites WHERE published_at IS NOT NULL) AS published,
            (SELECT count(*) FROM sites WHERE published_at IS NULL) AS drafts,
            (SELECT count(*) FROM domains) AS domains,
            (SELECT count(*) FROM domains WHERE status = 'active' AND ssl_status = 'active') AS domains_active,
            (SELECT count(*) FROM email_outbox WHERE status = 'pending' OR status = 'sending') AS emails_queued,
            (SELECT count(*) FROM email_outbox WHERE status = 'failed') AS emails_failed,
            (SELECT count(*) FROM email_outbox WHERE status = 'sent' AND sent_at >= unixepoch() - 30 * 86400) AS emails_sent_30d`,
        ).first<{
          users: number;
          new_users_7d: number;
          trials_active: number;
          monthly_active: number;
          yearly_active: number;
          lifetime: number;
          access_ended: number;
          published: number;
          drafts: number;
          domains: number;
          domains_active: number;
          emails_queued: number;
          emails_failed: number;
          emails_sent_30d: number;
        }>()
      : null,
    section === 'visao'
      ? env.DB.prepare(
          `SELECT date(created_at, 'unixepoch') AS day, count(*) AS total FROM users
           WHERE created_at >= unixepoch() - 13 * 86400 GROUP BY day`,
        ).all<{ day: string; total: number }>()
      : null,
    section === 'clientes' ? rootDomain() : '',
  ]);
  return {
    settings: settingsResult?.results ?? [],
    prices: pricesResult?.results ?? [],
    customers: customersResult?.results ?? [],
    domains: domainsResult?.results ?? [],
    audit: auditResult?.results ?? [],
    emailTemplates: emailTemplatesResult?.results ?? [],
    emailOutbox: emailOutboxResult?.results ?? [],
    signups: signupsResult?.results ?? [],
    counts: counts ?? {
      users: 0,
      new_users_7d: 0,
      trials_active: 0,
      monthly_active: 0,
      yearly_active: 0,
      lifetime: 0,
      access_ended: 0,
      published: 0,
      drafts: 0,
      domains: 0,
      domains_active: 0,
      emails_queued: 0,
      emails_failed: 0,
      emails_sent_30d: 0,
    },
    domain,
  };
}
