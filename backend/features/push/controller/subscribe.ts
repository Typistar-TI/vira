import { isResponse, json, readJson } from '@backend/platform/http';
import { requirePushOwner } from '../service/owner';
import { saveSubscription } from '../repository/subscriptions';

export const POST = async (request: Request): Promise<Response> => {
  const owner = await requirePushOwner(request);
  if (isResponse(owner)) return owner;
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 4096);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
  const keys = (body.keys && typeof body.keys === 'object' ? body.keys : {}) as Record<
    string,
    unknown
  >;
  const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh : '';
  const auth = typeof keys.auth === 'string' ? keys.auth : '';
  if (
    !endpoint.startsWith('https://') ||
    endpoint.length > 1000 ||
    !p256dh ||
    p256dh.length > 200 ||
    !auth ||
    auth.length > 200
  )
    return json({ error: 'Inscrição inválida' }, 400);
  await saveSubscription({
    audience: owner.audience,
    owner: owner.owner,
    endpoint,
    p256dh,
    auth,
  });
  return json({ ok: true });
};
