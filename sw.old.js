// sw.js — минимальный и «непадающий» на 404
const CACHE = 'mamaroute-v3';

self.addEventListener('install', (e) => {
  // Не кешируем ничего заранее, чтобы не падать на отсутствующих файлах
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;              // кешируем только GET
  e.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        // Кешируем «на лету»
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
