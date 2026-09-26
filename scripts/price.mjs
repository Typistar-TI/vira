import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [location, plan, currency, amountText, priceId] = process.argv.slice(2);
const amount = Number(amountText);
if (
  !['--local', '--remote'].includes(location) ||
  !['monthly', 'yearly', 'lifetime'].includes(plan) ||
  !['brl', 'usd'].includes(currency) ||
  !Number.isSafeInteger(amount) ||
  amount <= 0 ||
  !/^price_[a-zA-Z0-9]+$/.test(priceId || '')
) {
  throw new Error(
    'Uso: node scripts/price.mjs --local|--remote monthly|yearly|lifetime brl|usd CENTAVOS price_ID',
  );
}
const sql = `INSERT INTO stripe_price_catalog (stripe_price_id, plan, currency, amount_minor) VALUES ('${priceId}', '${plan}', '${currency}', ${amount}) ON CONFLICT(stripe_price_id) DO UPDATE SET plan = excluded.plan, currency = excluded.currency, amount_minor = excluded.amount_minor;\nUPDATE plan_prices SET amount_minor = ${amount}, stripe_price_id = '${priceId}', active = 1, updated_at = unixepoch() WHERE plan = '${plan}' AND currency = '${currency}';\n`;
const directory = mkdtempSync(join(tmpdir(), 'vira-price-'));
try {
  const file = join(directory, 'update.sql');
  writeFileSync(file, sql, { mode: 0o600 });
  const result = spawnSync(
    join(process.cwd(), 'node_modules/.bin/wrangler'),
    ['d1', 'execute', 'vira', location, '--file', file],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
