import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { cleanExpired, type WorkerEnv } from './jobs/cleanup';
import { deliverQueuedEmails } from './features/emails/controller/delivery';
import { queueEndingReminders } from './jobs/email-reminders';
import { sendMetricsDigest } from './jobs/push-digest';
import { flushSecurityAlerts } from './features/logs/service/alerts';
import { api } from './app';

export default {
  async fetch(request: Request, environment: WorkerEnv, context: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      const response = await api.fetch(request, environment, context);
      if (
        response.status < 400 &&
        ['/api/auth/google', '/api/auth/email/verify', '/api/billing/webhook'].includes(path)
      )
        context.waitUntil(deliverQueuedEmails());
      return response;
    }
    return handle(request, environment, context);
  },
  async scheduled(event: ScheduledEvent, environment: WorkerEnv, context: ExecutionContext) {
    context.waitUntil(
      (async () => {
        await queueEndingReminders();
        await flushSecurityAlerts();
        await deliverQueuedEmails(50);
        if (event.cron === '0 3 * * *') {
          await cleanExpired(environment);
          if (new Date().getUTCDay() === 1) await sendMetricsDigest();
        }
      })(),
    );
  },
};
