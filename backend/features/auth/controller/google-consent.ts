import { env } from 'cloudflare:workers';
import {
  clearGooglePendingCookie,
  createSession,
  lastLoginCookie,
  readGooglePending,
  sameOrigin,
} from '../service/session';
import { getOrCreateGoogleUser } from '../repository/users';
import { json } from '@backend/platform/http';
import { logEvent } from '@backend/features/logs/repository/logs';

/** Creates the account after a new Google sign-in accepts the terms. */
export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const pending = await readGooglePending(request);
  if (!pending)
    return json({ error: 'Cadastro expirado. Entre com Google novamente.' }, 400, {
      'set-cookie': clearGooglePendingCookie(),
    });
  const admin = await env.DB.prepare(
    'SELECT email FROM admin_accounts WHERE email = ? OR google_sub = ?',
  )
    .bind(pending.email, pending.sub)
    .first();
  if (admin) return json({ error: 'Acesso restrito' }, 403);
  const user = await getOrCreateGoogleUser(pending.sub, pending.email, pending.lang, true);
  const headers = new Headers({ 'cache-control': 'no-store' });
  headers.append('set-cookie', await createSession(user.id));
  headers.append('set-cookie', lastLoginCookie('google'));
  headers.append('set-cookie', clearGooglePendingCookie());
  await logEvent(request, {
    kind: 'auth',
    action: 'signup',
    actorType: 'user',
    actorId: user.email ?? user.id,
    target: user.email ?? user.id,
    metadata: { method: 'google' },
  });
  return json({ redirect: '/app' }, 200, headers);
};
