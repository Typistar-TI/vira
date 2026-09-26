import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { hasAccess, parseSite } from '@/lib/site';
import { resolveTenant } from '@/server/tenant';

export const GET: APIRoute = async ({ request, params }) => {
  const tenant = await resolveTenant(new URL(request.url).hostname);
  if (!tenant || !hasAccess(tenant.user) || !tenant.site.published_json) return new Response('Not found', { status: 404 });
  const content = parseSite(JSON.parse(tenant.site.published_json));
  const index = Number(params.index);
  const target = params.type === 'primary' ? content.primaryUrl : params.type === 'product' && Number.isInteger(index) ? content.products[index]?.url : '';
  if (!target || !/^https?:\/\//.test(target)) return new Response('Not found', { status: 404 });
  env.METRICS.writeDataPoint({ indexes: [tenant.site.id], blobs: ['click', params.type || 'unknown'] });
  return Response.redirect(target, 302);
};
