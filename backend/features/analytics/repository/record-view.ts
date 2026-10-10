import { env } from 'cloudflare:workers';
import { metricContext } from '../service/context';

export async function recordView(siteId: string, request: Request): Promise<void> {
  const context = await metricContext(request);
  env.METRICS.writeDataPoint({
    indexes: [siteId],
    blobs: [
      'view',
      context.path,
      context.referrer,
      context.country,
      context.device,
      context.visitor,
    ],
  });
}
