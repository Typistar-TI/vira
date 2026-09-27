// Keep private pages and tenant subscriptions on the network. No HTML or API data is cached.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
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
