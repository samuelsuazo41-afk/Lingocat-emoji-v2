const CACHE_NAME = 'lingocat-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './main.js',
  './data/biblioteca_emojis.json',
  './data/botiga_emojis.json',
  './data/minijoc_frases.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Instal·lació: cachejar tot
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activació: esborrar caches velles
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serveix des de cache, si no hi és va a xarxa
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});


