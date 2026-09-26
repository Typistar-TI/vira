import type { APIRoute } from 'astro';
import { rootDomain } from '@/server/config';

export const GET: APIRoute = async () => new Response(`User-agent: *\nDisallow: /app/\nDisallow: /api/\nSitemap: https://${await rootDomain()}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
