import { getSessionUser, sameOrigin } from './auth';
import { consumeLimit } from './db';
import { env } from 'cloudflare:workers';
import type { UserRow } from './db';

export function json(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}

export async function readBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('Requisição muito grande');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) throw new Error('Requisição muito grande');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readJson(request: Request, maxBytes = 32 * 1024): Promise<any> {
  return JSON.parse(new TextDecoder().decode(await readBody(request, maxBytes)));
}

export async function readText(request: Request, maxBytes = 128 * 1024): Promise<string> {
  return new TextDecoder().decode(await readBody(request, maxBytes));
}

export async function readFormData(request: Request, maxBytes = 6 * 1024 * 1024): Promise<FormData> {
  const bytes = await readBody(request, maxBytes);
  return new Request(request.url, { method: 'POST', headers: { 'content-type': request.headers.get('content-type') || '' }, body: bytes.buffer as ArrayBuffer }).formData();
}

export async function requireUser(request: Request): Promise<UserRow | Response> {
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const user = await getSessionUser(request);
  if (!user) return json({ error: 'Entre na sua conta' }, 401);
  const path = new URL(request.url).pathname;
  const allowed = await consumeLimit(`api:${user.id}:${request.method}:${path}`, request.method === 'GET' ? 30 : 60, 60);
  return allowed ? user : json({ error: 'Muitas requisições. Aguarde um minuto.' }, 429, { 'retry-after': '60' });
}

export function isResponse(value: UserRow | Response): value is Response {
  return value instanceof Response;
}

export async function requireAdmin(request: Request): Promise<UserRow | Response> {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const row = user.google_sub ? await env.DB.prepare('SELECT email FROM admin_google_accounts WHERE google_sub = ?').bind(user.google_sub).first() : null;
  return row ? user : json({ error: 'Acesso restrito' }, 403);
}

export function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}
