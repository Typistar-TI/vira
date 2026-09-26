import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { hasAccess, parseSite } from '@shared/site';
import { resolveTenant } from '@backend/custom-domains/tenant';

export const GET: APIRoute = async ({ request }) => {
  const tenant = await resolveTenant(new URL(request.url).hostname);
  if (!tenant || !hasAccess(tenant.user) || !tenant.site.published_json) return new Response('Not found', { status: 404 });
  const target = parseSite(JSON.parse(tenant.site.published_json)).primaryUrl;
  if (!target || !/^https?:\/\//.test(target)) return new Response('Not found', { status: 404 });
  env.METRICS.writeDataPoint({ indexes: [tenant.site.id], blobs: ['click', 'primary'] });
  return Response.redirect(target, 302);
};
