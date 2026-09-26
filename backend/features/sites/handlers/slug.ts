import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/platform/config';
import { getSiteForUser } from '@backend/features/sites/repository';
import { isResponse, json, readJson, requireUser } from '@backend/platform/http';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  let slug: unknown;
  try {
    ({ slug } = await readJson(request, 2048));
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  if (
    typeof slug !== 'string' ||
    !/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug) ||
    ['www', 'app', 'api', 'admin', 'mail'].includes(slug)
  ) {
    return json({ error: 'Use 3 a 40 letras minúsculas, números ou hífens' }, 400);
  }
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  try {
    await env.DB.prepare('UPDATE sites SET slug = ? WHERE id = ?').bind(slug, site.id).run();
    return json({ ok: true, url: `https://${slug}.${await rootDomain()}` });
  } catch {
    return json({ error: 'Este endereço já está em uso' }, 409);
  }
};
