import { env } from 'cloudflare:workers';
import type { AdminIdentity } from '../entities/admin';
export function saveDisplayName(admin: AdminIdentity, name: string) {
  return env.DB.batch([
    env.DB.prepare('UPDATE admin_accounts SET display_name = ? WHERE email = ?').bind(
      name,
      admin.email,
    ),
    env.DB.prepare(
      'INSERT INTO admin_audit (id, actor_id, action, target) VALUES (?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), admin.id, 'update_profile', admin.email),
  ]);
}
