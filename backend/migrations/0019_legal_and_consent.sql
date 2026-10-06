INSERT INTO app_settings (key, value, encrypted) VALUES
  ('PRIVACY_POLICY', '', 0),
  ('TERMS_OF_USE', '', 0),
  ('CONTACT_EMAIL', '', 0),
  ('SOCIAL_INSTAGRAM', '', 0),
  ('SOCIAL_X', '', 0),
  ('SOCIAL_FACEBOOK', '', 0),
  ('SOCIAL_YOUTUBE', '', 0),
  ('SOCIAL_LINKEDIN', '', 0),
  ('SOCIAL_TIKTOK', '', 0),
  ('SOCIAL_WHATSAPP', '', 0);

CREATE TABLE consents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  subject TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('cookies', 'terms', 'privacy')),
  version TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX consents_user_idx ON consents (user_id);
CREATE INDEX consents_kind_created_idx ON consents (kind, created_at);
