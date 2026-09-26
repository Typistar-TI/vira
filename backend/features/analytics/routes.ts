import { Hono } from 'hono';
import { GET as metrics } from './handlers/metrics';

export const routes = new Hono();
routes.get('/metrics', (c) => metrics(c.req.raw));
