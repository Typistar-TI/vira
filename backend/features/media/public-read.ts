import { env } from 'cloudflare:workers';
import { getSessionUser } from '@backend/features/auth/service';
import { hasAccess } from '@backend/features/sites/model';

export async function readMedia(request: Request, key: string): Promise<Response> {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key))
    return new Response('Not found', { status: 404 });
  const owner = await env.DB.prepare(
    `SELECT users.id, users.plan, users.trial_ends_at, users.access_until FROM media_assets
    JOIN sites ON sites.id = media_assets.site_id JOIN users ON users.id = sites.user_id WHERE media_assets.key = ?`,
  )
    .bind(key)
    .first<{ id: string; plan: string; trial_ends_at: number; access_until: number | null }>();
  if (!owner) return new Response('Not found', { status: 404 });
  const active = hasAccess(owner);
  if (!active && (await getSessionUser(request))?.id !== owner.id)
    return new Response('Not found', { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  return new Response(await object.arrayBuffer(), {
    headers: {
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': active ? 'public, max-age=300, must-revalidate' : 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
