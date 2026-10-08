import { Hono } from 'hono';
import { GET as getSettings } from './controller/settings';
import { POST as updateSettings } from './controller/settings';
import { GET as getPrices } from './controller/prices';
import { POST as updatePrices } from './controller/prices';
import { POST as updateEmailTemplate } from './controller/email-templates';
import { POST as updateProfile } from './controller/profile';
import { POST as updateUser } from './controller/users';

export const routes = new Hono();
routes.get('/settings', (c) => getSettings(c.req.raw));
routes.post('/settings', (c) => updateSettings(c.req.raw));
routes.get('/prices', (c) => getPrices(c.req.raw));
routes.post('/prices', (c) => updatePrices(c.req.raw));
routes.post('/email-templates', (c) => updateEmailTemplate(c.req.raw));
routes.post('/profile', (c) => updateProfile(c.req.raw));
routes.post('/users', (c) => updateUser(c.req.raw));
