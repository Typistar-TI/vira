import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/config';
import { hasAccess, parseSite } from '@backend/site';
import { getSiteForUser } from '@backend/db';
import { isResponse, json, requireUser } from '@backend/http';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  if (!hasAccess(user))
    return json(
      { error: 'Seu teste ou assinatura terminou. Escolha um plano para publicar.' },
      403,
    );
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  const content = parseSite(JSON.parse(site.draft_json));
  if (!content.title) return json({ error: 'Preencha o título antes de publicar' }, 400);
  await env.DB.prepare('UPDATE sites SET published_json = ?, published_at = ? WHERE id = ?')
    .bind(JSON.stringify(content), Math.floor(Date.now() / 1000), site.id)
    .run();
  return json({ ok: true, url: `https://${site.slug}.${await rootDomain()}` });
};
