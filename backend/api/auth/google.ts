import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createSession, sha256 } from '@backend/auth';
import { requiredSetting, setting } from '@backend/config';
import { consumeLimit, getOrCreateGoogleUser } from '@backend/db';
import { clientIp, readFormData } from '@backend/http';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function fail(message: string): Response {
  return new Response(null, { status: 303, headers: { location: `/login?error=${encodeURIComponent(message)}`, 'cache-control': 'no-store' } });
}

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return fail('Origem inválida');
  try {
    const form = await readFormData(request, 8192);
    const csrf = String(form.get('g_csrf_token') || '');
    const cookie = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('g_csrf_token='))?.slice(13);
    if (!csrf || !cookie || csrf !== cookie) return fail('Verificação de segurança inválida');
    if (!await consumeLimit(`google-login:${await sha256(clientIp(request))}`, 30, 3600)) return fail('Muitas tentativas. Aguarde antes de entrar');
    const credential = String(form.get('credential') || '');
    if (credential.length > 4096 || credential.split('.').length !== 3) return fail('Resposta do Google inválida');
    const clientId = await requiredSetting('GOOGLE_CLIENT_ID');
    const { payload } = await jwtVerify(credential, googleKeys, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: clientId, algorithms: ['RS256'],
    });
    const sub = payload.sub;
    const email = String(payload.email || '').trim().toLowerCase();
    if (!sub || sub.length > 255 || email.length > 320 || payload.email_verified !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Conta Google sem e-mail verificado');

    const [existing, admin, controller, contact] = await Promise.all([
      env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(sub).first(),
      env.DB.prepare('SELECT email, google_sub FROM admin_accounts WHERE email = ? OR google_sub = ?').bind(email, sub).first<{ email: string; google_sub: string | null }>(),
      setting('PRIVACY_CONTROLLER_NAME'), setting('PRIVACY_CONTACT_EMAIL'),
    ]);
    const isAdmin = Boolean(admin && (!admin.google_sub || admin.google_sub === sub));
    if (!existing && !isAdmin && (!controller || !contact)) return fail('Cadastro temporariamente indisponível');
    if (isAdmin && admin && !admin.google_sub) {
      await env.DB.prepare('UPDATE admin_accounts SET google_sub = ? WHERE email = ? AND google_sub IS NULL').bind(sub, admin.email).run();
    }
    const user = await getOrCreateGoogleUser(sub, email);
    return new Response(null, { status: 303, headers: {
      location: isAdmin ? '/admin' : '/app', 'set-cookie': await createSession(user.id), 'cache-control': 'no-store',
    } });
  } catch {
    return fail('Não foi possível entrar com Google. Tente novamente');
  }
};
