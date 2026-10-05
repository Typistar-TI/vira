import { normalizeDisplayName } from '../service/profile';
import { saveDisplayName } from '../repository/profile';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 1024);
    const displayName = normalizeDisplayName(body.displayName);
    if (!displayName) return json({ error: 'Informe um nome de até 80 caracteres.' }, 400);
    await saveDisplayName(admin, displayName);
    return json({ ok: true, displayName });
  } catch {
    return json({ error: 'Não foi possível salvar o nome.' }, 400);
  }
};
