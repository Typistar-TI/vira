import { env } from 'cloudflare:workers';
import { getUser, type UserRow } from '../db';

const sessionName = '__Host-vira_session';

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
  const expires = Math.floor(Date.now() / 1000) + 30 * 86400;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, expires).run();
  return `${sessionName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export async function getSessionUser(request: Request): Promise<UserRow | null> {
  const token = request.headers.get('cookie')?.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${sessionName}=`))?.slice(sessionName.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await env.DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await sha256(token), Math.floor(Date.now() / 1000)).first<{ user_id: string }>();
  return row ? getUser(row.user_id) : null;
}

export async function logout(request: Request) {
  const token = request.headers.get('cookie')?.split(';').map((x) => x.trim()).find((x) => x.startsWith(`${sessionName}=`))?.slice(sessionName.length + 1);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return `${sessionName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
