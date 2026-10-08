-- Remoção integral do plano vitalício. O sistema passa a ter apenas mensal e anual.

-- 1) Contas vitalícias remanescentes passam a ter acesso anual permanente.
UPDATE users
SET plan = 'yearly',
    access_until = 4102444800,
    expired_at = NULL
WHERE plan = 'lifetime';

-- 2) plan_prices sem 'lifetime' no CHECK.
CREATE TABLE plan_prices_new (
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  currency TEXT NOT NULL CHECK (currency IN ('brl', 'usd')),
  amount_minor INTEGER,
  stripe_price_id TEXT,
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (plan, currency)
);
INSERT INTO plan_prices_new (plan, currency, amount_minor, stripe_price_id, active, updated_at)
  SELECT plan, currency, amount_minor, stripe_price_id, active, updated_at FROM plan_prices;
DROP TABLE plan_prices;
ALTER TABLE plan_prices_new RENAME TO plan_prices;

-- 3) stripe_price_catalog sem 'lifetime' no CHECK.
CREATE TABLE stripe_price_catalog_new (
  stripe_price_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  currency TEXT NOT NULL CHECK (currency IN ('brl', 'usd')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO stripe_price_catalog_new (stripe_price_id, plan, currency, amount_minor, created_at)
  SELECT stripe_price_id, plan, currency, amount_minor, created_at
  FROM stripe_price_catalog WHERE plan != 'lifetime';
DROP TABLE stripe_price_catalog;
ALTER TABLE stripe_price_catalog_new RENAME TO stripe_price_catalog;

-- 4) Remove a coluna de pagamento vitalício.
DROP INDEX IF EXISTS users_lifetime_payment_intent;
ALTER TABLE users DROP COLUMN lifetime_payment_intent;
