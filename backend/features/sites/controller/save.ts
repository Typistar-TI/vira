import { env } from 'cloudflare:workers';
import { parseSite } from '@backend/features/sites/entities/site';
import { getSiteForUser } from '@backend/features/sites/repository/sites';
import { isResponse, json, readJson, requireUser } from '@backend/platform/http';
import { ownsContentImages } from '../service/content';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  try {
    const content = parseSite(await readJson(request));
    if (!ownsContentImages(site.id, content))
      return json({ error: 'Uma imagem não pertence à sua página' }, 400);
    await env.DB.prepare('UPDATE sites SET draft_json = ? WHERE id = ?')
      .bind(JSON.stringify(content), site.id)
      .run();
    return json({ ok: true });
  } catch {
    return json({ error: 'Revise os campos da página' }, 400);
  }
};
