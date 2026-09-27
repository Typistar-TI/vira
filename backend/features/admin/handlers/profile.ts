import { env } from 'cloudflare:workers';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 1024);
    if (typeof body.displayName !== 'string')
      return json({ error: 'Informe um nome válido.' }, 400);
    const displayName = body.displayName.trim().replace(/\s+/g, ' ');
    if (!displayName || displayName.length > 80)
      return json({ error: 'Informe um nome de até 80 caracteres.' }, 400);
    await env.DB.batch([
      env.DB.prepare('UPDATE admin_accounts SET display_name = ? WHERE email = ?').bind(
        displayName,
        admin.email,
      ),
      env.DB.prepare(
        'INSERT INTO admin_audit (id, actor_id, action, target) VALUES (?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), admin.id, 'update_profile', admin.email),
    ]);
    return json({ ok: true, displayName });
  } catch {
    return json({ error: 'Não foi possível salvar o nome.' }, 400);
  }
};
