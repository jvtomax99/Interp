/* Interpreter Hub service worker
 *
 * Purpose: make the app installable and usable when the connection drops
 * (hospital basements, older wings, elevators).
 *
 * CACHING STRATEGY — this matters:
 *
 * The app page itself uses NETWORK-FIRST. A naive cache-first service worker
 * would mean that every time a new index.html is pushed to GitHub, the team
 * keeps seeing the old version indefinitely. Network-first means the newest
 * version always wins when online, and the cached copy is only used when the
 * network genuinely fails.
 *
 * Icons and other static files use CACHE-FIRST, since they rarely change and
 * are re-fetched whenever the cache version below is bumped.
 *
 * Firebase traffic (Firestore, Cloud Storage, gstatic) is never intercepted —
 * it is cross-origin and realtime, and caching it would serve stale glossary
 * data or break the live chat listener.
 */

const CACHE_VERSION = 'interpreter-hub-v1';
const PRECACHE = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // Individual failures shouldn't abort the whole install.
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Tapping a notification should bring the already-open app forward rather
 * than opening a second copy of it. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const section = (event.notification.data && event.notification.data.section) || 'chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'open-section', section });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GETs. Never touch Firestore/Storage writes or realtime streams.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let all cross-origin pass through

  const isDocument = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isDocument) {
    // Network-first: always prefer the freshest deployed version.
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Static assets: cache-first, refreshed in the background.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
