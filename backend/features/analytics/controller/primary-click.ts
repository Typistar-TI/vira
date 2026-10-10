import { env } from 'cloudflare:workers';
import {
  hasAccess,
  parseSite,
  sitePrimaryLabel,
  sitePrimaryUrl,
} from '@backend/features/sites/entities/site';
import { resolveTenant } from '@backend/features/domains/repository/tenant';
import { metricContext } from '../service/context';

export async function clickPrimary(request: Request): Promise<Response> {
  const tenant = await resolveTenant(new URL(request.url).hostname);
  if (!tenant || !hasAccess(tenant.user) || !tenant.site.published_json)
    return new Response('Not found', { status: 404 });
  const content = parseSite(JSON.parse(tenant.site.published_json));
  const target = sitePrimaryUrl(content);
  if (!target || !/^https?:\/\//.test(target)) return new Response('Not found', { status: 404 });
  const context = await metricContext(request);
  env.METRICS.writeDataPoint({
    indexes: [tenant.site.id],
    blobs: [
      'click',
      'primary',
      sitePrimaryLabel(content).slice(0, 80),
      context.path,
      context.visitor,
    ],
  });
  return Response.redirect(target, 302);
}
