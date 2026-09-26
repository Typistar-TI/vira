import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSiteForUser } from '@/server/db';
import { isResponse, requireUser } from '@/server/http';

export const GET: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  const domain = site ? await env.DB.prepare('SELECT hostname, status, ssl_status, created_at FROM domains WHERE site_id = ?')
    .bind(site.id).first() : null;
  const data = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, phone: user.phone, plan: user.plan, trial_ends_at: user.trial_ends_at, access_until: user.access_until },
    site: site ? { slug: site.slug, draft: JSON.parse(site.draft_json), published: site.published_json ? JSON.parse(site.published_json) : null, published_at: site.published_at } : null,
    domain,
  };
  return new Response(JSON.stringify(data, null, 2), { headers: {
    'content-type': 'application/json; charset=utf-8',
    'content-disposition': 'attachment; filename="vira-dados.json"',
    'cache-control': 'no-store',
  } });
};
