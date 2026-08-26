const CACHE = 'gestao-segura-v9-dashboard-inventory';
const ASSETS = [
  './','./index.html','./styles.css','./enhancements.css','./admin-users.css','./workforce-controls.css',
  './app.js','./app-enhancements.js','./epi-enhancements.js','./epi-signature.js','./admin-users.js','./workforce-controls.js',
  './config.js','./manifest.webmanifest'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))]))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
