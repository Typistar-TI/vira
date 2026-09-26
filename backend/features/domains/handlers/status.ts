import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/platform/config';
import { getSiteForUser } from '@backend/features/sites/repository';
import { getHostname } from '@backend/features/domains/service';
import { isResponse, json, requireUser } from '@backend/platform/http';

export const GET = async (request: Request): Promise<Response> => {
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
