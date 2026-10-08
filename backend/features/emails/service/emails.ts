import { env } from 'cloudflare:workers';
import { requiredSetting, rootDomain } from '@backend/platform/config';

import type { EmailKind, EmailTemplate } from '../entities/template';
export { emailKinds } from '../entities/template';
export type { EmailKind, EmailTemplate } from '../entities/template';
import { findTemplate } from '../repository/templates';

export const emailVariables = {
  login: ['login_code', 'email'],
  site_created: ['dashboard_url', 'site_url', 'end_date', 'end_date_pt', 'end_date_en', 'email'],
  subscription_created: ['dashboard_url', 'site_url', 'plan', 'plan_pt', 'plan_en', 'email'],
  subscription_ending: [
    'dashboard_url',
    'site_url',
    'plan',
    'plan_pt',
    'plan_en',
    'end_date',
    'end_date_pt',
    'end_date_en',
    'email',
  ],
} satisfies Record<EmailKind, string[]>;

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const codes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return codes[char];
  });

export function renderEmail(template: EmailTemplate, variables: Record<string, string>) {
  const [legacyDatePt, legacyDateEn] = (variables.end_date ?? '').split(' / ');
  const [legacyPlanPt, legacyPlanEn] = (variables.plan ?? '').split(' / ');
  const values: Record<string, string> = {
    ...variables,
    end_date_pt: variables.end_date_pt ?? legacyDatePt ?? '',
    end_date_en: variables.end_date_en ?? legacyDateEn ?? legacyDatePt ?? '',
    plan_pt: variables.plan_pt ?? legacyPlanPt ?? '',
    plan_en: variables.plan_en ?? legacyPlanEn ?? legacyPlanPt ?? '',
  };
  const replace = (_match: string, name: string) => escapeHtml(values[name] ?? '');
  return {
    subject: template.subject.replace(/{{\s*([a-z_]+)\s*}}/g, replace),
    html: template.html.replace(/{{\s*([a-z_]+)\s*}}/g, replace),
  };
}

export function validateTemplate(key: EmailKind, subject: string, html: string): string | null {
  if (!subject || subject.length > 180 || /[\r\n]/.test(subject))
    return 'Assunto deve ter até 180 caracteres e uma linha.';
  if (!html || html.length > 32_000) return 'HTML deve ter entre 1 e 32.000 caracteres.';
  if (
    /<\s*\/?\s*(script|iframe|object|embed|form|base)\b|<\s*meta\b[^>]*http-equiv\s*=|\bon[a-z]+\s*=|javascript\s*:/i.test(
      html,
    )
  )
    return 'O HTML contém elementos ou atributos não permitidos em e-mails.';
  const names = [
    ...subject.matchAll(/{{\s*([^{}]+)\s*}}/g),
    ...html.matchAll(/{{\s*([^{}]+)\s*}}/g),
  ].map((match) => match[1].trim());
  if (names.some((name) => !emailVariables[key].includes(name)))
    return 'O template contém uma variável não disponível para este e-mail.';
  if (key === 'login' && !html.includes('{{login_code}}'))
    return 'O e-mail de acesso precisa conter {{login_code}}.';
  return null;
}

export async function templateFor(key: EmailKind): Promise<EmailTemplate> {
  const row = await findTemplate(key);
  if (!row) throw new Error(`Template de e-mail ${key} não encontrado`);
  return row;
}

function plainText(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/^[\s\S]*?<body\b[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '')
    .replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gis, '$3: $2')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function sendResend(
  recipient: string,
  content: { subject: string; html: string },
  idempotencyKey: string,
) {
  const [key, from] = await Promise.all([
    requiredSetting('RESEND_API_KEY'),
    requiredSetting('AUTH_EMAIL_FROM'),
  ]);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: content.subject,
      html: content.html,
      text: plainText(content.html),
    }),
  });
  if (!response.ok) throw new Error(`Resend retornou HTTP ${response.status}`);
}

