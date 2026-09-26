import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSiteForUser } from '@/server/db';
import { isResponse, json, readFormData, requireUser } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  let data: FormData;
  try { data = await readFormData(request); } catch { return json({ error: 'Arquivo muito grande ou inválido' }, 413); }
  const file = data.get('file');
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return json({ error: 'Envie JPG, PNG ou WebP de até 5 MB' }, 400);
  }
  const usage = await env.DB.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(bytes), 0) AS bytes FROM media_assets WHERE site_id = ?')
    .bind(site.id).first<{ count: number; bytes: number }>();
  if ((usage?.count || 0) >= 30 || (usage?.bytes || 0) + file.size > 50 * 1024 * 1024) {
    return json({ error: 'Limite de 30 imagens ou 50 MB atingido nesta página' }, 413);
  }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const key = `${site.id}/${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  try {
    await env.DB.prepare('INSERT INTO media_assets (key, site_id, bytes, created_at) VALUES (?, ?, ?, ?)')
      .bind(key, site.id, file.size, Math.floor(Date.now() / 1000)).run();
  } catch (error) {
    await env.MEDIA.delete(key);
    throw error;
  }
  return json({ url: `/media/${key}` });
};
