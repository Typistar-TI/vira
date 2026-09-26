CREATE TABLE stripe_price_catalog (
  stripe_price_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly', 'lifetime')),
  currency TEXT NOT NULL CHECK (currency IN ('brl', 'usd')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
