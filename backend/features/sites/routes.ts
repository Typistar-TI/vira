import { Hono } from 'hono';
import { POST as publishSite } from './handlers/publish';
import { POST as saveSite } from './handlers/save';
import { POST as changeSlug } from './handlers/slug';

export const routes = new Hono();
routes.post('/publish', (c) => publishSite(c.req.raw));
routes.post('/save', (c) => saveSite(c.req.raw));
routes.post('/slug', (c) => changeSlug(c.req.raw));
