import { createCipheriv, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const plain = new Set(['ROOT_DOMAIN', 'PUBLIC_TURNSTILE_SITE_KEY', 'CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_ACCOUNT_ID', 'PRIVACY_CONTROLLER_NAME', 'PRIVACY_CONTACT_EMAIL']);
const secrets = new Set(['TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_VERIFY_SERVICE_SID', 'TURNSTILE_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ANALYTICS_TOKEN']);
const [location, key] = process.argv.slice(2);
if (!['--local', '--remote'].includes(location) || !plain.has(key) && !secrets.has(key)) {
  throw new Error('Uso: node scripts/config.mjs --local|--remote NOME < valor');
}
let value = '';
for await (const chunk of process.stdin) value += chunk;
value = value.trim();
if (!value) throw new Error('Envie um valor pela entrada padrão');
if (key === 'ROOT_DOMAIN' && !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(value)) throw new Error('Domínio inválido');
if (key === 'PRIVACY_CONTACT_EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('E-mail inválido');
let encrypted = 0;
if (secrets.has(key)) {
  const raw = Buffer.from(process.env.CONFIG_ENCRYPTION_KEY || '', 'base64');
  if (raw.length !== 32) throw new Error('Defina CONFIG_ENCRYPTION_KEY como 32 bytes em base64 no ambiente do terminal');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', raw, iv);
  value = Buffer.concat([iv, cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()]).toString('base64');
  encrypted = 1;
}
const escapeSql = text => text.replaceAll("'", "''");
const sql = `UPDATE app_settings SET value = '${escapeSql(value)}', encrypted = ${encrypted}, updated_at = unixepoch() WHERE key = '${key}';\n`;
const directory = mkdtempSync(join(tmpdir(), 'vira-config-'));
try {
  const file = join(directory, 'update.sql');
  writeFileSync(file, sql, { mode: 0o600 });
  const result = spawnSync(join(process.cwd(), 'node_modules/.bin/wrangler'), ['d1', 'execute', 'vira', location, '--file', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
