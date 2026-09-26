import type { APIRoute } from 'astro';
import { publicSitemap } from '@backend/features/domains/public-sitemap';
export const GET: APIRoute = ({ request }) => publicSitemap(request);
