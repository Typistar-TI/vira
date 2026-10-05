import type { APIRoute } from 'astro';
import { readMedia } from '@backend/features/media/controller/read';
export const GET: APIRoute = ({ request, params }) => readMedia(request, params.key || '');
