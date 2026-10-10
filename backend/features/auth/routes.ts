import { Hono } from 'hono';
import { POST as startEmail } from './controller/start-email';
import { POST as verifyEmail } from './controller/verify-email';
import { POST as googleLogin } from './controller/google';
import { POST as googleConsent } from './controller/google-consent';
import { POST as logout } from './controller/logout';
import { POST as passwordLogin } from './controller/password';

export const routes = new Hono();
routes.post('/email/start', (c) => startEmail(c.req.raw));
routes.post('/email/verify', (c) => verifyEmail(c.req.raw));
routes.post('/password', (c) => passwordLogin(c.req.raw));
routes.post('/google', (c) => googleLogin(c.req.raw));
routes.post('/google/consent', (c) => googleConsent(c.req.raw));
routes.post('/logout', (c) => logout(c.req.raw));
