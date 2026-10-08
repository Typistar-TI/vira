import { env } from 'cloudflare:workers';
import { queueEmail } from '@backend/features/emails/service/emails';
import { rootDomain } from '@backend/platform/config';

interface PendingLog {
  id: string;
  created_at: number;
  kind: string;
  severity: string;
  action: string;
  actor_id: string | null;
  target: string | null;
  ip: string | null;
}

/** Enfileira e-mails (modelo editável) para eventos de segurança ainda não notificados. */
export async function flushSecurityAlerts(limit = 20): Promise<void> {
  const pending = await env.DB.prepare(
    `SELECT id, created_at, kind, severity, action, actor_id, target, ip
     FROM logs
     WHERE alerted_at IS NULL
       AND (severity = 'critical' OR (kind = 'security' AND action IN ('login_denied', 'webhook_rejected')))
     ORDER BY created_at LIMIT ?`,
  )
    .bind(limit)
    .all<PendingLog>();
  if (pending.results.length === 0) return;
  const recipients = (
    await env.DB.prepare('SELECT email FROM admin_accounts').all<{ email: string }>()
  ).results.map((row) => row.email);
  const logsUrl = `https://${await rootDomain()}/admin/logs`;
  for (const log of pending.results) {
    try {
      if (recipients.length > 0) {
        const variables = {
          when: new Date(log.created_at * 1000).toISOString(),
          action: log.action,
          kind: log.kind,
          severity: log.severity,
          actor: log.actor_id ?? '—',
          target: log.target ?? '—',
          ip: log.ip ?? '—',
          logs_url: logsUrl,
        };
        for (const email of recipients) {
          await queueEmail('security_alert', `security-alert:${log.id}:${email}`, email, variables);
        }
      }
      await env.DB.prepare('UPDATE logs SET alerted_at = unixepoch() WHERE id = ?')
        .bind(log.id)
        .run();
    } catch {
      /* tenta novamente na próxima execução */
    }
  }
}
