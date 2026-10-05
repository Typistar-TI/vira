import { env } from 'cloudflare:workers';
import type { EmailKind, EmailTemplate } from '../entities/template';
export function findTemplate(key: EmailKind) {
  return env.DB.prepare('SELECT key, enabled, subject, html FROM email_templates WHERE key = ?')
    .bind(key)
    .first<EmailTemplate>();
}
