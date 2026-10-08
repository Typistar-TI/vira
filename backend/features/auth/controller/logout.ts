import {
  getSessionAdmin,
  getSessionUser,
  logout,
  sameOrigin,
} from '@backend/features/auth/service/session';
import { json } from '@backend/platform/http';
import { logEvent } from '@backend/features/logs/repository/logs';

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const scope = new URL(request.url).searchParams.get('scope') ?? 'app';
  if (scope !== 'app' && scope !== 'admin') return json({ error: 'Sessão inválida' }, 400);
  const actorId =
    scope === 'admin'
      ? ((await getSessionAdmin(request))?.email ?? null)
      : ((await getSessionUser(request))?.email ?? null);
  const headers = await logout(request, scope);
  await logEvent(request, {
    kind: scope === 'admin' ? 'admin' : 'auth',
    action: 'logout',
    actorType: scope === 'admin' ? 'admin' : 'user',
    actorId,
    target: actorId,
  });
  return json({ ok: true }, 200, headers);
};
