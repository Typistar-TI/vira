import type { APIRoute } from 'astro';
import { publicRobots } from '@backend/features/domains/public-robots';
export const GET: APIRoute = ({ request }) => publicRobots(request);
