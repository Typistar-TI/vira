import { env } from 'cloudflare:workers';
import { defaultSite } from '@/lib/site';

export interface UserRow {
  id: string; phone: string; email: string | null; google_sub: string | null; trial_ends_at: number; stripe_customer_id: string | null; stripe_subscription_id: string | null;
  plan: string; access_until: number | null; expired_at: number | null;
}

export interface SiteRow {
  id: string; user_id: string; slug: string; draft_json: string;
  published_json: string | null; published_at: number | null;
}

export async function getUser(id: string) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function getSiteForUser(userId: string) {
  return env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(userId).first<SiteRow>();
}

export async function getOrCreateGoogleUser(sub: string, email: string) {
  let user = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ?').bind(sub).first<UserRow>();
  if (user) {
    if (user.email !== email) await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(email, user.id).run();
    return { ...user, email };
  }
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const slug = `site-${id.slice(0, 8)}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, phone, google_sub, email, created_at, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, `oauth-${id}`, sub, email, now, now + 7 * 86400),
    env.DB.prepare('INSERT INTO sites (id, user_id, slug, draft_json, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), id, slug, JSON.stringify(defaultSite), now),
  ]);
  user = await getUser(id);
  if (!user) throw new Error('Falha ao criar a conta');
  return user;
}

export async function consumeLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(`INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
    reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END`)
    .bind(key, now + windowSeconds, now, now).run();
  const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
  return (row?.count ?? max + 1) <= max;
}
