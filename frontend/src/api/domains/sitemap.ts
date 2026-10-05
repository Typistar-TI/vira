import type { APIRoute } from 'astro';
import { publicSitemap } from '@backend/features/domains/controller/sitemap';
export const GET: APIRoute = ({ request }) => publicSitemap(request);
