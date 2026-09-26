import { logout, sameOrigin } from '@backend/auth';
import { json } from '@backend/http';

export const POST = async (request: Request): Promise<Response> => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  return json({ ok: true }, 200, await logout(request));
};
