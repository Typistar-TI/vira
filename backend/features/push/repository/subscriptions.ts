import { env } from 'cloudflare:workers';

export type PushAudience = 'user' | 'admin';

export interface PushSubscriptionRow {
  id: string;
  audience: PushAudience;
  owner: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  preferences: string;
}

export async function saveSubscription(input: {
  audience: PushAudience;
  owner: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (id, audience, owner, endpoint, p256dh, auth, preferences, created_at)
     VALUES (?, ?, ?, ?, ?, ?, '{}', unixepoch())
     ON CONFLICT(endpoint) DO UPDATE SET audience = excluded.audience, owner = excluded.owner,
       p256dh = excluded.p256dh, auth = excluded.auth`,
  )
    .bind(
      crypto.randomUUID(),
      input.audience,
      input.owner,
      input.endpoint,
      input.p256dh,
      input.auth,
    )
    .run();
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
}

export async function listSubscriptions(
  audience: PushAudience,
  owner: string,
): Promise<PushSubscriptionRow[]> {
  const rows = await env.DB.prepare(
    'SELECT id, audience, owner, endpoint, p256dh, auth, preferences FROM push_subscriptions WHERE audience = ? AND owner = ?',
  )
    .bind(audience, owner)
    .all<PushSubscriptionRow>();
  return rows.results;
}

export function parsePreferences(value: string): Record<string, boolean> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export async function getPreferences(owner: string): Promise<Record<string, boolean>> {
  const row = await env.DB.prepare(
    "SELECT preferences FROM push_subscriptions WHERE audience = 'user' AND owner = ? LIMIT 1",
  )
    .bind(owner)
    .first<{ preferences: string }>();
  return row ? parsePreferences(row.preferences) : {};
}

export async function setPreferences(
  owner: string,
  preferences: Record<string, boolean>,
): Promise<void> {
  await env.DB.prepare(
    "UPDATE push_subscriptions SET preferences = ? WHERE audience = 'user' AND owner = ?",
  )
    .bind(JSON.stringify(preferences), owner)
    .run();
}
