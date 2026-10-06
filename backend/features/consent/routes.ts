import { Hono } from 'hono';
import { POST as create } from './controller/create';

export const routes = new Hono();
routes.post('/', (c) => create(c.req.raw));
