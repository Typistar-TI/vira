import { env } from 'cloudflare:workers';
import { getUser, type UserRow } from '@backend/features/auth/repository/users';

const sessionName = '__Host-vira_session';
const adminSessionName = '__Host-vira_admin_session';

export type SessionScope = 'app' | 'admin';

export function loginScope(request: Request): SessionScope {
  return new URL(request.url).searchParams.get('next') === 'admin' ? 'admin' : 'app';
}

function cookieToken(request: Request, name: string): string | null {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

function newToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken();
  const expires = Math.floor(Date.now() / 1000) + 30 * 86400;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, expires)
    .run();
  return `${sessionName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export async function createAdminSession(email: string): Promise<string> {
  const token = newToken();
  const expires = Math.floor(Date.now() / 1000) + 30 * 86400;
  await env.DB.prepare(
    'INSERT INTO admin_sessions (token_hash, admin_email, expires_at) VALUES (?, ?, ?)',
  )
    .bind(await sha256(token), email, expires)
    .run();
  return `${adminSessionName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export function lastLoginCookie(method: 'google' | 'code' | 'password'): string {
  return `vira_last_login=${method}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

const pendingCookieName = 'vira_google_pending';

export interface PendingGoogle {
  sub: string;
  email: string;
  lang: 'pt' | 'en';
  exp: number;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

async function pendingSignature(value: string): Promise<string> {
  if (!env.CONFIG_ENCRYPTION_KEY) throw new Error('Chave de configuração não definida');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.CONFIG_ENCRYPTION_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Signed, short-lived cookie holding a verified Google identity awaiting terms acceptance. */
export async function googlePendingCookie(payload: PendingGoogle): Promise<string> {
  const body = toBase64Url(JSON.stringify(payload));
  return `${pendingCookieName}=${body}.${await pendingSignature(body)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900`;
}

export async function readGooglePending(request: Request): Promise<PendingGoogle | null> {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${pendingCookieName}=`))
    ?.slice(pendingCookieName.length + 1);
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature || (await pendingSignature(body)) !== signature) return null;
  try {
    const data = JSON.parse(fromBase64Url(body)) as PendingGoogle;
    if (!data.sub || !data.email || typeof data.exp !== 'number') return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearGooglePendingCookie(): string {
  return `${pendingCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionAdmin(
  request: Request,
): Promise<{ id: string; email: string; displayName: string; avatar: string | null } | null> {
  const token = cookieToken(request, adminSessionName);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT s.admin_email, a.display_name, a.avatar FROM admin_sessions s
     JOIN admin_accounts a ON a.email = s.admin_email
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(await sha256(token), Math.floor(Date.now() / 1000))
    .first<{ admin_email: string; display_name: string; avatar: string | null }>();
  return row
    ? {
        id: row.admin_email,
        email: row.admin_email,
        displayName: row.display_name,
        avatar: row.avatar,
      }
    : null;
}

export async function getSessionUser(request: Request): Promise<UserRow | null> {
  const token = cookieToken(request, sessionName);
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?',
  )
    .bind(await sha256(token), Math.floor(Date.now() / 1000))
    .first<{ user_id: string }>();
  return row ? getUser(row.user_id) : null;
}

export async function logout(request: Request, scope: SessionScope = 'app'): Promise<Headers> {
  const token = scope === 'app' ? cookieToken(request, sessionName) : null;
  const adminToken = scope === 'admin' ? cookieToken(request, adminSessionName) : null;
  if (token)
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await sha256(token))
      .run();
  if (adminToken)
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
      .bind(await sha256(adminToken))
      .run();
  const headers = new Headers();
  headers.set(
    'set-cookie',
    `${scope === 'admin' ? adminSessionName : sessionName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
  return headers;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}

/** Same-origin browser GET fetches omit Origin but provide Fetch Metadata. Never use for writes. */
export function sameOriginRead(request: Request): boolean {
  return (
    sameOrigin(request) ||
    (request.method === 'GET' &&
      !request.headers.has('origin') &&
      request.headers.get('sec-fetch-site') === 'same-origin')
  );
}
