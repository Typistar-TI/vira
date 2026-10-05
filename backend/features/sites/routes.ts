import { Hono } from 'hono';
import { POST as publishSite } from './controller/publish';
import { POST as saveSite } from './controller/save';
import { POST as changeSlug } from './controller/slug';

export const routes = new Hono();
routes.post('/publish', (c) => publishSite(c.req.raw));
routes.post('/save', (c) => saveSite(c.req.raw));
routes.post('/slug', (c) => changeSlug(c.req.raw));
