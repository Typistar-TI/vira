ALTER TABLE users ADD COLUMN lifetime_payment_intent TEXT;
CREATE INDEX users_lifetime_payment_intent ON users(lifetime_payment_intent);
