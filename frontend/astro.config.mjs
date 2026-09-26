import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  srcDir: './src',
  output: 'server',
  session: false,
  adapter: cloudflare({ imageService: 'compile' }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@frontend': fileURLToPath(new URL('./src/', import.meta.url)),
        '@backend': fileURLToPath(new URL('../backend/', import.meta.url)),
      },
    },
  },
});
