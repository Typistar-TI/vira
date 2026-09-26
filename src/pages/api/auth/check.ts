import type { APIRoute } from 'astro';
import { checkCode, clearPendingCookie, createSession, normalizePhone, sameOrigin } from '@/server/auth';
import { clientIp, json, readJson } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  try {
    const { phone: raw, code } = await readJson(request, 2048);
    const phone = normalizePhone(String(raw || ''));
    if (!phone || !/^\d{4,10}$/.test(String(code))) return json({ error: 'Celular ou código inválido' }, 400);
    const user = await checkCode(phone, String(code), clientIp(request), request);
    const response = json({ ok: true });
    response.headers.append('set-cookie', await createSession(user.id));
    response.headers.append('set-cookie', clearPendingCookie);
    return response;
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Não foi possível entrar' }, 400);
  }
};
