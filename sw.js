const CACHE_NAME = 'pwa-demo-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache First for app shell, network passthrough for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls (GAS) — let the main page handle caching/offline logic
  if (url.hostname.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Stale-while-revalidate: return cache, update in background
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
          }
          return response.clone();
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request);
    })
  );
});
