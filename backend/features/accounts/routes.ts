import { Hono } from 'hono';
import { GET as exportAccount } from './controller/export';
import { POST as deleteAccount } from './controller/delete';

export const routes = new Hono();
routes.get('/export', (c) => exportAccount(c.req.raw));
routes.post('/delete', (c) => deleteAccount(c.req.raw));
