import { env } from 'cloudflare:workers';
import { sameOrigin, sha256 } from '@backend/features/auth/service/session';
import { setting } from '@backend/platform/config';
import { consumeLimit } from '@backend/features/auth/repository/users';
import { sendLoginEmail, templateFor } from '@backend/features/emails/service/emails';
import { clientIp, json, readJson } from '@backend/platform/http';
import { codeHash, newCode, normalizeEmail, type CodePurpose } from '../service/credentials';

const generic = {
  ok: true,
  message: 'Se o endereço puder receber acesso, enviaremos um código em instantes.',
};

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  let email = '';
  let purpose: CodePurpose = 'login';
  try {
    const body = await readJson(request, 2048);
    email = normalizeEmail(body.email) || '';
    purpose = body.purpose === 'password' ? 'password' : 'login';
  } catch {
    return json({ error: 'Informe um e-mail válido' }, 400);
  }
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: 'Informe um e-mail válido' }, 400);

  const emailHash = await sha256(email);
  const ipHash = await sha256(clientIp(request));
  if (
    !(await consumeLimit(`email-login-ip:${ipHash}`, 10, 3600)) ||
    !(await consumeLimit(`email-login-address:${emailHash}`, 3, 3600)) ||
    !(await consumeLimit(`email-login-cooldown:${emailHash}`, 1, 60)) ||
    !(await consumeLimit(`email-login-global`, 90, 86400))
  ) {
    return json(
      {
        error:
          'Limite de envio atingido. Aguarde uma hora. / Sending limit reached. Wait one hour.',
      },
      429,
      { 'retry-after': '3600' },
    );
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

  const code = newCode();
  const hash = await codeHash(email, code, purpose);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM email_login_codes WHERE email = ?').bind(email),
    env.DB.prepare(
      'INSERT INTO email_login_codes (code_hash, email, purpose, expires_at) VALUES (?, ?, ?, ?)',
    ).bind(hash, email, purpose, Math.floor(Date.now() / 1000) + 600),
  ]);
  try {
    await sendLoginEmail(email, code, hash);
    return json(generic);
  } catch {
    await env.DB.prepare('DELETE FROM email_login_codes WHERE code_hash = ?').bind(hash).run();
    return json({ error: 'Não foi possível enviar o e-mail agora. Tente novamente.' }, 503);
  }
};
