import { env } from 'cloudflare:workers';
import { logEvent } from '@backend/features/logs/repository/logs';
import { isResponse, json, readJson, requireAdmin } from '@backend/platform/http';

const plans = ['trial', 'monthly', 'yearly', 'expired'];

/** Converte 'AAAA-MM-DD' no fim do dia (UTC) em segundos. */
function parseDay(value: unknown): number | null | undefined {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const time = Date.parse(`${value}T23:59:59Z`);
  return Number.isFinite(time) ? Math.floor(time / 1000) : undefined;
}

export const POST = async (request: Request): Promise<Response> => {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    const body = await readJson(request, 4096);
    const type = body.type === 'admin' ? 'admin' : 'user';

    if (type === 'admin') {
      const email = String(body.email || '')
        .trim()
        .toLowerCase();
      const displayName = String(body.displayName || '')
        .trim()
        .slice(0, 80);
      const row = await env.DB.prepare('SELECT email FROM admin_accounts WHERE email = ?')
        .bind(email)
        .first();
      if (!row) return json({ error: 'Administrador não encontrado' }, 404);
      await env.DB.prepare('UPDATE admin_accounts SET display_name = ? WHERE email = ?')
        .bind(displayName, email)
        .run();
      await logEvent(request, {
        kind: 'admin',
        action: 'user_update',
        actorType: 'admin',
        actorId: admin.id,
        target: email,
        metadata: { type: 'admin' },
      });
      return json({ ok: true });
    }

    const id = String(body.id || '');
    const current = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?')
      .bind(id)
      .first<{ id: string; email: string | null }>();
    if (!current) return json({ error: 'Usuário não encontrado' }, 404);

    const emailRaw = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const email = emailRaw === '' ? null : emailRaw;
    if (email !== null && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
      return json({ error: 'E-mail inválido' }, 400);
    if (email && email !== current.email) {
      const taken = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .bind(email, id)
        .first();
      if (taken) return json({ error: 'Já existe uma conta com este e-mail' }, 400);
    }

    const plan = String(body.plan || '');
    if (!plans.includes(plan)) return json({ error: 'Plano inválido' }, 400);
    const trialEnds = parseDay(body.trial_ends_at);
    const accessUntil = parseDay(body.access_until);
    const expiredAt = parseDay(body.expired_at);
    if (trialEnds === undefined || accessUntil === undefined || expiredAt === undefined)
      return json({ error: 'Data inválida' }, 400);
    if (plan === 'trial' && (!trialEnds || trialEnds <= 0))
      return json({ error: 'Informe a data de término do teste' }, 400);
    if ((plan === 'monthly' || plan === 'yearly') && (!accessUntil || accessUntil <= 0))
      return json({ error: 'Informe a data de acesso até' }, 400);

    const queries = [
      env.DB.prepare(
        `UPDATE users SET email = ?, plan = ?, trial_ends_at = COALESCE(?, trial_ends_at),
         access_until = ?, expired_at = ? WHERE id = ?`,
      ).bind(email, plan, trialEnds, accessUntil, expiredAt, id),
    ];
    if (email && current.email && email !== current.email)
      queries.push(
        env.DB.prepare('UPDATE auth_passwords SET email = ? WHERE email = ?').bind(
          email,
          current.email,
        ),
      );
    await env.DB.batch(queries);
    await logEvent(request, {
      kind: 'admin',
      action: 'user_update',
      actorType: 'admin',
      actorId: admin.id,
      target: email ?? id,
      metadata: { type: 'user', plan },
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao salvar' }, 400);
  }
};
