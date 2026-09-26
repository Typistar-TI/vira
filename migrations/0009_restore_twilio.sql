INSERT OR IGNORE INTO app_settings (key, value, encrypted) VALUES
  ('TWILIO_API_KEY', '', 1),
  ('TWILIO_API_SECRET', '', 1),
  ('TWILIO_VERIFY_SERVICE_SID', '', 1);

DELETE FROM app_settings WHERE key IN ('STYTCH_PROJECT_ID', 'STYTCH_SECRET');
DROP TABLE IF EXISTS pending_otps;
