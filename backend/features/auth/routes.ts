import { Hono } from 'hono';
import { POST as startEmail } from './handlers/start-email';
import { POST as verifyEmail } from './handlers/verify-email';
import { POST as googleLogin } from './handlers/google';
import { POST as logout } from './handlers/logout';

export const routes = new Hono();
routes.post('/email/start', (c) => startEmail(c.req.raw));
routes.post('/email/verify', (c) => verifyEmail(c.req.raw));
routes.post('/google', (c) => googleLogin(c.req.raw));
routes.post('/logout', (c) => logout(c.req.raw));
