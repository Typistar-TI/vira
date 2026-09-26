import { env } from 'cloudflare:workers';
import { stripe } from '../billing';
import { getUser } from '../db';
import { deleteHostname } from '../custom-domains';

export async function deleteAccount(userId: string): Promise<void> {
  const user = await getUser(userId);
  if (!user) return;
  const site = await env.DB.prepare('SELECT id FROM sites WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string }>();
  const domain = site
    ? await env.DB.prepare('SELECT cloudflare_id FROM domains WHERE site_id = ?')
        .bind(site.id)
        .first<{ cloudflare_id: string | null }>()
    : null;

  if (user.stripe_subscription_id || user.stripe_customer_id) {
    const client = await stripe();
    if (user.stripe_subscription_id) {
      try {
        const subscription = await client.subscriptions.retrieve(user.stripe_subscription_id);
        if (subscription.status !== 'canceled') await client.subscriptions.cancel(subscription.id);
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode !== 404) throw error;
      }
    }
    if (user.stripe_customer_id) {
      try {
        await client.customers.del(user.stripe_customer_id);
      } catch (error) {
        if ((error as { statusCode?: number }).statusCode !== 404) throw error;
      }
    }
  }

  if (domain?.cloudflare_id) await deleteHostname(domain.cloudflare_id);
  if (site) {
    let cursor: string | undefined;
    do {
      const objects = await env.MEDIA.list({ prefix: `${site.id}/`, cursor });
      if (objects.objects.length) await env.MEDIA.delete(objects.objects.map((item) => item.key));
      cursor = objects.truncated ? objects.cursor : undefined;
    } while (cursor);
  }
  if (user.email)
    await env.DB.prepare('DELETE FROM email_login_tokens WHERE email = ?').bind(user.email).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}
