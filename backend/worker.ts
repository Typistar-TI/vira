import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { cleanExpired, type WorkerEnv } from './jobs/cleanup';
import { api } from './app';

export default {
  fetch(request: Request, environment: WorkerEnv, context: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith('/api/'))
      return api.fetch(request, environment, context);
    return handle(request, environment, context);
  },
  async scheduled(_event: ScheduledEvent, environment: WorkerEnv, context: ExecutionContext) {
    context.waitUntil(cleanExpired(environment));
  },
};
