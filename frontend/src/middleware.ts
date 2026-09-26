import { defineMiddleware } from 'astro:middleware';
import { rootDomain } from '@backend/config';

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.url.hostname.toLowerCase();
  const root = (await rootDomain()).toLowerCase();
  let response: Response;
  if (context.url.pathname.startsWith('/tenant') || context.url.pathname.startsWith('/media/')) {
    response = await next();
  } else {
    const platform =
      host === root ||
      host === `www.${root}` ||
      host === `app.${root}` ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.workers.dev');
    response = platform
      ? await next()
      : await context.rewrite(new URL(`/tenant${context.url.pathname}`, context.url));
  }
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'no-referrer');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('x-frame-options', 'SAMEORIGIN');
  response.headers.set('content-security-policy', "frame-ancestors 'self'");
  if (context.url.protocol === 'https:')
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  if (/^\/(app|admin|api|auth|login)(\/|$)/.test(context.url.pathname))
    response.headers.set('cache-control', 'no-store');
  return response;
});
