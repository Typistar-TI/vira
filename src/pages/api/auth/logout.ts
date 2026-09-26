import type { APIRoute } from 'astro';
import { logout, sameOrigin } from '@/server/auth';
import { json } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': await logout(request) });
};
