import { env } from 'cloudflare:workers';

export function recordView(siteId: string): void {
  env.METRICS.writeDataPoint({ indexes: [siteId], blobs: ['view'] });
}
