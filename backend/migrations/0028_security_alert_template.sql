-- Adiciona o modelo de e-mail de alerta de segurança ao sistema de templates.
-- Rebuild seguro: email_templates + email_outbox (FK) numa migração só.

CREATE TABLE email_templates_new (
  key TEXT PRIMARY KEY CHECK (key IN ('login', 'site_created', 'subscription_created', 'subscription_ending', 'security_alert')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO email_templates_new (key, enabled, subject, html, updated_at)
  SELECT key, enabled, subject, html, updated_at FROM email_templates;
INSERT INTO email_templates_new (key, subject, html) VALUES (
  'security_alert',
  'Alerta de segurança · Vira / Security alert',
  '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b"><h1 style="color:#a13a3a">Alerta de segurança / Security alert</h1><p>Um evento de segurança foi registrado no Vira.<br>A security event was recorded on Vira.</p><table style="font-size:14px;border-collapse:collapse"><tr><td style="padding:4px 12px 4px 0;color:#625a51">Quando / When</td><td style="padding:4px 0"><strong>{{when}}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#625a51">Ação / Action</td><td style="padding:4px 0"><strong>{{action}}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#625a51">Tipo / Kind</td><td style="padding:4px 0"><strong>{{kind}} · {{severity}}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#625a51">Ator / Actor</td><td style="padding:4px 0"><strong>{{actor}}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#625a51">Alvo / Target</td><td style="padding:4px 0"><strong>{{target}}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#625a51">IP</td><td style="padding:4px 0"><strong>{{ip}}</strong></td></tr></table><p><a href="{{logs_url}}" style="color:#9b6823">Ver logs / View logs</a></p></div>'
);

CREATE TABLE email_outbox_new (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL REFERENCES email_templates_new(key),
  recipient TEXT NOT NULL,
  variables_json TEXT NOT NULL,
  subject TEXT,
  html TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'suppressed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT (unixepoch()),
  locked_at INTEGER,
  sent_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO email_outbox_new
  SELECT id, dedupe_key, template_key, recipient, variables_json, subject, html, status,
    attempts, next_attempt_at, locked_at, sent_at, last_error, created_at
  FROM email_outbox;

DROP TABLE email_outbox;
DROP TABLE email_templates;
ALTER TABLE email_templates_new RENAME TO email_templates;
ALTER TABLE email_outbox_new RENAME TO email_outbox;
CREATE INDEX email_outbox_ready ON email_outbox(status, next_attempt_at);
CREATE INDEX email_outbox_recent ON email_outbox(created_at DESC);
