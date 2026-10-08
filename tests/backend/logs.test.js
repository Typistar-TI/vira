import { it, expect } from 'vitest';
import { env } from 'cloudflare:workers';
import { flushSecurityAlerts } from '../../backend/features/logs/service/alerts';
import { writeLog } from '../../backend/features/logs/repository/logs';

it('notifies critical security logs and leaves the rest untouched', async () => {
  await writeLog({
    kind: 'security',
    action: 'login_denied',
    severity: 'critical',
    actorType: 'visitor',
    actorId: 'intruder@example.test',
    target: 'admin@example.test',
  });
  await writeLog({
    kind: 'auth',
    action: 'login',
    severity: 'info',
    actorType: 'user',
    actorId: 'someone@example.test',
  });
  await flushSecurityAlerts();
  const rows = (
    await env.DB.prepare('SELECT action, alerted_at FROM logs ORDER BY created_at').all()
  ).results;
  const critical = rows.find((row) => row.action === 'login_denied');
  const info = rows.find((row) => row.action === 'login');
  expect(critical.alerted_at).not.toBeNull();
  expect(info.alerted_at).toBeNull();
});
