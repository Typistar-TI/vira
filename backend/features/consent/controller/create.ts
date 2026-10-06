import { getSessionUser, sameOrigin, sha256 } from '@backend/features/auth/service/session';
import { consumeLimit } from '@backend/features/auth/repository/users';
import { recordConsent, type ConsentKind } from '../repository/consents';
import { clientIp, json, readJson } from '@backend/platform/http';

const kinds = new Set<ConsentKind>(['cookies', 'terms', 'privacy']);

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 2048);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const kind = String(body.kind || '') as ConsentKind;
  if (!kinds.has(kind)) return json({ error: 'Tipo de consentimento inválido' }, 400);
  const ip = await sha256(clientIp(request));
  if (!(await consumeLimit(`consent:${ip}`, 40, 3600)))
    return json({ error: 'Muitas requisições. Aguarde.' }, 429, { 'retry-after': '3600' });
  const [user] = await Promise.all([getSessionUser(request)]);
  await recordConsent({
    userId: user?.id ?? null,
    kind,
    version: String(body.version || '1'),
    ipHash: ip,
    userAgent: request.headers.get('user-agent'),
  });
  return json({ ok: true });
};
