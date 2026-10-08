import { normalizeDisplayName } from '../service/profile';
import { saveProfile } from '../repository/profile';
import { normalizeAvatar } from '@backend/platform/profile';
import { logEvent } from '@backend/features/logs/repository/logs';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 400_000);
    const displayName = normalizeDisplayName(body.displayName);
    if (!displayName) return json({ error: 'Informe um nome de até 80 caracteres.' }, 400);
    const avatar = normalizeAvatar(body.avatar);
    if (avatar === undefined) return json({ error: 'Foto inválida (use PNG, JPG ou WebP).' }, 400);
    await saveProfile(admin, displayName, avatar);
    await logEvent(request, {
      kind: 'admin',
      action: 'update_profile',
      actorType: 'admin',
      actorId: admin.id,
      target: admin.email,
    });
    return json({ ok: true, displayName, avatar });
  } catch {
    return json({ error: 'Não foi possível salvar o perfil.' }, 400);
  }
};
