// Service worker for the installed app: caches every file the page needs so
// the tracker opens offline, even when `npm start` isn't running. Fetches go
// to the network first so a running server always serves the latest code.

const CACHE = 'tft-tracker-v1';
const FILES = [
  '/',
  '/web/style.css',
  '/web/app.js',
  '/web/manifest.webmanifest',
  '/web/icons/icon-192.png',
  '/web/icons/icon-512.png',
  '/app/session.js',
  '/engine/advisor.js',
  '/engine/constants.js',
  '/engine/economy.js',
  '/engine/odds.js',
  '/engine/rounds.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
