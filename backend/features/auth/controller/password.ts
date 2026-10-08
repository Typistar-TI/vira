import { env } from 'cloudflare:workers';
import { sameOrigin } from '../service/session';
import {
  derivePassword,
  equalHashes,
  establishLogin,
  loginLimits,
  normalizeEmail,
  passwordRecord,
  rateLimited,
} from '../service/credentials';
import { json, readJson } from '@backend/platform/http';
import { logEvent } from '@backend/features/logs/repository/logs';

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 2048);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const email = normalizeEmail(body.email);
  if (!email) return json({ error: 'Informe um e-mail válido' }, 400);
  if (!(await loginLimits(request, email, 'password'))) return rateLimited();
  const fail = async () => {
    await logEvent(request, {
      kind: 'security',
      action: 'login_failed',
      severity: 'warning',
      actorType: 'visitor',
      actorId: email,
      target: email,
      metadata: { method: 'password' },
    });
    return json({ error: 'E-mail ou senha inválidos. / Invalid email or password.' }, 401);
  };
  if (typeof body.password !== 'string' || body.password.length > 128) return fail();
  const accepted = body.acceptTerms === true || body.acceptTerms === 'true';
  const row = await env.DB.prepare(
    'SELECT password_hash, salt, iterations FROM auth_passwords WHERE email = ?',
  )
    .bind(email)
    .first<{ password_hash: string; salt: string; iterations: number }>();
  if (!row) {
    const [existing, admin] = await Promise.all([
      env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first(),
      env.DB.prepare('SELECT 1 FROM admin_accounts WHERE email = ?').bind(email).first(),
    ]);
    if (existing || admin) return fail();
    if (!accepted)
      return json(
        {
          error:
            'Esta conta ainda não existe. Aceite os Termos de Uso e a Política de Privacidade para criá-la.',
          consent: true,
        },
        400,
      );
    const password = await passwordRecord(body.password);
    return establishLogin(email, request, password, true);
  }
  const actual = await derivePassword(body.password, row.salt, row.iterations);
  if (!equalHashes(actual, row.password_hash)) return fail();
  return establishLogin(email, request, undefined, accepted);
};
