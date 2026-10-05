import { env } from 'cloudflare:workers';
import { initialSite } from '@backend/features/sites/entities/site';
import {
  dashboardUrl,
  endDate,
  endDateParts,
  queueEmailStatement,
  siteUrl,
} from '@backend/features/emails/service/emails';

import type { UserRow } from '../entities/user';
export type { UserRow } from '../entities/user';

export async function getUser(id: string) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function getOrCreateGoogleUser(sub: string, email: string, language: 'pt' | 'en') {
  let user = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ?')
    .bind(sub)
    .first<UserRow>();
  if (user) {
    if (user.email !== email)
      await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(email, user.id).run();
    return { ...user, email };
  }
  user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (user) {
    if (user.google_sub && user.google_sub !== sub) throw new Error('Conta Google já vinculada');
    await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(sub, user.id).run();
    return { ...user, google_sub: sub };
  }
  try {
    return await createUser(email, sub, language);
  } catch (error) {
    const concurrent = await env.DB.prepare('SELECT * FROM users WHERE email = ? OR google_sub = ?')
      .bind(email, sub)
      .first<UserRow>();
    if (!concurrent || (concurrent.google_sub && concurrent.google_sub !== sub)) throw error;
    if (!concurrent.google_sub)
      await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?')
        .bind(sub, concurrent.id)
        .run();
    return { ...concurrent, google_sub: sub };
  }
}

export async function getOrCreateEmailUser(email: string, language: 'pt' | 'en') {
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();
  if (user) return user;
  try {
    return await createUser(email, null, language);
  } catch (error) {
    const concurrent = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<UserRow>();
    if (!concurrent) throw error;
    return concurrent;
  }
}

async function createUser(email: string, sub: string | null, language: 'pt' | 'en') {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const slug = `site-${id.slice(0, 12)}`;
  const content = JSON.stringify(initialSite(language));
  const [pageUrl, panelUrl] = await Promise.all([siteUrl(slug), dashboardUrl()]);
  const trialEnd = now + 1 * 86400;
  const date = endDateParts(trialEnd);
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users (id, phone, google_sub, email, created_at, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(id, `auth-${id}`, sub, email, now, trialEnd),
    env.DB.prepare(
      'INSERT INTO sites (id, user_id, slug, draft_json, published_json, published_at, auto_published, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    ).bind(crypto.randomUUID(), id, slug, content, content, now, now),
    queueEmailStatement('site_created', `site-created:${id}`, email, {
      email,
      dashboard_url: panelUrl,
      site_url: pageUrl,
      end_date: endDate(trialEnd),
      end_date_pt: date.pt,
      end_date_en: date.en,
    }),
  ]);
  const user = await getUser(id);
  if (!user) throw new Error('Falha ao criar a conta');
  return user;
}

export async function consumeLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at <= ? THEN 1 ELSE MIN(count + 1, ?) END,
    reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END
    RETURNING count`,
  )
    .bind(key, now + windowSeconds, now, max + 1, now)
    .first<{ count: number }>();
  return (row?.count ?? max + 1) <= max;
}
