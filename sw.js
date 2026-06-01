const CACHE_NAME = 'lingocat-v45';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './main.js',
  './data/categories_emoji.json',
  './data/botiga_emoji.json',
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
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: servir des de cache, sinó xarxa
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
  );
});