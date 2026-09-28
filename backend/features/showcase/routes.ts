import { Hono } from 'hono';
import { publicShowcase } from './service';

export const routes = new Hono();
routes.get('/', async (c) => c.json(await publicShowcase()));
