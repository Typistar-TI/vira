import { Hono } from 'hono';
import { POST as checkout } from './controller/checkout';
import { POST as billingPortal } from './controller/portal';
import { POST as stripeWebhook } from './controller/webhook';

export const routes = new Hono();
routes.post('/checkout', (c) => checkout(c.req.raw));
routes.post('/portal', (c) => billingPortal(c.req.raw));
routes.post('/webhook', (c) => stripeWebhook(c.req.raw));
