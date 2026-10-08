import { env } from 'cloudflare:workers';
import { escapeHtml, sendEmailNow } from '@backend/features/emails/service/emails';
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

function alertHtml(log: PendingLog, logsUrl: string): string {
  const row = (label: string, value: string | null) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#625a51">${label}</td><td style="padding:4px 0"><strong>${escapeHtml(value ?? '—')}</strong></td></tr>`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b">
    <h1 style="color:#a13a3a">Alerta de segurança / Security alert</h1>
    <p>Um evento de segurança foi registrado no Vira.<br>A security event was recorded on Vira.</p>
    <table style="font-size:14px;border-collapse:collapse">
      ${row('Quando / When', new Date(log.created_at * 1000).toISOString())}
      ${row('Ação / Action', log.action)}
      ${row('Tipo / Kind', `${log.kind} · ${log.severity}`)}
      ${row('Ator / Actor', log.actor_id)}
      ${row('Alvo / Target', log.target)}
      ${row('IP', log.ip)}
    </table>
    <p><a href="${logsUrl}" style="color:#9b6823">Ver logs / View logs</a></p>
  </div>`;
}

/** Envia e-mails para eventos de segurança críticos ainda não notificados. */
export async function flushSecurityAlerts(limit = 10): Promise<void> {
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
        const html = alertHtml(log, logsUrl);
        await Promise.all(
          recipients.map((email) =>
            sendEmailNow(
              email,
              { subject: 'Alerta de segurança · Vira / Security alert', html },
              `security-alert:${log.id}:${email}`,
            ),
          ),
        );
      }
      await env.DB.prepare('UPDATE logs SET alerted_at = unixepoch() WHERE id = ?')
        .bind(log.id)
        .run();
    } catch {
      /* tenta novamente na próxima execução */
    }
  }
}
