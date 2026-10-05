import type { APIRoute } from 'astro';
import { clickPrimary } from '@backend/features/analytics/controller/primary-click';
export const GET: APIRoute = ({ request }) => clickPrimary(request);
