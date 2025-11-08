const CACHE='mamaroute-v1';
const ASSETS=[
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './libs/transformers.min.js' // можно удалить строку, если не используешь
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    if(e.request.method==='GET'){ const copy=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,copy)); }
    return r;
  }).catch(()=>c)));
});
