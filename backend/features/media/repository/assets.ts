import { env } from 'cloudflare:workers';
import type { MediaUsage } from '../entities/asset';
export function mediaUsage(siteId: string) {
  return env.DB.prepare(
    'SELECT COUNT(*) AS count, COALESCE(SUM(bytes), 0) AS bytes FROM media_assets WHERE site_id = ?',
  )
    .bind(siteId)
    .first<MediaUsage>();
}
export function insertAsset(key: string, siteId: string, bytes: number) {
  return env.DB.prepare(
    'INSERT INTO media_assets (key, site_id, bytes, created_at) VALUES (?, ?, ?, ?)',
  )
    .bind(key, siteId, bytes, Math.floor(Date.now() / 1000))
    .run();
}

/** Reserve quota in one D1 statement so parallel uploads cannot exceed limits. */
export async function reserveAsset(key: string, siteId: string, bytes: number): Promise<boolean> {
  const row = await env.DB.prepare(
    `INSERT INTO media_assets (key, site_id, bytes, created_at)
    SELECT ?, ?, ?, ? WHERE
      (SELECT COUNT(*) FROM media_assets WHERE site_id = ?) < 30 AND
      (SELECT COALESCE(SUM(bytes), 0) FROM media_assets WHERE site_id = ?) + ? <= ?
    RETURNING key`,
  )
    .bind(
      key,
      siteId,
      bytes,
      Math.floor(Date.now() / 1000),
      siteId,
      siteId,
      bytes,
      50 * 1024 * 1024,
    )
    .first();
  return Boolean(row);
}
export function releaseAsset(key: string) {
  return env.DB.prepare('DELETE FROM media_assets WHERE key = ?').bind(key).run();
}
