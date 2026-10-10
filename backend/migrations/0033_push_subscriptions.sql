CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('user', 'admin')),
  owner TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  preferences TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX push_subscriptions_owner ON push_subscriptions(audience, owner);
