import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { deleteAccount } from './account';

type WorkerEnv = {
  DB: import('@cloudflare/workers-types').D1Database;
  MEDIA: import('@cloudflare/workers-types').R2Bucket;
};

async function cleanExpired(environment: WorkerEnv) {
  const now = Math.floor(Date.now() / 1000);
  await environment.DB.prepare("UPDATE users SET expired_at = ? WHERE expired_at IS NULL AND ((plan = 'trial' AND trial_ends_at <= ?) OR (plan IN ('monthly','yearly') AND access_until <= ?))")
    .bind(now, now, now).run();
  const expired = await environment.DB.prepare("SELECT id FROM users WHERE expired_at <= ? AND plan != 'lifetime' LIMIT 50")
    .bind(now - 90 * 86400).all<{ id: string }>();
  for (const user of expired.results) {
    try { await deleteAccount(user.id); } catch { /* próxima execução tenta novamente */ }
  }
  await environment.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();
  await environment.DB.prepare('DELETE FROM email_login_tokens WHERE expires_at <= ?').bind(now).run();
  await environment.DB.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(now - 86400).run();
  await environment.DB.prepare('DELETE FROM stripe_events WHERE created_at <= ?').bind(now - 180 * 86400).run();
  const unused = await environment.DB.prepare(`SELECT media_assets.key FROM media_assets JOIN sites ON sites.id = media_assets.site_id
    WHERE media_assets.created_at < ? AND instr(sites.draft_json, '/media/' || media_assets.key) = 0
    AND (sites.published_json IS NULL OR instr(sites.published_json, '/media/' || media_assets.key) = 0) LIMIT 100`)
    .bind(now - 86400).all<{ key: string }>();
  for (const asset of unused.results) {
    await environment.MEDIA.delete(asset.key);
    await environment.DB.prepare('DELETE FROM media_assets WHERE key = ?').bind(asset.key).run();
  }
}

export default {
  fetch(request: Request, environment: WorkerEnv, context: ExecutionContext) {
    return handle(request, environment, context);
  },
  async scheduled(_event: ScheduledEvent, environment: WorkerEnv, context: ExecutionContext) {
    context.waitUntil(cleanExpired(environment));
  },
};
