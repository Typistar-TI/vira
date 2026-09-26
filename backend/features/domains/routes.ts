import { Hono } from 'hono';
import { POST as connectDomain } from './handlers/connect';
import { GET as domainStatus } from './handlers/status';

export const routes = new Hono();
routes.post('/connect', (c) => connectDomain(c.req.raw));
routes.get('/status', (c) => domainStatus(c.req.raw));
