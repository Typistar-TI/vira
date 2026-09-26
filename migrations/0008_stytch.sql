INSERT INTO app_settings (key, value, encrypted) VALUES
  ('STYTCH_PROJECT_ID', '', 0),
  ('STYTCH_SECRET', '', 1);

DELETE FROM app_settings WHERE key IN ('TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_VERIFY_SERVICE_SID');

ALTER TABLE users ADD COLUMN stytch_user_id TEXT;

CREATE TABLE pending_otps (
  token_hash TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL,
  stytch_user_id TEXT NOT NULL,
  method_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
