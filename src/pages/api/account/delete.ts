import type { APIRoute } from 'astro';
import { deleteAccount } from '@/server/account';
import { isResponse, json, readJson, requireUser } from '@/server/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  try {
    const { phone } = await readJson(request, 2048);
    if (phone !== user.phone) return json({ error: 'Confirme o celular completo da conta' }, 400);
    await deleteAccount(user.id);
    return json({ ok: true }, 200, {
      'set-cookie': '__Host-vira_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    });
  } catch {
    return json({ error: 'Não foi possível excluir a conta agora. Tente novamente ou contate o suporte.' }, 503);
  }
};
