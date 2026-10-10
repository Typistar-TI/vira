import { env } from 'cloudflare:workers';
import { siteMetrics } from '../service/metrics';
import { isResponse, json, requireAdmin } from '@backend/platform/http';

const allowedDays = [7, 30, 90];

/** Admin view of a single client's site metrics. */
export const GET = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const params = new URL(request.url).searchParams;
  const slug = (params.get('site') || '').trim().slice(0, 120);
  const param = Number(params.get('days'));
  const days = allowedDays.includes(param) ? param : 30;
  if (!slug) return json({ error: 'Informe o cliente' }, 400);
  const site = await env.DB.prepare('SELECT id FROM sites WHERE slug = ?')
    .bind(slug)
    .first<{ id: string }>();
  if (!site) return json({ error: 'Cliente não encontrado' }, 404);
  return json(await siteMetrics(site.id, days));
};
