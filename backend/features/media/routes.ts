import { Hono } from 'hono';
import { POST as uploadMedia } from './controller/upload';

export const routes = new Hono();
routes.post('/upload', (c) => uploadMedia(c.req.raw));
