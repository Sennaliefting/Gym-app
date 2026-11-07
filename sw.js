// Offline-cache. App-bestanden: eerst het netwerk (zodat updates doorkomen), na 2,5 s terugvallen op de cache.
// Voorbeeldfoto's (vaste versie op jsDelivr): eerst de cache, zodat ze na één keer bekijken offline werken.
const CACHE = 'gymlog-v4';
const IMG_CACHE = 'gymlog-img-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('https://cdn.jsdelivr.net/')) {
    e.respondWith(caches.open(IMG_CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') c.put(e.request, r.clone());
      return r;
    }))));
    return;
  }
  const fromCache = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'));
  const net = fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(fromCache);
  const slow = new Promise(res => setTimeout(() => res(null), 2500));
  e.respondWith(Promise.race([net, slow]).then(r => r || caches.match(e.request, { ignoreSearch: true })).then(r => r || net));
});
