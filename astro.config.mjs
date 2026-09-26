import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  vite: { plugins: [tailwindcss()], server: { allowedHosts: ['.vira.ia.br'] }, optimizeDeps: { exclude: ['libphonenumber-js/max'] } },
});
