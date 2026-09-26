import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [location] = process.argv.slice(2);
if (!['--local', '--remote'].includes(location))
  throw new Error('Uso: node scripts/admin.mjs --local|--remote < email');
let email = '';
for await (const chunk of process.stdin) email += chunk;
email = email.trim().toLowerCase();
if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error('Informe um e-mail válido pela entrada padrão');

const escaped = email.replaceAll("'", "''");
const sql = `INSERT INTO admin_accounts (email) VALUES ('${escaped}') ON CONFLICT(email) DO NOTHING;\n`;
const directory = mkdtempSync(join(tmpdir(), 'vira-admin-'));
try {
  const file = join(directory, 'admin.sql');
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
