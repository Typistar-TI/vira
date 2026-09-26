import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { encrypt } from '@backend/config';
import { isResponse, json, readJson, requireAdmin } from '@backend/http';

const editable = new Set([
  'GOOGLE_CLIENT_ID',
  'RESEND_API_KEY', 'AUTH_EMAIL_FROM',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ANALYTICS_TOKEN',
  'PRIVACY_CONTROLLER_NAME', 'PRIVACY_CONTACT_EMAIL',
]);

export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const rows = await env.DB.prepare('SELECT key, value, encrypted FROM app_settings ORDER BY key').all<{ key: string; value: string; encrypted: number }>();
  return json(rows.results.map(row => ({ key: row.key, configured: Boolean(row.value), encrypted: Boolean(row.encrypted), value: row.encrypted ? '' : row.value, editable: editable.has(row.key) })));
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 8192);
    const key = String(body.key || '');
    if (!editable.has(key)) return json({ error: 'Configuração não editável' }, 400);
    const row = await env.DB.prepare('SELECT encrypted FROM app_settings WHERE key = ?').bind(key).first<{ encrypted: number }>();
    if (!row) return json({ error: 'Configuração desconhecida' }, 404);
    const value = String(body.value ?? '').trim();
    if (value.length > 4096) return json({ error: 'Valor muito longo' }, 400);
    if (row.encrypted && !value && !body.clear) return json({ error: 'Informe um valor ou selecione limpar' }, 400);
    if (key === 'PRIVACY_CONTACT_EMAIL' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return json({ error: 'E-mail inválido' }, 400);
    if (key === 'GOOGLE_CLIENT_ID' && value && !/^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(value)) return json({ error: 'Client ID do Google inválido' }, 400);
    if (key === 'AUTH_EMAIL_FROM' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return json({ error: 'E-mail remetente inválido' }, 400);
    if (key === 'RESEND_API_KEY' && value && !/^re_[A-Za-z0-9_]+$/.test(value)) return json({ error: 'Chave Resend inválida' }, 400);
    if (key === 'STRIPE_SECRET_KEY' && value && !/^sk_(test|live)_[A-Za-z0-9]+$/.test(value)) return json({ error: 'Chave Stripe inválida' }, 400);
    if (key === 'STRIPE_WEBHOOK_SECRET' && value && !/^whsec_[A-Za-z0-9]+$/.test(value)) return json({ error: 'Segredo de webhook inválido' }, 400);
    const stored = row.encrypted && value ? await encrypt(value) : value;
    await env.DB.batch([
      env.DB.prepare('UPDATE app_settings SET value = ?, updated_at = unixepoch() WHERE key = ?').bind(stored, key),
      env.DB.prepare('INSERT INTO admin_audit (id, actor_id, action, target) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), admin.id, body.clear ? 'clear_setting' : 'update_setting', key),
    ]);
    return json({ ok: true, configured: Boolean(value) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao salvar' }, 400);
  }
};
