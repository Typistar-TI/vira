import { env } from 'cloudflare:workers';
import type { AdminIdentity } from '../entities/admin';
export function saveProfile(admin: AdminIdentity, name: string, avatar: string | null) {
  return env.DB.prepare('UPDATE admin_accounts SET display_name = ?, avatar = ? WHERE email = ?')
    .bind(name, avatar, admin.email)
    .run();
}
