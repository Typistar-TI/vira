import { Hono } from 'hono';
import { rootDomain } from '@backend/platform/config';
import { routes as authRoutes } from './features/auth/routes';
import { routes as accountsRoutes } from './features/accounts/routes';
import { routes as adminRoutes } from './features/admin/routes';
import { routes as billingRoutes } from './features/billing/routes';
import { routes as domainsRoutes } from './features/domains/routes';
import { routes as mediaRoutes } from './features/media/routes';
import { routes as analyticsRoutes } from './features/analytics/routes';
import { routes as sitesRoutes } from './features/sites/routes';

export const api = new Hono();

api.use('*', async (c, next) => {
  const host = new URL(c.req.url).hostname.toLowerCase();
  const root = (await rootDomain()).toLowerCase();
  const platform =
    host === root ||
    host === `www.${root}` ||
    host === `app.${root}` ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.workers.dev');
  if (!platform) return c.notFound();
  await next();
  c.header('cache-control', 'no-store');
  c.header('x-content-type-options', 'nosniff');
  c.header('referrer-policy', 'no-referrer');
  c.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  c.header('x-frame-options', 'SAMEORIGIN');
  c.header('content-security-policy', "frame-ancestors 'self'");
  if (c.req.url.startsWith('https:'))
    c.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
});

api.onError(() => new Response('Internal Server Error', { status: 500 }));

api.route('/api/auth', authRoutes);
api.route('/api/account', accountsRoutes);
api.route('/api/admin', adminRoutes);
api.route('/api/billing', billingRoutes);
api.route('/api/domains', domainsRoutes);
api.route('/api/media', mediaRoutes);
api.route('/api', analyticsRoutes);
api.route('/api/site', sitesRoutes);
