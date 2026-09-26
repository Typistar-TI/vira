CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  encrypted INTEGER NOT NULL DEFAULT 0 CHECK (encrypted IN (0, 1)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO app_settings (key, value, encrypted) VALUES
  ('ROOT_DOMAIN', 'vira.ia.br', 0),
  ('PUBLIC_TURNSTILE_SITE_KEY', '', 0),
  ('CLOUDFLARE_ZONE_ID', '', 0),
  ('CLOUDFLARE_ACCOUNT_ID', '', 0),
  ('TWILIO_API_KEY', '', 1),
  ('TWILIO_API_SECRET', '', 1),
  ('TWILIO_VERIFY_SERVICE_SID', '', 1),
  ('TURNSTILE_SECRET', '', 1),
  ('STRIPE_SECRET_KEY', '', 1),
  ('STRIPE_WEBHOOK_SECRET', '', 1),
  ('CLOUDFLARE_API_TOKEN', '', 1),
  ('CLOUDFLARE_ANALYTICS_TOKEN', '', 1);

CREATE TABLE plan_prices (
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly', 'lifetime')),
  currency TEXT NOT NULL CHECK (currency IN ('brl', 'usd')),
  amount_minor INTEGER,
  stripe_price_id TEXT,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (plan, currency)
);

INSERT INTO plan_prices (plan, currency) VALUES
  ('monthly', 'brl'), ('yearly', 'brl'), ('lifetime', 'brl'),
  ('monthly', 'usd'), ('yearly', 'usd'), ('lifetime', 'usd');
