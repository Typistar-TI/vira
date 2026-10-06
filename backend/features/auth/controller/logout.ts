import { logout, sameOrigin } from '@backend/features/auth/service/session';
import { json } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const scope = new URL(request.url).searchParams.get('scope') ?? 'app';
  if (scope !== 'app' && scope !== 'admin') return json({ error: 'Sessão inválida' }, 400);
  return json({ ok: true }, 200, await logout(request, scope));
};
