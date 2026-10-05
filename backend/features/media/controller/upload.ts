import { env } from 'cloudflare:workers';
import { getSiteForUser } from '@backend/features/sites/repository/sites';
import { isResponse, json, readFormData, requireUser } from '@backend/platform/http';
import { validImage, imageMatchesType } from '../service/validation';
import { reserveAsset, releaseAsset } from '../repository/assets';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  let data: FormData;
  try {
    data = await readFormData(request);
  } catch {
    return json({ error: 'Arquivo muito grande ou inválido' }, 413);
  }
  const file = data.get('file');
  if (!validImage(file) || !(await imageMatchesType(file))) {
    return json({ error: 'Envie JPG, PNG ou WebP de até 5 MB' }, 400);
  }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const key = `${site.id}/${crypto.randomUUID()}.${extension}`;
  if (!(await reserveAsset(key, site.id, file.size)))
    return json({ error: 'Limite de 30 imagens ou 50 MB atingido nesta página' }, 413);
  try {
    await env.MEDIA.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (error) {
    await releaseAsset(key);
    await env.MEDIA.delete(key);
    throw error;
  }
  return json({ url: `/media/${key}` });
};
