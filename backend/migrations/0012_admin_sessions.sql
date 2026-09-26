CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL REFERENCES admin_accounts(email) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX admin_sessions_email ON admin_sessions(admin_email);

-- Remove only the unused trial account automatically created for an administrator.
-- Paid accounts, published pages, custom domains and uploaded media are preserved.
DELETE FROM users
WHERE email IN (SELECT email FROM admin_accounts)
  AND plan = 'trial'
  AND stripe_customer_id IS NULL
  AND stripe_subscription_id IS NULL
  AND lifetime_payment_intent IS NULL
  AND EXISTS (
    SELECT 1 FROM sites s
    WHERE s.user_id = users.id
      AND s.slug = 'site-' || substr(users.id, 1, 8)
      AND s.published_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM domains d WHERE d.site_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM media_assets m WHERE m.site_id = s.id)
  );
