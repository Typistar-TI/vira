import { env } from 'cloudflare:workers';
import type { AdminIdentity } from '../entities/admin';
export function saveDisplayName(admin: AdminIdentity, name: string) {
  return env.DB.prepare('UPDATE admin_accounts SET display_name = ? WHERE email = ?')
    .bind(name, admin.email)
    .run();
}
