import { env } from 'cloudflare:workers';
import { getOrCreateEmailUser } from '../../backend/features/auth/repository/users';
import { createSession } from '../../backend/features/auth/service/session';

export function request(
  path,
  body,
  {
    cookie,
    origin = 'https://example.test',
    ip = '192.0.2.1',
    method = body === undefined ? 'GET' : 'POST',
  } = {},
) {
  return new Request(`https://example.test${path}`, {
    method,
    headers: {
      origin,
      'cf-connecting-ip': ip,
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
export async function customer(plan = 'trial') {
  const email = `${crypto.randomUUID()}@example.test`;
  const user = await getOrCreateEmailUser(email, 'pt');
  await env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind(plan, user.id).run();
  const cookie = (await createSession(user.id)).split(';')[0];
  return { user, email, cookie };
}
