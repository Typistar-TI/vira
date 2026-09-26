import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createSession, sameOrigin, sha256 } from '@backend/auth';
import { setting } from '@backend/config';
import { getOrCreateEmailUser } from '@backend/db';
import { readFormData } from '@backend/http';

function fail() {
  return new Response(null, { status: 303, headers: { location: '/login?error=Link%20inv%C3%A1lido%20ou%20expirado', 'cache-control': 'no-store' } });
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return fail();
  try {
    const form = await readFormData(request, 2048);
    const token = String(form.get('token') || '');
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
    const user = await getOrCreateEmailUser(row.email);
    return new Response(null, { status: 303, headers: {
      location: admin ? '/admin' : '/app', 'set-cookie': await createSession(user.id), 'cache-control': 'no-store',
    } });
  } catch { return fail(); }
};
