import {
  getSessionAdmin,
  getSessionUser,
  sameOrigin,
} from '@backend/features/auth/service/session';
import { json } from '@backend/platform/http';

export interface PushOwner {
  audience: 'user' | 'admin';
  owner: string;
}

/** Identifies the signed-in account behind a push request (client or admin). */
export async function requirePushOwner(request: Request): Promise<PushOwner | Response> {
  if (request.method !== 'GET' && !sameOrigin(request))
    return json({ error: 'Origem inválida' }, 403);
  const user = await getSessionUser(request);
  if (user) return { audience: 'user', owner: user.id };
  const admin = await getSessionAdmin(request);
  if (admin) return { audience: 'admin', owner: admin.email };
  return json({ error: 'Entre na sua conta' }, 401);
}
