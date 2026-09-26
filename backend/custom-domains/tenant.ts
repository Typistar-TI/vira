import { env } from 'cloudflare:workers';
import type { SiteRow, UserRow } from '../db';
import { rootDomain } from '../config';

export async function resolveTenant(
  hostname: string,
): Promise<{ site: SiteRow; user: UserRow } | null> {
  const root = (await rootDomain()).toLowerCase();
  const host = hostname.toLowerCase();
  let site: SiteRow | null;
  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    if (slug.includes('.')) return null;
    site = await env.DB.prepare('SELECT * FROM sites WHERE slug = ?').bind(slug).first<SiteRow>();
  } else {
    site = await env.DB.prepare(
      `SELECT sites.* FROM sites JOIN domains ON domains.site_id = sites.id
      WHERE domains.hostname = ? AND domains.status = 'active' AND domains.ssl_status = 'active'`,
    )
      .bind(host)
      .first<SiteRow>();
  }
  if (!site) return null;
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(site.user_id)
    .first<UserRow>();
  return user ? { site, user } : null;
}
