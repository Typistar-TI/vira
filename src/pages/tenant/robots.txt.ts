import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => new Response(`User-agent: *\nDisallow: /tenant/\nSitemap: https://${new URL(request.url).hostname}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
