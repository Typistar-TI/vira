import { env } from 'cloudflare:workers';
import { encrypt, rootDomain, setting } from '@backend/platform/config';

export interface VapidKeys {
  subject: string;
  publicKey: string;
  privateKey: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cached: VapidKeys | null = null;

/**
 * VAPID key pair for Web Push, generated once and kept in app_settings.
 * The public key is the base64url raw P-256 point; the private key is the
 * base64url `d` value, stored encrypted.
 */
export async function vapidKeys(): Promise<VapidKeys> {
  if (cached) return cached;
  const [publicKey, privateKey, contact, domain] = await Promise.all([
    setting('VAPID_PUBLIC_KEY'),
    setting('VAPID_PRIVATE_KEY'),
    setting('PRIVACY_CONTACT_EMAIL'),
    rootDomain(),
  ]);
  const subject = contact ? `mailto:${contact}` : `https://${domain}`;
  if (publicKey && privateKey) {
    cached = { subject, publicKey, privateKey };
    return cached;
  }
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
  ]);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const nextPublic = base64Url(raw);
  const nextPrivate = jwk.d ?? '';
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO app_settings (key, value, encrypted, updated_at) VALUES ('VAPID_PUBLIC_KEY', ?, 0, unixepoch())
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, encrypted = 0, updated_at = unixepoch()`,
    ).bind(nextPublic),
    env.DB.prepare(
      `INSERT INTO app_settings (key, value, encrypted, updated_at) VALUES ('VAPID_PRIVATE_KEY', ?, 1, unixepoch())
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, encrypted = 1, updated_at = unixepoch()`,
    ).bind(await encrypt(nextPrivate)),
  ]);
  cached = { subject, publicKey: nextPublic, privateKey: nextPrivate };
  return cached;
}
