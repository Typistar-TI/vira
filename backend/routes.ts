import { Hono } from 'hono';
import { rootDomain } from './config';
import { GET as exportAccount } from './api/account/export';
import { POST as deleteAccount } from './api/account/delete';
import { GET as getSettings, POST as updateSettings } from './api/admin/settings';
import { GET as getPrices, POST as updatePrices } from './api/admin/prices';
import { POST as startEmail } from './api/auth/email/start';
import { POST as verifyEmail } from './api/auth/email/verify';
import { POST as googleLogin } from './api/auth/google';
import { POST as logout } from './api/auth/logout';
import { POST as checkout } from './api/billing/checkout';
import { POST as billingPortal } from './api/billing/portal';
import { POST as stripeWebhook } from './api/billing/webhook';
import { POST as connectDomain } from './api/domains/connect';
import { GET as domainStatus } from './api/domains/status';
import { POST as uploadMedia } from './api/media/upload';
import { GET as metrics } from './api/metrics';
import { POST as publishSite } from './api/site/publish';
import { POST as saveSite } from './api/site/save';
import { POST as changeSlug } from './api/site/slug';

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

api.post('/api/auth/email/start', (c) => startEmail(c.req.raw));
api.post('/api/auth/email/verify', (c) => verifyEmail(c.req.raw));
api.post('/api/auth/google', (c) => googleLogin(c.req.raw));
api.post('/api/auth/logout', (c) => logout(c.req.raw));
api.get('/api/account/export', (c) => exportAccount(c.req.raw));
api.post('/api/account/delete', (c) => deleteAccount(c.req.raw));
api.get('/api/admin/settings', (c) => getSettings(c.req.raw));
api.post('/api/admin/settings', (c) => updateSettings(c.req.raw));
api.get('/api/admin/prices', (c) => getPrices(c.req.raw));
api.post('/api/admin/prices', (c) => updatePrices(c.req.raw));
api.post('/api/billing/checkout', (c) => checkout(c.req.raw));
api.post('/api/billing/portal', (c) => billingPortal(c.req.raw));
api.post('/api/billing/webhook', (c) => stripeWebhook(c.req.raw));
api.post('/api/domains/connect', (c) => connectDomain(c.req.raw));
api.get('/api/domains/status', (c) => domainStatus(c.req.raw));
api.post('/api/media/upload', (c) => uploadMedia(c.req.raw));
api.get('/api/metrics', (c) => metrics(c.req.raw));
api.post('/api/site/publish', (c) => publishSite(c.req.raw));
api.post('/api/site/save', (c) => saveSite(c.req.raw));
api.post('/api/site/slug', (c) => changeSlug(c.req.raw));
