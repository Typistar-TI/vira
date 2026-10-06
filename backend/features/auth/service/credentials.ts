import { env } from 'cloudflare:workers';
import { setting } from '@backend/platform/config';
import { createAdminSession, createSession, loginScope, sha256 } from './session';
import { consumeLimit, getOrCreateEmailUser } from '../repository/users';
import { languageFromRequest } from './language';
import { clientIp, json } from '@backend/platform/http';

export type CodePurpose = 'login' | 'password';
const ITERATIONS = 100_000; // Workers Web Crypto's supported PBKDF2 iteration ceiling.
const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}

export function newCode(): string {
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values);
  while (values[0] >= 4_294_000_000);
  return String(values[0] % 1_000_000).padStart(6, '0');
}

export async function codeHash(email: string, code: string, purpose: CodePurpose): Promise<string> {
  // A keyed hash prevents offline brute-forcing short codes from a database leak.
  if (!env.CONFIG_ENCRYPTION_KEY) throw new Error('Chave de configuração não definida');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.CONFIG_ENCRYPTION_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return bytesToHex(
    new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(`${purpose}:${email}:${code}`),
      ),
    ),
  );
}

export async function loginLimits(request: Request, email: string, kind: string): Promise<boolean> {
  const [ip, account] = await Promise.all([sha256(clientIp(request)), sha256(email)]);
  const allowed = await Promise.all([
    consumeLimit(`auth:${kind}:ip:${ip}`, 20, 900),
    consumeLimit(`auth:${kind}:account:${account}`, 10, 900),
  ]);
  return allowed.every(Boolean);
}

export function rateLimited(): Response {
  return json(
    { error: 'Muitas tentativas. Aguarde 15 minutos. / Too many attempts. Wait 15 minutes.' },
    429,
    { 'retry-after': '900' },
  );
}

export async function consumeCode(
  email: string,
  code: string,
  purpose: CodePurpose,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  // Increment atomically before checking, including incorrect attempts.
  const row = await env.DB.prepare(
    'UPDATE email_login_codes SET attempts = attempts + 1 WHERE email = ? AND purpose = ? AND expires_at > ? AND attempts < 5 RETURNING attempts',
  )
    .bind(email, purpose, now)
    .first<{ attempts: number }>();
  if (!row) return false;
  const consumed = await env.DB.prepare(
    'DELETE FROM email_login_codes WHERE email = ? AND purpose = ? AND code_hash = ? AND expires_at > ? AND attempts <= 5 RETURNING email',
  )
    .bind(email, purpose, await codeHash(email, code, purpose), now)
    .first();
  return Boolean(consumed);
}

export async function derivePassword(
  password: string,
  salt: string,
  iterations = ITERATIONS,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (byte) => parseInt(byte, 16));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function passwordRecord(password: string) {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, hash: await derivePassword(password, salt), iterations: ITERATIONS };
}

export function equalHashes(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}

export async function establishLogin(
  email: string,
  request: Request,
  password?: Awaited<ReturnType<typeof passwordRecord>>,
  accepted = false,
): Promise<Response> {
  const [admin, existing, controller, contact] = await Promise.all([
    env.DB.prepare('SELECT email FROM admin_accounts WHERE email = ?').bind(email).first(),
    env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first(),
    setting('PRIVACY_CONTROLLER_NAME'),
    setting('PRIVACY_CONTACT_EMAIL'),
  ]);
  const adminLogin = loginScope(request) === 'admin';
  if (adminLogin && !admin) return json({ error: 'Acesso administrativo não autorizado' }, 403);
  if (!existing && !adminLogin && (!controller || !contact))
    return json({ error: 'Cadastro temporariamente indisponível' }, 403);
  let user: { id: string } | null = null;
  try {
    user = adminLogin
      ? null
      : await getOrCreateEmailUser(email, languageFromRequest(request), accepted);
  } catch (error) {
    if (error instanceof Error && error.message === 'consent_required')
      return json(
        {
          error:
            'Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar a conta.',
          consent: true,
        },
        400,
      );
    throw error;
  }
  if (password) {
    // Reset invalidates existing sessions, including sessions from other login methods.
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO auth_passwords (email, password_hash, salt, iterations, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, salt = excluded.salt, iterations = excluded.iterations, updated_at = excluded.updated_at',
      ).bind(
        email,
        password.hash,
        password.salt,
        password.iterations,
        Math.floor(Date.now() / 1000),
      ),
      env.DB.prepare(
        'DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)',
      ).bind(email),
      env.DB.prepare('DELETE FROM admin_sessions WHERE admin_email = ?').bind(email),
    ]);
  }
  return json({ redirect: adminLogin ? '/admin' : '/app' }, 200, {
    'set-cookie': adminLogin ? await createAdminSession(email) : await createSession(user!.id),
    'cache-control': 'no-store',
  });
}
