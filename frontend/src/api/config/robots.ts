import type { APIRoute } from 'astro';
import { getRootDomain } from '@frontend/api/config/root-domain';

export const GET: APIRoute = async () =>
  new Response(
    `User-agent: *\nDisallow: /app/\nDisallow: /api/\nSitemap: https://${await getRootDomain()}/sitemap.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
