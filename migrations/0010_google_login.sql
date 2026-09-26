ALTER TABLE users ADD COLUMN google_sub TEXT;
ALTER TABLE users ADD COLUMN email TEXT;
CREATE UNIQUE INDEX users_google_sub ON users(google_sub);

CREATE TABLE admin_google_accounts (
  email TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
DROP TABLE admin_phones;

INSERT INTO app_settings (key, value, encrypted) VALUES ('GOOGLE_CLIENT_ID', '', 0);
DELETE FROM app_settings WHERE key IN (
  'TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_VERIFY_SERVICE_SID',
  'TURNSTILE_SECRET', 'PUBLIC_TURNSTILE_SITE_KEY'
);
