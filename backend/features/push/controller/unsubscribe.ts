import { env } from 'cloudflare:workers';
import { isResponse, json, readJson } from '@backend/platform/http';
import { requirePushOwner } from '../service/owner';

export const POST = async (request: Request): Promise<Response> => {
  const owner = await requirePushOwner(request);
  if (isResponse(owner)) return owner;
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 2048);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
  if (endpoint)
    await env.DB.prepare(
      'DELETE FROM push_subscriptions WHERE endpoint = ? AND audience = ? AND owner = ?',
    )
      .bind(endpoint, owner.audience, owner.owner)
      .run();
  return json({ ok: true });
};
