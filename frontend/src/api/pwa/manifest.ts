import type { APIRoute } from 'astro';
import { tenantForHost } from '@frontend/api/domains/resolve-tenant';
import { userHasAccess } from '@frontend/api/sites/has-access';
import { parseSiteContent } from '@frontend/api/sites/parse-site';

function manifestResponse(manifest: Record<string, unknown>): Response {
  return new Response(JSON.stringify(manifest), {
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'public, max-age=60, must-revalidate',
      'x-content-type-options': 'nosniff',
    },
  });
}

const viraIcons = [
  { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
];

export const platformManifest: APIRoute = () =>
  manifestResponse({
    id: '/',
    name: 'Vira',
    short_name: 'Vira',
    description: 'Crie e publique sua página com o Vira.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: viraIcons,
  });

export const dashboardManifest: APIRoute = () =>
  manifestResponse({
    id: '/app/',
    name: 'Vira · Seu espaço',
    short_name: 'Vira',
    start_url: '/app/',
    scope: '/app/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: viraIcons,
  });

export const adminManifest: APIRoute = () =>
  manifestResponse({
    id: '/admin/',
    name: 'Vira · Administração',
    short_name: 'Vira Admin',
    start_url: '/admin/',
    scope: '/admin/',
    display: 'standalone',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: viraIcons,
  });

export const tenantManifest: APIRoute = async ({ url }) => {
  const tenant = await tenantForHost(url.hostname);
  if (!tenant || !userHasAccess(tenant.user) || !tenant.site.published_json)
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  const content = parseSiteContent(JSON.parse(tenant.site.published_json));
  const name = content.appName || content.title;
  const hero = content.sections.find((section) => section.type === 'hero');
  const description = hero && hero.type === 'hero' ? hero.subtitle : '';
  return manifestResponse({
    id: '/',
    name,
    short_name: name.slice(0, 32),
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: content.themeColor,
    background_color: content.backgroundColor,
    icons: [
      { src: content.pwaIcon192 || '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: content.pwaIcon512 || '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
};
