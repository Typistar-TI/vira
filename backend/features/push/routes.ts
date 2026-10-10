import { Hono } from 'hono';
import { GET as publicKey } from './controller/key';
import { POST as subscribe } from './controller/subscribe';
import { POST as unsubscribe } from './controller/unsubscribe';
import { GET as getPreferences, POST as setPreferences } from './controller/preferences';

export const routes = new Hono();
routes.get('/push/key', (c) => publicKey(c.req.raw));
routes.post('/push/subscribe', (c) => subscribe(c.req.raw));
routes.post('/push/unsubscribe', (c) => unsubscribe(c.req.raw));
routes.get('/push/preferences', (c) => getPreferences(c.req.raw));
routes.post('/push/preferences', (c) => setPreferences(c.req.raw));
