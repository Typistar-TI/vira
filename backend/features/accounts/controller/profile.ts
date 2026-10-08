import { env } from 'cloudflare:workers';
import { normalizeAvatar, normalizeOptionalName } from '@backend/platform/profile';
import { logEvent } from '@backend/features/logs/repository/logs';
import { isResponse, json, readJson, requireUser } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  try {
    const body = await readJson(request, 400_000);
    const displayName = normalizeOptionalName(body.displayName);
    if (displayName === null) return json({ error: 'Nome muito longo (até 80 caracteres).' }, 400);
    const avatar = normalizeAvatar(body.avatar);
    if (avatar === undefined) return json({ error: 'Foto inválida (use PNG, JPG ou WebP).' }, 400);
    await env.DB.prepare('UPDATE users SET display_name = ?, avatar = ? WHERE id = ?')
      .bind(displayName, avatar, user.id)
      .run();
    await logEvent(request, {
      kind: 'auth',
      action: 'update_profile',
      actorType: 'user',
      actorId: user.email ?? user.id,
      target: user.email ?? user.id,
    });
    return json({ ok: true, displayName, avatar });
  } catch {
    return json({ error: 'Não foi possível salvar o perfil.' }, 400);
  }
};
