import { env } from 'cloudflare:workers';
import { getUser, type UserRow } from '../db';

const sessionName = '__Host-vira_session';
const adminSessionName = '__Host-vira_admin_session';

function cookieToken(request: Request, name: string): string | null {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

function newToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken();
  const expires = Math.floor(Date.now() / 1000) + 30 * 86400;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, expires).run();
  return `${sessionName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export async function createAdminSession(email: string): Promise<string> {
  const token = newToken();
  const expires = Math.floor(Date.now() / 1000) + 30 * 86400;
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash, admin_email, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), email, expires).run();
  return `${adminSessionName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`;
}

export async function getSessionAdmin(request: Request): Promise<{ id: string; email: string } | null> {
  const token = cookieToken(request, adminSessionName);
  if (!token) return null;
  const row = await env.DB.prepare('SELECT admin_email FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await sha256(token), Math.floor(Date.now() / 1000)).first<{ admin_email: string }>();
  return row ? { id: row.admin_email, email: row.admin_email } : null;
}

export async function getSessionUser(request: Request): Promise<UserRow | null> {
  const token = cookieToken(request, sessionName);
  if (!token) return null;
  const row = await env.DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await sha256(token), Math.floor(Date.now() / 1000)).first<{ user_id: string }>();
  return row ? getUser(row.user_id) : null;
}

export async function logout(request: Request): Promise<Headers> {
  const token = cookieToken(request, sessionName);
  const adminToken = cookieToken(request, adminSessionName);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  if (adminToken) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(adminToken)).run();
  const headers = new Headers();
  headers.append('set-cookie', `${sessionName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  headers.append('set-cookie', `${adminSessionName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return headers;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
