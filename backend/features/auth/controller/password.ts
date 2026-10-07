import { env } from 'cloudflare:workers';
import { sameOrigin } from '../service/session';
import {
  derivePassword,
  equalHashes,
  establishLogin,
  loginLimits,
  normalizeEmail,
  rateLimited,
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
  if (!(await loginLimits(request, email, 'password'))) return rateLimited();
  const fail = () =>
    json({ error: 'E-mail ou senha inválidos. / Invalid email or password.' }, 401);
  if (typeof body.password !== 'string' || body.password.length > 128) return fail();
  const row = await env.DB.prepare(
    'SELECT password_hash, salt, iterations FROM auth_passwords WHERE email = ?',
  )
    .bind(email)
    .first<{ password_hash: string; salt: string; iterations: number }>();
  const actual = await derivePassword(
    body.password,
    row?.salt ?? '00000000000000000000000000000000',
    row?.iterations ?? 100_000,
  );
  if (!equalHashes(actual, row?.password_hash ?? '0'.repeat(64)) || !row) return fail();
  const accepted = body.acceptTerms === true || body.acceptTerms === 'true';
  return establishLogin(email, request, undefined, accepted);
};
