import { env } from 'cloudflare:workers';
import { isResponse, requireAdmin } from '@backend/platform/http';

function csvCell(value: string | null): string {
  const text = value ?? '';
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const logKinds = ['auth', 'admin', 'billing', 'site', 'domain', 'security', 'system'];
const levels = ['info', 'warning', 'critical'];

export const GET = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const url = new URL(request.url);
  const kindParam = url.searchParams.get('kind') || '';
  const levelParam = url.searchParams.get('level') || '';
  const kind = logKinds.includes(kindParam) ? kindParam : '';
  const level = levels.includes(levelParam) ? levelParam : '';
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80);
  const rows = await env.DB.prepare(
    `SELECT created_at, kind, severity, actor_type, actor_id, action, target, ip, user_agent
     FROM logs
     WHERE (? = '' OR kind = ?) AND (? = '' OR severity = ?)
       AND (? = '' OR actor_id LIKE ? OR target LIKE ? OR action LIKE ? OR ip LIKE ?)
     ORDER BY created_at DESC LIMIT 5000`,
  )
    .bind(kind, kind, level, level, q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
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
    }>();
  const lines = ['data,tipo,nivel,ator_tipo,ator,acao,alvo,ip,user_agent'];
  for (const row of rows.results) {
    lines.push(
      [
        new Date(row.created_at * 1000).toISOString(),
        row.kind,
        row.severity,
        row.actor_type,
        row.actor_id,
        row.action,
        row.target,
        row.ip,
        row.user_agent,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return new Response(`\uFEFF${lines.join('\r\n')}`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="vira-logs.csv"',
      'cache-control': 'no-store',
    },
  });
};
