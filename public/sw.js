const CACHE_NAME = 'rclone-oauth-manager-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/typography.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/api.js',
  '/js/theme.js',
  '/js/sidebar.js',
  '/js/firebase-client.js',
  '/js/oauth.js',
  '/js/credentials.js',
  '/js/configs.js',
  '/js/manager.js',
  '/js/main.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
