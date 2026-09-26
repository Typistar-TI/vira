import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/config';
import { hasAccess } from '@backend/site';
import { getSiteForUser } from '@backend/db';
import { createHostname, deleteHostname, normalizeDomain } from '@backend/custom-domains';
import { isResponse, json, readJson, requireUser } from '@backend/http';

export const POST = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  if (!hasAccess(user) || user.plan === 'trial')
    return json({ error: 'Domínio próprio fica disponível após a contratação' }, 403);
  const site = await getSiteForUser(user.id);
  if (!site) return json({ error: 'Página não encontrada' }, 404);
  let raw: unknown;
  try {
    ({ hostname: raw } = await readJson(request, 2048));
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const hostname = await normalizeDomain(String(raw || ''));
  if (!hostname) return json({ error: 'Informe um domínio como www.exemplo.com.br' }, 400);
  const current = await env.DB.prepare('SELECT * FROM domains WHERE site_id = ?')
    .bind(site.id)
    .first<{ id: string; cloudflare_id: string | null; hostname: string }>();
  if (current?.hostname === hostname) return json({ ok: true });
  try {
    const remote = await createHostname(hostname);
    try {
      if (current) {
        await env.DB.prepare(
          'UPDATE domains SET hostname = ?, cloudflare_id = ?, status = ?, ssl_status = ?, created_at = ? WHERE id = ?',
        )
          .bind(
            hostname,
            remote.id,
            remote.status,
            remote.ssl?.status || 'pending',
            Math.floor(Date.now() / 1000),
            current.id,
          )
          .run();
      } else {
        await env.DB.prepare(
          'INSERT INTO domains (id, site_id, hostname, cloudflare_id, status, ssl_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            crypto.randomUUID(),
            site.id,
            hostname,
            remote.id,
            remote.status,
            remote.ssl?.status || 'pending',
            Math.floor(Date.now() / 1000),
          )
          .run();
      }
    } catch (error) {
      await deleteHostname(remote.id);
      throw error;
    }
    if (current?.cloudflare_id) await deleteHostname(current.cloudflare_id).catch(() => {});
    return json({ ok: true, hostname, target: `connect.${await rootDomain()}` });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Falha ao conectar domínio' },
      400,
    );
  }
};
