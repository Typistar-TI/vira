CREATE TABLE email_templates (
  key TEXT PRIMARY KEY CHECK (key IN ('login', 'site_created', 'subscription_created', 'subscription_ending')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO email_templates (key, subject, html) VALUES
  ('login', 'Seu acesso ao Vira / Your Vira sign-in link', '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b"><h1 style="color:#9b6823">Entrar no Vira / Sign in to Vira</h1><p>Use o botão abaixo para entrar. O link expira em 15 minutos e funciona uma única vez.<br>Use the button below to sign in. This one-time link expires in 15 minutes.</p><p><a href="{{login_url}}" style="display:inline-block;padding:14px 22px;background:#b88333;color:#fff;text-decoration:none;border-radius:8px">Entrar / Sign in</a></p><p>Se você não pediu o acesso, ignore este e-mail.<br>If you did not request this link, ignore this email.</p></div>'),
  ('site_created', 'Seu site no Vira está no ar / Your Vira site is live', '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b"><h1 style="color:#9b6823">Seu site está no ar / Your site is live</h1><p>Criamos uma página inicial no seu endereço. Personalize no painel e publique suas alterações.<br>We created a starter page at your address. Customize it in the dashboard and publish your changes.</p><p><a href="{{site_url}}" style="color:#9b6823">Ver site / View site</a> · <a href="{{dashboard_url}}" style="color:#9b6823">Abrir painel / Open dashboard</a></p><p>Teste até / Trial ends: {{end_date}}</p></div>'),
  ('subscription_created', 'Assinatura Vira confirmada / Vira subscription confirmed', '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b"><h1 style="color:#9b6823">Assinatura confirmada / Subscription confirmed</h1><p>Seu plano {{plan}} está ativo. Obrigado por criar com o Vira.<br>Your plan is active. Thank you for creating with Vira.</p><p><a href="{{dashboard_url}}" style="color:#9b6823">Abrir painel / Open dashboard</a></p><p>Seu site / Your site: {{site_url}}</p></div>'),
  ('subscription_ending', 'Seu acesso ao Vira termina em breve / Your Vira access ends soon', '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#30251b"><h1 style="color:#9b6823">Seu acesso termina em breve / Your access ends soon</h1><p>O período do seu plano {{plan}} termina em {{end_date}}. Veja as opções no painel para continuar com sua página.<br>Your access ends on that date. Check your options in the dashboard to keep your page online.</p><p><a href="{{dashboard_url}}" style="color:#9b6823">Ver painel / Open dashboard</a></p></div>');

CREATE TABLE email_outbox (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL REFERENCES email_templates(key),
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
CREATE INDEX email_outbox_ready ON email_outbox(status, next_attempt_at);
CREATE INDEX email_outbox_recent ON email_outbox(created_at DESC);

ALTER TABLE users ADD COLUMN subscription_ending_at INTEGER;
ALTER TABLE sites ADD COLUMN auto_published INTEGER NOT NULL DEFAULT 0 CHECK (auto_published IN (0, 1));
