import { env } from 'cloudflare:workers';
import { sameOrigin, sha256 } from '@backend/features/auth/service';
import { setting } from '@backend/platform/config';
import { consumeLimit } from '@backend/features/auth/repository';
import { sendLoginEmail, templateFor } from '@backend/features/emails/service';
import { clientIp, json, readJson } from '@backend/platform/http';

const generic = {
  ok: true,
  message: 'Se o endereço puder receber acesso, enviaremos um link em instantes.',
};

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  let email = '';
  try {
    const body = await readJson(request, 2048);
    email = String(body.email || '')
      .trim()
      .toLowerCase();
  } catch {
    return json({ error: 'Informe um e-mail válido' }, 400);
  }
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: 'Informe um e-mail válido' }, 400);

  const emailHash = await sha256(email);
  const ipHash = await sha256(clientIp(request));
  if (
    !(await consumeLimit(`email-login-global`, 90, 86400)) ||
    !(await consumeLimit(`email-login-ip:${ipHash}`, 10, 3600)) ||
    !(await consumeLimit(`email-login-address:${emailHash}`, 3, 3600))
  ) {
    return json(generic);
  }
  const [key, from, template, controller, contact, existing, admin] = await Promise.all([
    setting('RESEND_API_KEY'),
    setting('AUTH_EMAIL_FROM'),
    templateFor('login'),
    setting('PRIVACY_CONTROLLER_NAME'),
    setting('PRIVACY_CONTACT_EMAIL'),
    env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first(),
    env.DB.prepare('SELECT email FROM admin_accounts WHERE email = ?').bind(email).first(),
  ]);
  if (!key || !from || !template.enabled)
    return json({ error: 'Entrada por e-mail está indisponível' }, 503);
  if (!existing && !admin && (!controller || !contact)) return json(generic);

  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  const tokenHash = await sha256(token);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM email_login_tokens WHERE email = ?').bind(email),
    env.DB.prepare(
      'INSERT INTO email_login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)',
    ).bind(tokenHash, email, Math.floor(Date.now() / 1000) + 900),
  ]);
  try {
    await sendLoginEmail(email, token, tokenHash);
    return json(generic);
  } catch {
    await env.DB.prepare('DELETE FROM email_login_tokens WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
    return json({ error: 'Não foi possível enviar o e-mail agora. Tente novamente.' }, 503);
  }
};
