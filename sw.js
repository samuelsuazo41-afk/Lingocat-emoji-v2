// sw.js v88 - Cat Lingo Emoji
// Canvis v88: + data/temes.json (90 temes) + CACHE_NAME pujat a v88 per forçar neteja
const CACHE_NAME = 'lingocat-v88';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './data/biblioteca_emoji.json',
  './data/categories_emoji.json',
  './data/botiga_emoji.json',
  './data/minijoc_frases.json',
  './data/banco_lectura.json',
  './data/tips.json',
  './data/temes.json'
];

// Instal·lació: cachejar només lo que existeix
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

// Fetch: cache first + actualitzar en segon pla per JSON, network first per HTML/JS/CSS
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Només GET, la resta passa directe
  if (event.request.method !== 'GET') return;

  // JSON de dades: cache first + revalidar en segon pla (per temes.json nou)
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Resto: network first, fallback a cache / index.html
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Només cachegem respostes vàlides i mateix origen
        if (res && res.ok && url.origin === self.location.origin) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, res.clone());
            return res;
          });
        }
        return res;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});