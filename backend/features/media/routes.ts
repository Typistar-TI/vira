import { Hono } from 'hono';
import { POST as uploadMedia } from './handlers/upload';

export const routes = new Hono();
routes.post('/upload', (c) => uploadMedia(c.req.raw));
