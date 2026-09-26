import { env } from 'cloudflare:workers';

export interface SiteRow {
  id: string;
  user_id: string;
  slug: string;
  draft_json: string;
  published_json: string | null;
  published_at: number | null;
}

export async function getSiteForUser(userId: string) {
  return env.DB.prepare('SELECT * FROM sites WHERE user_id = ?').bind(userId).first<SiteRow>();
}
