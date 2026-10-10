import { isResponse, json } from '@backend/platform/http';
import { requirePushOwner } from '../service/owner';
import { vapidKeys } from '../service/vapid';

export const GET = async (request: Request): Promise<Response> => {
  const owner = await requirePushOwner(request);
  if (isResponse(owner)) return owner;
  const { publicKey } = await vapidKeys();
  return json({ publicKey });
};
