import { Hono } from 'hono';
import { GET } from './controller/showcase';

export const routes = new Hono();
routes.get('/', () => GET());
