import type { APIRoute } from 'astro';
import { getRootDomain } from '@frontend/api/config/root-domain';

export const GET: APIRoute = async () => {
  const domain = await getRootDomain();
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${domain}/</loc></url><url><loc>https://${domain}/en/</loc></url></urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  );
};
