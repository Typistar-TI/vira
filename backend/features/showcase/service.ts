import { env } from 'cloudflare:workers';
import { rootDomain } from '@backend/platform/config';

export async function publicShowcase() {
  const [count, logos, domain] = await Promise.all([
    env.DB.prepare(
      'SELECT COUNT(*) AS total FROM sites JOIN users ON users.id = sites.user_id',
    ).first<{
      total: number;
    }>(),
    env.DB.prepare(
      `SELECT sites.slug,
        json_extract(sites.published_json, '$.logo') AS logo,
        COALESCE(NULLIF(json_extract(sites.published_json, '$.appName'), ''), json_extract(sites.published_json, '$.title')) AS name
      FROM sites
      JOIN users ON users.id = sites.user_id
      JOIN media_assets ON media_assets.site_id = sites.id
        AND '/media/' || media_assets.key = json_extract(sites.published_json, '$.logo')
      WHERE sites.published_json IS NOT NULL
        AND sites.auto_published = 0
        AND json_extract(sites.published_json, '$.showInShowcase') = 1
        AND (
          users.plan = 'lifetime'
          OR (users.plan = 'trial' AND users.trial_ends_at > unixepoch())
          OR (users.plan IN ('monthly', 'yearly') AND users.access_until > unixepoch())
        )
      ORDER BY sites.published_at DESC
      LIMIT 30`,
    ).all<{ slug: string; logo: string; name: string }>(),
    rootDomain(),
  ]);
  return {
    createdCount: count?.total ?? 0,
    projects: (logos.results ?? []).map(({ slug, logo, name }) => ({
      name,
      logo,
      url: `https://${slug}.${domain}/`,
    })),
  };
}
