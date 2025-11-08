const CACHE='mamaroute-v1';
const ASSETS=['./','./index.html','./app.v4.js','./libs/transformers.min.js','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;e.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(res=>{if(r.method==='GET'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res}).catch(()=>cached)))});
