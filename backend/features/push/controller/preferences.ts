import { isResponse, json, readJson } from '@backend/platform/http';
import { requirePushOwner } from '../service/owner';
import { getPreferences, setPreferences } from '../repository/subscriptions';

export const GET = async (request: Request): Promise<Response> => {
  const owner = await requirePushOwner(request);
  if (isResponse(owner)) return owner;
  if (owner.audience !== 'user') return json({ metrics: true, billing: true });
  const preferences = await getPreferences(owner.owner);
  return json({
    metrics: preferences.metrics !== false,
    billing: preferences.billing !== false,
  });
};

export const POST = async (request: Request): Promise<Response> => {
  const owner = await requirePushOwner(request);
  if (isResponse(owner)) return owner;
  if (owner.audience !== 'user') return json({ ok: true });
  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 2048);
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }
  const preferences = { metrics: body.metrics !== false, billing: body.billing !== false };
  await setPreferences(owner.owner, preferences);
  return json(preferences);
};
