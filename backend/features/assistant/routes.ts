import { Hono } from 'hono';
import { GET_HISTORY, POST, POST_SITE } from './handlers/chat';

export const routes = new Hono();
routes.post('/chat', (c) => POST(c.req.raw));

export const publicRoutes = new Hono();
publicRoutes.post('/chat', (c) =>
  POST_SITE(c.req.raw, c.executionCtx.waitUntil.bind(c.executionCtx)),
);
publicRoutes.get('/history', (c) => GET_HISTORY(c.req.raw));
