import { env } from 'cloudflare:workers';
import { buildPushPayload } from '@block65/webcrypto-web-push';
import { vapidKeys } from './vapid';
import {
  listSubscriptions,
  parsePreferences,
  type PushAudience,
  type PushSubscriptionRow,
} from '../repository/subscriptions';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

async function deliver(subscriptions: PushSubscriptionRow[], payload: PushPayload): Promise<void> {
  if (subscriptions.length === 0) return;
  const vapid = await vapidKeys();
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const built = await buildPushPayload(
          {
            data: payload as unknown as Record<string, string>,
            options: { ttl: 86400, urgency: 'normal' as const },
          },
          {
            endpoint: subscription.endpoint,
            expirationTime: null,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          vapid,
        );
        const response = await fetch(subscription.endpoint, {
          method: built.method,
          headers: built.headers,
          body: built.body,
        });
        if (response.status === 404 || response.status === 410) {
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?')
            .bind(subscription.id)
            .run();
        }
      } catch {
        /* ignore a single failed delivery */
      }
    }),
  );
}

export async function sendPush(
  audience: PushAudience,
  owner: string,
  payload: PushPayload,
): Promise<void> {
  await deliver(await listSubscriptions(audience, owner), payload);
}

export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  const admins = await env.DB.prepare('SELECT email FROM admin_accounts').all<{ email: string }>();
  await Promise.all(admins.results.map((row) => sendPush('admin', row.email, payload)));
}

/** Sends to a client's devices unless that notification kind was turned off. */
export async function sendUserPush(
  userId: string,
  kind: 'metrics' | 'billing',
  payload: PushPayload,
): Promise<void> {
  const subscriptions = await listSubscriptions('user', userId);
  const enabled = subscriptions.filter(
    (subscription) => parsePreferences(subscription.preferences)[kind] !== false,
  );
  await deliver(enabled, payload);
}
