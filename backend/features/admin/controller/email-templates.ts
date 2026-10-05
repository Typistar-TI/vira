import { env } from 'cloudflare:workers';
import {
  emailKinds,
  templateFor,
  validateTemplate,
  type EmailKind,
} from '@backend/features/emails/service/emails';
import { setting } from '@backend/platform/config';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 40_000);
    const key = String(body.key || '') as EmailKind;
    if (!emailKinds.includes(key)) return json({ error: 'Tipo de e-mail inválido' }, 400);
    const subject = String(body.subject || '').trim();
    const html = String(body.html || '').trim();
    const enabled = body.enabled === true;
    const error = validateTemplate(key, subject, html);
    if (error) return json({ error }, 400);
    if (key === 'login' && !enabled && !(await setting('GOOGLE_CLIENT_ID')))
      return json({ error: 'Ative o Google antes de desligar o e-mail de acesso.' }, 400);
    const current = await templateFor(key);
    if (current.enabled === Number(enabled) && current.subject === subject && current.html === html)
      return json({ ok: true });
    await env.DB.batch([
      env.DB.prepare(
        'UPDATE email_templates SET enabled = ?, subject = ?, html = ?, updated_at = unixepoch() WHERE key = ?',
      ).bind(Number(enabled), subject, html, key),
      env.DB.prepare(
        'INSERT INTO admin_audit (id, actor_id, action, target) VALUES (?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), admin.id, 'update_email_template', key),
    ]);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao salvar' }, 400);
  }
};
