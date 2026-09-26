import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { parseSite } from '@/lib/site';
import { getSiteForUser } from '@/server/db';
import { isResponse, json, readJson, requireUser } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  try {
    const content = parseSite(await readJson(request));
    const ownedPrefix = `/media/${site.id}/`;
    const images = [content.heroImage, ...content.products.map(product => product.image)].filter(Boolean);
    if (images.some(image => !image.startsWith(ownedPrefix))) return json({ error: 'Uma imagem não pertence à sua página' }, 400);
    await env.DB.prepare('UPDATE sites SET draft_json = ? WHERE id = ?').bind(JSON.stringify(content), site.id).run();
    return json({ ok: true });
  } catch {
    return json({ error: 'Revise os campos da página' }, 400);
  }
};