export async function sendLoginEmail(email: string, code: string, tokenHash: string) {
  const template = await templateFor('login');
  if (!template.enabled) throw new Error('Entrada por e-mail desativada');
  const content = renderEmail(template, {
    email,
    login_code: code,
  });
  await sendResend(email, content, `login-${tokenHash}`);
}

export function queueEmailStatement(
  kind: Exclude<EmailKind, 'login'>,
  dedupeKey: string,
  recipient: string,
  variables: Record<string, string>,
) {
  return env.DB.prepare(
    `INSERT OR IGNORE INTO email_outbox (id, dedupe_key, template_key, recipient, variables_json)
     SELECT ?, ?, key, ?, ? FROM email_templates WHERE key = ? AND enabled = 1`,
  ).bind(crypto.randomUUID(), dedupeKey, recipient, JSON.stringify(variables), kind);
}

export async function queueEmail(
  kind: Exclude<EmailKind, 'login'>,
  dedupeKey: string,
  recipient: string,
  variables: Record<string, string>,
) {
  await queueEmailStatement(kind, dedupeKey, recipient, variables).run();
}

export async function siteUrl(slug: string) {
  return `https://${slug}.${await rootDomain()}`;
}

export async function dashboardUrl() {
  return `https://${await rootDomain()}/app`;
}

export function endDateParts(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const pt = date.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const en = date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { pt, en };
}

export function endDate(timestamp: number) {
  const { pt, en } = endDateParts(timestamp);
  return `${pt} / ${en}`;
}

export function planNames(plan: 'trial' | 'monthly' | 'yearly') {
  const names = {
    trial: { pt: 'teste grátis', en: 'free trial' },
    monthly: { pt: 'mensal', en: 'monthly' },
    yearly: { pt: 'anual', en: 'yearly' },
  };
  return names[plan];
}

export async function flushEmailOutbox(limit = 10) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    "UPDATE email_outbox SET status = 'pending' WHERE status = 'sending' AND locked_at < ?",
  )
    .bind(now - 900)
    .run();
  const pending = await env.DB.prepare(
    "SELECT id FROM email_outbox WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY created_at LIMIT ?",
  )
    .bind(now, limit)
    .all<{ id: string }>();
  for (const item of pending.results) {
    const row = await env.DB.prepare(
      "UPDATE email_outbox SET status = 'sending', attempts = attempts + 1, locked_at = ? WHERE id = ? AND status = 'pending' RETURNING *",
    )
      .bind(now, item.id)
      .first<{
        id: string;
        template_key: EmailKind;
        recipient: string;
        variables_json: string;
        subject: string | null;
        html: string | null;
        attempts: number;
      }>();
    if (!row) continue;
    try {
      const template = await templateFor(row.template_key);
      if (!template.enabled) {
        await env.DB.prepare("UPDATE email_outbox SET status = 'suppressed' WHERE id = ?")
          .bind(row.id)
          .run();
        continue;
      }
      let content = { subject: row.subject, html: row.html };
      if (!content.subject || !content.html) {
        content = renderEmail(template, JSON.parse(row.variables_json));
        await env.DB.prepare('UPDATE email_outbox SET subject = ?, html = ? WHERE id = ?')
          .bind(content.subject, content.html, row.id)
          .run();
      }
      await sendResend(row.recipient, content as { subject: string; html: string }, row.id);
      await env.DB.prepare(
        "UPDATE email_outbox SET status = 'sent', sent_at = ?, last_error = NULL WHERE id = ?",
      )
        .bind(Math.floor(Date.now() / 1000), row.id)
        .run();
    } catch (error) {
      const failed = row.attempts >= 5;
      const delay = Math.min(86400, 300 * 2 ** (row.attempts - 1));
      await env.DB.prepare(
        'UPDATE email_outbox SET status = ?, next_attempt_at = ?, last_error = ? WHERE id = ?',
      )
        .bind(
          failed ? 'failed' : 'pending',
          Math.floor(Date.now() / 1000) + delay,
          error instanceof Error ? error.message.slice(0, 200) : 'Falha no envio',
          row.id,
        )
        .run();
    }
  }
}
