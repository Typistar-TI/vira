import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/config';
import { getSiteForUser } from '@backend/db';
import { getHostname } from '@backend/custom-domains';
import { isResponse, json, requireUser } from '@backend/http';

export const GET: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  const domain = await env.DB.prepare('SELECT * FROM domains WHERE site_id = ?')
    .bind(site.id)
    .first<{ id: string; hostname: string; cloudflare_id: string | null }>();
  if (!domain?.cloudflare_id) return json({ domain: null });
  const remote = await getHostname(domain.cloudflare_id);
  await env.DB.prepare('UPDATE domains SET status = ?, ssl_status = ? WHERE id = ?')
    .bind(remote.status, remote.ssl?.status || 'pending', domain.id)
    .run();
  return json({
    domain: {
      hostname: domain.hostname,
      status: remote.status,
      sslStatus: remote.ssl?.status || 'pending',
      target: `connect.${await rootDomain()}`,
    },
  });
};
