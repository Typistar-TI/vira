import { env } from 'cloudflare:workers';

export type ConsentKind = 'cookies' | 'terms' | 'privacy';

interface ConsentInput {
  userId?: string | null;
  subject?: string | null;
  kind: ConsentKind;
  version: string;
  ipHash?: string | null;
  userAgent?: string | null;
}

export async function recordConsent(input: ConsentInput): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO consents (id, user_id, subject, kind, version, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      crypto.randomUUID(),
      input.userId ?? null,
      input.subject ?? null,
      input.kind,
      input.version.slice(0, 20) || '1',
      input.ipHash ?? null,
      (input.userAgent ?? '').slice(0, 300) || null,
    )
    .run();
}

/** Records the signup acceptance of the Terms of Use and the Privacy Policy. */
export async function recordTermsAcceptance(
  userId: string,
  subject: string,
  version = '1',
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO consents (id, user_id, subject, kind, version, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), userId, subject, 'terms', version, now),
    env.DB.prepare(
      'INSERT INTO consents (id, user_id, subject, kind, version, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), userId, subject, 'privacy', version, now),
  ]);
}
