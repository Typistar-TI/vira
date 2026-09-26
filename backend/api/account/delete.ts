import type { APIRoute } from 'astro';
import { deleteAccount } from '@backend/account';
import { isResponse, json, readJson, requireUser } from '@backend/http';

export const POST: APIRoute = async ({ request }) => {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  try {
    const { email } = await readJson(request, 2048);
    const expected = user.email ?? 'EXCLUIR';
    if (String(email).trim().toLowerCase() !== expected.toLowerCase()) return json({ error: 'Confirme a identificação da conta' }, 400);
    await deleteAccount(user.id);
    return json({ ok: true }, 200, {
      'set-cookie': '__Host-vira_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    });
  } catch {
    return json({ error: 'Não foi possível excluir a conta agora. Tente novamente ou contate o suporte.' }, 503);
  }
};
