import type { APIRoute } from 'astro';
import { normalizePhone, sendCode, sameOrigin } from '@/server/auth';
import { setting } from '@/server/config';
import { clientIp, json, readJson } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ error: 'Origem inválida' }, 403);
  const [controller, contact] = await Promise.all([setting('PRIVACY_CONTROLLER_NAME'), setting('PRIVACY_CONTACT_EMAIL')]);
  if (!controller || !contact) return json({ error: 'Cadastro temporariamente indisponível' }, 503);
  try {
    const { phone: raw, channel, captcha } = await readJson(request, 2048);
    const phone = normalizePhone(String(raw || ''));
    if (!phone || !['sms', 'whatsapp'].includes(channel)) return json({ error: 'Use um celular válido do Brasil ou dos EUA' }, 400);
    await sendCode(phone, channel, clientIp(request), String(captcha || ''));
    return json({ phone, sent: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Não foi possível enviar o código' }, 400);
  }
};
