import { hasAccess } from '@backend/features/sites/model';
import { resolveTenant } from '@backend/features/domains/tenant';

export async function publicSitemap(request: Request): Promise<Response> {
  const host = new URL(request.url).hostname;
  const tenant = await resolveTenant(host);
  if (
    !tenant ||
    !hasAccess(tenant.user) ||
    !tenant.site.published_json ||
    tenant.site.auto_published
  )
    return new Response('Not found', { status: 404 });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${host}/</loc></url></urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  );
}
