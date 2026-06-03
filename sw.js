const CACHE_NAME = 'lingocat-v232'; 
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
  './data/minijoc_determinants.json',
  './data/banco_lectura.json',
  './data/tips.json'
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

// Fetch: cache first per JSON, network first per HTML/JS/CSS
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // JSON de dades: cache first
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request)
        .then(resp => resp || fetch(event.request))
    );
    return;
  }

  // Resto: network first
  event.respondWith(
    fetch(event.request)
      .then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, res.clone());
          return res;
        });
      })
      .catch(() => caches.match('./index.html'))
  );
});  