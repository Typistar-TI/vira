import { env } from 'cloudflare:workers';
import {
  hasAccess,
  parseSite,
  sitePrimaryUrl,
  siteProducts,
} from '@backend/features/sites/entities/site';
import { resolveTenant } from '@backend/features/domains/repository/tenant';

export async function clickProduct(
  request: Request,
  type: string | undefined,
  indexParam: string | undefined,
): Promise<Response> {
  const tenant = await resolveTenant(new URL(request.url).hostname);
  if (!tenant || !hasAccess(tenant.user) || !tenant.site.published_json)
    return new Response('Not found', { status: 404 });
  const content = parseSite(JSON.parse(tenant.site.published_json));
  const index = Number(indexParam);
  const target =
    type === 'primary'
      ? sitePrimaryUrl(content)
      : type === 'product' && Number.isInteger(index)
        ? siteProducts(content)[index]?.url
        : '';
  if (!target || !/^https?:\/\//.test(target)) return new Response('Not found', { status: 404 });
  env.METRICS.writeDataPoint({
    indexes: [tenant.site.id],
    blobs: ['click', type || 'unknown'],
  });
  return Response.redirect(target, 302);
}
