const CACHE_NAME = 'guio-pro-v5';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './manifest.json',
  './data/loaderjson.js',
  './core/generadorlilibre.js',
  './data/banco_ecenes.json',
  './data/banco_emocions.json',
  './data/banco_escenarios.json',
  './data/banco_estructura.json',
  './data/banco_generes.json',
  './data/banco_lectura.json',
  './data/banco_olors.json',
  './data/banco_personatges.json',
  './data/banco_sons.json',
  './data/banco_ubicacions.json',
  './data/determinants.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// Instal·lació: cachejar i activar immediatament
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activació: esborrar caches velles i prendre control
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

// Fetch: estratègia intel·ligent
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // JSON de /data: cache first, perquè han de funcionar offline
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
    return;
  }

  // HTML/JS/CSS: network first, per agafar sempre la última versió
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