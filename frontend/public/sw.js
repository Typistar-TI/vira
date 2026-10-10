// Keep private pages and tenant subscriptions on the network. No HTML or API data is cached.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'Vira';
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    data: { url: typeof data.url === 'string' && data.url ? data.url : '/app' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title><main style="font:16px system-ui;max-width:36rem;margin:20vh auto;padding:1.5rem"><h1>Sem conexão</h1><p>Conecte-se à internet para abrir esta página.</p><button onclick="location.reload()">Tentar novamente</button></main></html>',
          { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
        ),
    ),
  );
});
