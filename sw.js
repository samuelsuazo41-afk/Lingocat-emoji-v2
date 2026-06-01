const CACHE_NAME = 'lingocat-v65';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './main.js',
  './sw.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/categories_emoji.json',
  './data/botiga_emoji.json',
  './data/minijoc_frases.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando v50...');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache vieja:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: sirve desde cache primero, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(res => {
        // Guarda en cache para próxima vez
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, res.clone());
          return res;
        });
      });
    }).catch(() => {
      // Si falla todo, devuelve index.html para PWA
      return caches.match('./index.html');
    })
  );
});