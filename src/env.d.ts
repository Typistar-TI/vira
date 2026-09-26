/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: {
    DB: import('@cloudflare/workers-types').D1Database;
    MEDIA: import('@cloudflare/workers-types').R2Bucket;
    METRICS: import('@cloudflare/workers-types').AnalyticsEngineDataset;
    CONFIG_ENCRYPTION_KEY: string;
  };
}
