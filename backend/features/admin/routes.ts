import { Hono } from 'hono';
import { GET as getSettings } from './handlers/settings';
import { POST as updateSettings } from './handlers/settings';
import { GET as getPrices } from './handlers/prices';
import { POST as updatePrices } from './handlers/prices';
import { POST as updateEmailTemplate } from './handlers/email-templates';

export const routes = new Hono();
routes.get('/settings', (c) => getSettings(c.req.raw));
routes.post('/settings', (c) => updateSettings(c.req.raw));
routes.get('/prices', (c) => getPrices(c.req.raw));
routes.post('/prices', (c) => updatePrices(c.req.raw));
routes.post('/email-templates', (c) => updateEmailTemplate(c.req.raw));
