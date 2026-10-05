import type { APIRoute } from 'astro';
import { clickProduct } from '@backend/features/analytics/controller/product-click';
export const GET: APIRoute = ({ request, params }) =>
  clickProduct(request, params.type, params.index);
