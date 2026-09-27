import { defineMiddleware } from 'astro:middleware';
import { getRootDomain } from '@frontend/api/config/root-domain';
import { preferredLanguage } from '@frontend/i18n/preferred-language';

export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.DEV && context.url.pathname.startsWith('/api/')) {
    const { api } = await import('@backend/app');
    return api.fetch(context.request);
  }
  const host = context.url.hostname.toLowerCase();
  const root = (await getRootDomain()).toLowerCase();
  if (
    (host === `www.${root}` || host === `app.${root}`) &&
    (context.request.method === 'GET' || context.request.method === 'HEAD')
  ) {
    const canonical = new URL(context.url);
    canonical.hostname = root;
    return context.redirect(canonical.href, 308);
  }
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
    const englishPath =
      context.url.pathname === '/'
        ? '/en/'
        : context.url.pathname === '/privacidade'
          ? '/en/privacy'
          : null;
    if (platform && englishPath && preferredLanguage(context.request) === 'en') {
      response = context.redirect(englishPath, 302);
      response.headers.set('vary', 'Accept-Language');
    } else {
      response = platform
        ? await next()
        : await context.rewrite(new URL(`/tenant${context.url.pathname}`, context.url));
    }
    if (platform && (context.url.pathname === '/' || context.url.pathname === '/privacidade')) {
      response.headers.set('vary', 'Accept-Language');
    }
  }
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'no-referrer');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('x-frame-options', 'SAMEORIGIN');
  response.headers.set('content-security-policy', "frame-ancestors 'self'");
  if (context.url.protocol === 'https:')
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  if (
    (host === root || host === 'localhost' || host === '127.0.0.1') &&
    (context.url.pathname === '/' ||
      context.url.pathname === '/en' ||
      context.url.pathname === '/en/')
  )
    response.headers.set('cache-control', 'private, no-store');
  if (/^\/(app|admin|api|auth|login)(\/|$)/.test(context.url.pathname))
    response.headers.set('cache-control', 'no-store');
  return response;
});
