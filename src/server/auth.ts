import { env } from 'cloudflare:workers';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { consumeLimit, getOrCreateUser, getUser, type UserRow } from './db';
import { requiredSetting } from './config';
import { stytchRequest } from './stytch';

const sessionName = '__Host-vira_session';
const pendingName = '__Host-vira_otp';

export function normalizePhone(input: string): string | null {
  const phone = parsePhoneNumberFromString(input);
  return phone?.isValid() && (phone.country === 'BR' || phone.country === 'US') ? phone.number : null;
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.set('secret', await requiredSetting('TURNSTILE_SECRET'));
  body.set('response', token);
  body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const result = await response.json() as { success: boolean };
  return result.success === true;
}

export async function sendCode(phone: string, channel: 'sms' | 'whatsapp', ip: string, captcha: string) {
  if (!await verifyTurnstile(captcha, ip)) throw new Error('Confirme a verificação de segurança');
  const phoneKey = await sha256(phone);
  if (!await consumeLimit(`otp-phone:${phoneKey}`, 3, 600) || !await consumeLimit(`otp-ip:${ip}`, 10, 3600)) {
    throw new Error('Muitas tentativas. Aguarde antes de pedir outro código.');
  }
  const result = await stytchRequest(`otps/${channel}/login_or_create`, {
    phone_number: phone, expiration_minutes: 5, create_user_as_pending: true,
    locale: phone.startsWith('+55') ? 'pt-br' : 'en',
  });
  if (!result.user_id || !result.phone_id) throw new Error('Resposta incompleta do serviço de códigos');
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  await env.DB.prepare('INSERT INTO pending_otps (token_hash, phone_hash, stytch_user_id, method_id, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256(token), phoneKey, result.user_id, result.phone_id, Math.floor(Date.now() / 1000) + 300).run();
  return `${pendingName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`;
}

export async function checkCode(phone: string, code: string, ip: string, request: Request) {
  const phoneKey = await sha256(phone);
  if (!await consumeLimit(`check-phone:${phoneKey}`, 10, 600) || !await consumeLimit(`check-ip:${ip}`, 20, 600)) {
    throw new Error('Muitas tentativas. Aguarde alguns minutos.');
  }
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${pendingName}=`))?.slice(pendingName.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Peça um novo código neste navegador');
  const tokenHash = await sha256(token);
  const pending = await env.DB.prepare('SELECT phone_hash, stytch_user_id, method_id FROM pending_otps WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash, Math.floor(Date.now() / 1000)).first<{ phone_hash: string; stytch_user_id: string; method_id: string }>();
  if (!pending || pending.phone_hash !== phoneKey) throw new Error('Código expirado. Peça outro código');
  const result = await stytchRequest('otps/authenticate', { method_id: pending.method_id, code });
  if (result.user_id !== pending.stytch_user_id) throw new Error('Não foi possível confirmar o celular');
  const user = await getOrCreateUser(phone);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET stytch_user_id = ? WHERE id = ?').bind(result.user_id, user.id),
    env.DB.prepare('DELETE FROM pending_otps WHERE token_hash = ?').bind(tokenHash),
  ]);
  return user;
}

export const clearPendingCookie = `${pendingName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

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
