import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@backend': fileURLToPath(new URL('./backend', import.meta.url)) },
  },
  plugins: [
    cloudflareTest({
      remoteBindings: false,
      miniflare: {
        compatibilityDate: '2026-09-26',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: ['DB'],
        r2Buckets: ['MEDIA'],
        bindings: {
          CONFIG_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          TEST_MIGRATIONS: await readD1Migrations('./backend/migrations'),
        },
      },
    }),
  ],
  test: {
    include: ['tests/backend/**/*.test.js'],
    setupFiles: ['tests/backend/setup.js'],
    testTimeout: 15000,
  },
});
