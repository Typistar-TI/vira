import type { APIRoute } from 'astro';
import { clickPrimary } from '@backend/features/analytics/primary-click';
export const GET: APIRoute = ({ request }) => clickPrimary(request);
