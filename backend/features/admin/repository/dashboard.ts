import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/platform/config';

export interface AdminFilters {
  kind?: string;
  level?: string;
  q?: string;
  role?: string;
  page?: number;
  size?: number;
}
export type LogFilters = AdminFilters;

const pageSizes = [10, 25, 50, 100];

export async function getAdminDashboard(
  search: string,
  section: string = 'visao',
  filters: AdminFilters = {},
) {
  const logKinds = ['auth', 'admin', 'billing', 'site', 'domain', 'security', 'system'];
  const levels = ['info', 'warning', 'critical'];
  const kindFilter = filters.kind && logKinds.includes(filters.kind) ? filters.kind : '';
  const levelFilter = filters.level && levels.includes(filters.level) ? filters.level : '';
  const roleFilter = ['customer', 'admin'].includes(filters.role ?? '') ? filters.role! : '';
  const logSearch = (filters.q ?? '').trim().slice(0, 80);
  const page = Math.max(1, Math.min(5000, Math.floor(Number(filters.page) || 1)));
  const size = pageSizes.includes(Number(filters.size)) ? Number(filters.size) : 10;
  const pageSize = size;
  const offset = (page - 1) * pageSize;
  const [
    settingsResult,
    pricesResult,
    logsResult,
    logsCountResult,
    emailTemplatesResult,
    emailOutboxResult,
    outboxCountResult,
    counts,
    signupsResult,
    clientsResult,
    peopleResult,
    peopleCountResult,
    domain,
  ] = await Promise.all([
    section === 'visao' || section === 'configuracoes'
      ? env.DB.prepare('SELECT key, value, encrypted FROM app_settings ORDER BY key').all<{
          key: string;
          value: string;
          encrypted: number;
        }>()
      : null,
    section === 'precos' || section === 'visao' || section === 'configuracoes'
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
    section === 'logs'
      ? env.DB.prepare(
          `SELECT created_at, kind, severity, actor_type, actor_id, action, target, ip, user_agent
           FROM logs
           WHERE (? = '' OR kind = ?) AND (? = '' OR severity = ?)
             AND (? = '' OR actor_id LIKE ? OR target LIKE ? OR action LIKE ? OR ip LIKE ?)
           ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        )
          .bind(
            kindFilter,
            kindFilter,
            levelFilter,
            levelFilter,
            logSearch,
            `%${logSearch}%`,
            `%${logSearch}%`,
            `%${logSearch}%`,
            `%${logSearch}%`,
            pageSize,
            offset,
          )
          .all<{
            created_at: number;
            kind: string;
            severity: string;
            actor_type: string | null;
            actor_id: string | null;
            action: string;
            target: string | null;
            ip: string | null;
            user_agent: string | null;
          }>()
      : null,
    section === 'logs'
      ? env.DB.prepare(
          `SELECT count(*) AS n FROM logs
           WHERE (? = '' OR kind = ?) AND (? = '' OR severity = ?)
             AND (? = '' OR actor_id LIKE ? OR target LIKE ? OR action LIKE ? OR ip LIKE ?)`,
        )
          .bind(
            kindFilter,
            kindFilter,
            levelFilter,
            levelFilter,
            logSearch,
            `%${logSearch}%`,
            `%${logSearch}%`,
            `%${logSearch}%`,
            `%${logSearch}%`,
          )
          .first<{ n: number }>()
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
          'SELECT template_key, recipient, status, created_at, sent_at, last_error FROM email_outbox ORDER BY created_at DESC LIMIT ? OFFSET ?',
        )
          .bind(pageSize, offset)
          .all<{
            template_key: string;
            recipient: string;
            status: string;
            created_at: number;
            sent_at: number | null;
            last_error: string | null;
          }>()
      : null,
    section === 'emails'
      ? env.DB.prepare('SELECT count(*) AS n FROM email_outbox').first<{ n: number }>()
      : null,
    section === 'visao'
      ? env.DB.prepare(
          `SELECT
            (SELECT count(*) FROM users) AS users,
            (SELECT count(*) FROM users WHERE created_at >= unixepoch() - 7 * 86400) AS new_users_7d,
            (SELECT count(*) FROM users WHERE plan = 'trial' AND trial_ends_at > unixepoch()) AS trials_active,
            (SELECT count(*) FROM users WHERE plan = 'monthly' AND access_until > unixepoch()) AS monthly_active,
            (SELECT count(*) FROM users WHERE plan = 'yearly' AND access_until > unixepoch()) AS yearly_active,
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
    section === 'visao'
      ? env.DB.prepare(
          `SELECT u.email, s.slug FROM users u JOIN sites s ON s.user_id = u.id
           ORDER BY u.created_at DESC LIMIT 300`,
        ).all<{ email: string | null; slug: string }>()
      : null,
    section === 'usuarios'
      ? env.DB.prepare(
          `SELECT * FROM (
            SELECT 'customer' AS role, u.id AS id, u.email AS email, u.plan AS plan,
              u.created_at AS created_at, u.trial_ends_at AS trial_ends_at,
              u.access_until AS access_until, u.expired_at AS expired_at,
              '' AS name, u.google_sub AS google_sub,
              (SELECT count(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > unixepoch()) AS active_sessions,
              (SELECT count(*) FROM sites si WHERE si.user_id = u.id) AS sites
            FROM users u
            UNION ALL
            SELECT 'admin', a.email, a.email, 'admin', a.created_at, NULL, NULL, NULL,
              a.display_name, a.google_sub,
              (SELECT count(*) FROM admin_sessions s WHERE s.admin_email = a.email AND s.expires_at > unixepoch()), 0
            FROM admin_accounts a
          )
          WHERE (? = '' OR role = ?) AND (? = '' OR COALESCE(email, '') LIKE ?)
          ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        )
          .bind(roleFilter, roleFilter, search, `%${search}%`, pageSize, offset)
          .all<{
            role: 'customer' | 'admin';
            id: string;
            email: string | null;
            plan: string;
            created_at: number;
            trial_ends_at: number | null;
            access_until: number | null;
            expired_at: number | null;
            name: string;
            google_sub: string | null;
            active_sessions: number;
            sites: number;
          }>()
      : null,
    section === 'usuarios'
      ? env.DB.prepare(
          `SELECT count(*) AS n FROM (
            SELECT 'customer' AS role, u.email AS email FROM users u
            UNION ALL SELECT 'admin', a.email FROM admin_accounts a
          ) WHERE (? = '' OR role = ?) AND (? = '' OR COALESCE(email, '') LIKE ?)`,
        )
          .bind(roleFilter, roleFilter, search, `%${search}%`)
          .first<{ n: number }>()
      : null,
    rootDomain(),
  ]);
  const clientDetail = section === 'visao' && search ? await getClientDetail(search) : null;
  const total =
    section === 'usuarios'
      ? (peopleCountResult?.n ?? 0)
      : section === 'logs'
        ? (logsCountResult?.n ?? 0)
        : section === 'emails'
          ? (outboxCountResult?.n ?? 0)
          : 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return {
    settings: settingsResult?.results ?? [],
    prices: pricesResult?.results ?? [],
    logs: logsResult?.results ?? [],
    emailTemplates: emailTemplatesResult?.results ?? [],
    emailOutbox: emailOutboxResult?.results ?? [],
    signups: signupsResult?.results ?? [],
    clients: clientsResult?.results ?? [],
    people: peopleResult?.results ?? [],
    page,
    pages,
    total,
    size,
    counts: counts ?? {
      users: 0,
      new_users_7d: 0,
      trials_active: 0,
      monthly_active: 0,
      yearly_active: 0,
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
    clientDetail,
  };
}

async function getClientDetail(term: string) {
  const account = await env.DB.prepare(
    `SELECT u.id, u.email, u.phone, u.plan, u.created_at, u.trial_ends_at, u.access_until, u.expired_at,
      u.stripe_customer_id, u.stripe_subscription_id, u.google_sub,
      s.id AS site_id, s.slug, s.published_at, s.created_at AS site_created_at,
      (SELECT count(*) FROM sessions se WHERE se.user_id = u.id AND se.expires_at > unixepoch()) AS active_sessions,
      (SELECT count(*) FROM media_assets m WHERE m.site_id = s.id) AS media
     FROM users u JOIN sites s ON s.user_id = u.id
     WHERE s.slug = ? OR u.email = ? LIMIT 1`,
  )
    .bind(term, term)
    .first<{
      id: string;
      email: string | null;
      phone: string;
      plan: string;
      created_at: number;
      trial_ends_at: number;
      access_until: number | null;
      expired_at: number | null;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      google_sub: string | null;
      site_id: string;
      slug: string;
      published_at: number | null;
      site_created_at: number;
      active_sessions: number;
      media: number;
    }>();
  if (!account) return { found: false as const };
  const actor = account.email ?? account.id;
  const [domains, emails, emailCounts, logs, consents, assistant] = await Promise.all([
    env.DB.prepare(
      'SELECT hostname, status, ssl_status, created_at FROM domains WHERE site_id = ? ORDER BY created_at DESC',
    )
      .bind(account.site_id)
      .all<{ hostname: string; status: string; ssl_status: string; created_at: number }>(),
    env.DB.prepare(
      'SELECT template_key, status, created_at, sent_at FROM email_outbox WHERE recipient = ? ORDER BY created_at DESC LIMIT 15',
    )
      .bind(actor)
      .all<{ template_key: string; status: string; created_at: number; sent_at: number | null }>(),
    env.DB.prepare(
      'SELECT status, count(*) AS total FROM email_outbox WHERE recipient = ? GROUP BY status',
    )
      .bind(actor)
      .all<{ status: string; total: number }>(),
    env.DB.prepare(
      'SELECT created_at, kind, severity, action, target, ip FROM logs WHERE actor_id = ? ORDER BY created_at DESC LIMIT 15',
    )
      .bind(actor)
      .all<{
        created_at: number;
        kind: string;
        severity: string;
        action: string;
        target: string | null;
        ip: string | null;
      }>(),
    env.DB.prepare(
      'SELECT kind, created_at FROM consents WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
    )
      .bind(account.id)
      .all<{ kind: string; created_at: number }>(),
    env.DB.prepare(
      'SELECT count(*) AS messages, count(DISTINCT conversation_id) AS conversations FROM assistant_messages WHERE site_id = ?',
    )
      .bind(account.site_id)
      .first<{ messages: number; conversations: number }>(),
  ]);
  return {
    found: true as const,
    account,
    domains: domains.results,
    emails: emails.results,
    emailCounts: emailCounts.results,
    logs: logs.results,
    consents: consents.results,
    assistant: assistant ?? { messages: 0, conversations: 0 },
  };
}
