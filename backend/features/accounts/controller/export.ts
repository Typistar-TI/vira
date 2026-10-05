import { env } from 'cloudflare:workers';
import { getSiteForUser } from '@backend/features/sites/repository/sites';
import { isResponse, requireUser } from '@backend/platform/http';

export const GET = async (request: Request): Promise<Response> => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const site = await getSiteForUser(user.id);
  const domain = site
    ? await env.DB.prepare(
        'SELECT hostname, status, ssl_status, created_at FROM domains WHERE site_id = ?',
      )
        .bind(site.id)
        .first()
    : null;
  const communications = user.email
    ? (
        await env.DB.prepare(
          'SELECT template_key, subject, status, created_at, sent_at FROM email_outbox WHERE recipient = ? ORDER BY created_at DESC',
        )
          .bind(user.email)
          .all()
      ).results
    : [];
  const data = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      legacy_phone: user.google_sub ? null : user.phone,
      plan: user.plan,
      trial_ends_at: user.trial_ends_at,
      access_until: user.access_until,
    },
    site: site
      ? {
          slug: site.slug,
          draft: JSON.parse(site.draft_json),
          published: site.published_json ? JSON.parse(site.published_json) : null,
          published_at: site.published_at,
        }
      : null,
    domain,
    communications,
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="vira-dados.json"',
      'cache-control': 'no-store',
    },
  });
};
