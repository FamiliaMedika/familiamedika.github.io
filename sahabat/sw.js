const CACHE_NAME = 'sahabat-familia-shell-v3';
const SHELL_ASSETS = [
  '/sahabat/',
  '/sahabat/index.html',
  '/sahabat/styles.css',
  '/sahabat/app.js',
  '/sahabat/config.js',
  '/sahabat/auth-feedback.js',
  '/sahabat/manifest.webmanifest',
  '/sahabat/app-icon.svg',
  '/assets/logo.png',
  '/assets/logo-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Clinical/account data is never cached. Supabase requests are cross-origin and
  // intentionally remain network-only.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/sahabat/', copy));
          return response;
        })
        .catch(() => caches.match('/sahabat/'))
    );
    return;
  }

  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});
