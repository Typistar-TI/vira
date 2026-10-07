import { env } from 'cloudflare:workers';
import { sameOrigin } from '../service/session';
import {
  consumeCode,
  establishLogin,
  loginLimits,
  normalizeEmail,
  passwordRecord,
  rateLimited,
  validPassword,
  type CodePurpose,
} from '../service/credentials';
import { json, readJson } from '@backend/platform/http';

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
  if (!(await loginLimits(request, email, 'code'))) return rateLimited();
  const purpose: CodePurpose = body.purpose === 'password' ? 'password' : 'login';
  if (purpose === 'password' && !validPassword(body.password))
    return json(
      { error: 'A senha deve ter entre 12 e 128 caracteres. / Use 12–128 characters.' },
      400,
    );
  const accepted = body.acceptTerms === true || body.acceptTerms === 'true';
  if (purpose === 'login' && !accepted) {
    const [existing, admin] = await Promise.all([
      env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first(),
      env.DB.prepare('SELECT email FROM admin_accounts WHERE email = ?').bind(email).first(),
    ]);
    if (!existing && !admin)
      return json(
        {
          error:
            'Esta conta ainda não existe. Aceite os Termos de Uso e a Política de Privacidade para criá-la.',
          consent: true,
        },
        400,
      );
  }
  if (
    typeof body.code !== 'string' ||
    !/^\d{6}$/.test(body.code) ||
    !(await consumeCode(email, body.code, purpose))
  )
    return json(
      { error: 'Código inválido ou expirado. Solicite outro código. / Invalid or expired code.' },
      400,
    );
  const password =
    purpose === 'password' ? await passwordRecord(body.password as string) : undefined;
  return establishLogin(email, request, password, accepted);
};
