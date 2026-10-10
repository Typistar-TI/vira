import { env } from 'cloudflare:workers';
import {
  hasAccess,
  parseSite,
  sitePrimaryLabel,
  sitePrimaryUrl,
  siteProducts,
} from '@backend/features/sites/entities/site';
import { resolveTenant } from '@backend/features/domains/repository/tenant';
import { metricContext } from '../service/context';

export async function clickProduct(
  request: Request,
  type: string | undefined,
  indexParam: string | undefined,
): Promise<Response> {
  const tenant = await resolveTenant(new URL(request.url).hostname);
  if (!tenant || !hasAccess(tenant.user) || !tenant.site.published_json)
    return new Response('Not found', { status: 404 });
  const content = parseSite(JSON.parse(tenant.site.published_json));
  const products = siteProducts(content);
  const index = Number(indexParam);
  const isProduct = type === 'product' && Number.isInteger(index);
  const target =
    type === 'primary' ? sitePrimaryUrl(content) : isProduct ? products[index]?.url : '';
  if (!target || !/^https?:\/\//.test(target)) return new Response('Not found', { status: 404 });
  const label =
    type === 'primary' ? sitePrimaryLabel(content) : isProduct ? products[index]?.title : '';
  const context = await metricContext(request);
  env.METRICS.writeDataPoint({
    indexes: [tenant.site.id],
    blobs: ['click', type || 'unknown', (label || '').slice(0, 80), context.path, context.visitor],
  });
  return Response.redirect(target, 302);
}
