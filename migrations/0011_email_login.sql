CREATE UNIQUE INDEX users_email ON users(email);
ALTER TABLE admin_google_accounts RENAME TO admin_accounts;

CREATE TABLE email_login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX email_login_tokens_expires_at ON email_login_tokens(expires_at);

INSERT INTO app_settings (key, value, encrypted) VALUES
  ('RESEND_API_KEY', '', 1),
  ('AUTH_EMAIL_FROM', '', 0);
