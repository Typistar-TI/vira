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
    section === 'clientes'
      ? env.DB.prepare(
          `SELECT u.email, u.plan, u.created_at, u.trial_ends_at, u.access_until, u.stripe_subscription_id, s.slug, s.published_at,
        d.hostname, d.status AS domain_status FROM users u JOIN sites s ON s.user_id = u.id
        LEFT JOIN domains d ON d.site_id = s.id WHERE u.email LIKE ? OR s.slug LIKE ? ORDER BY u.created_at DESC LIMIT 50`,
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
          'SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM sites WHERE published_at IS NOT NULL) AS published, (SELECT count(*) FROM domains) AS domains',
        ).first<{ users: number; published: number; domains: number }>()
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
    counts: counts ?? { users: 0, published: 0, domains: 0 },
    domain,
  };
}
