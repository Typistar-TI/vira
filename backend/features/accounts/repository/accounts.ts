import { env } from 'cloudflare:workers';
import type { AccountSite } from '../entities/account';
export function accountSite(userId: string) {
  return env.DB.prepare('SELECT id FROM sites WHERE user_id = ?').bind(userId).first<AccountSite>();
}
