import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAdminSession, createSession, sameOrigin, sha256 } from '@backend/auth';
import { setting } from '@backend/config';
import { getOrCreateEmailUser } from '@backend/db';
import { json, readJson } from '@backend/http';

function fail() {
  return json({ error: 'Link inválido ou expirado' }, 400, { 'cache-control': 'no-store' });
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403, { 'cache-control': 'no-store' });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return fail();
  try {
    const body = await readJson(request, 2048);
    const token = String(body.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return fail();
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare('DELETE FROM email_login_tokens WHERE token_hash = ? AND expires_at > ? RETURNING email')
      .bind(await sha256(token), now).first<{ email: string }>();
    if (!row) return fail();
    const [existing, admin, controller, contact] = await Promise.all([
      env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(row.email).first(),
      env.DB.prepare('SELECT email FROM admin_accounts WHERE email = ?').bind(row.email).first(),
      setting('PRIVACY_CONTROLLER_NAME'), setting('PRIVACY_CONTACT_EMAIL'),
    ]);
    if (!existing && !admin && (!controller || !contact)) return fail();
    if (admin) return json({ redirect: '/admin' }, 200, {
      'set-cookie': await createAdminSession(row.email), 'cache-control': 'no-store',
    });
    const user = await getOrCreateEmailUser(row.email);
    return json({ redirect: '/app' }, 200, {
      'set-cookie': await createSession(user.id), 'cache-control': 'no-store',
    });
  } catch { return fail(); }
};
