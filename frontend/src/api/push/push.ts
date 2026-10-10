export interface PushPreferences {
  metrics: boolean;
  billing: boolean;
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error('Falha na notificação');
  return (await response.json()) as T;
}

export const getPushKey = () =>
  fetch('/api/push/key', { credentials: 'same-origin' }).then((r) =>
    read<{ publicKey: string }>(r),
  );

export const subscribePush = (subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) =>
  fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(subscription),
  }).then((r) => read<{ ok: boolean }>(r));

export const unsubscribePush = (endpoint: string) =>
  fetch('/api/push/unsubscribe', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).then((r) => read<{ ok: boolean }>(r));

export const getPushPreferences = () =>
  fetch('/api/push/preferences', { credentials: 'same-origin' }).then((r) =>
    read<PushPreferences>(r),
  );

export const setPushPreferences = (preferences: PushPreferences) =>
  fetch('/api/push/preferences', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(preferences),
  }).then((r) => read<PushPreferences>(r));
