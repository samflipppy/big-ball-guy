// ============================================================
// Service Worker — Playbook Pro PWA
// Cache-first for static assets, network-first for API calls
// ============================================================

const CACHE_VERSION = 'playbook-pro-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Critical assets to precache during install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
];

// ---- Install ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activate immediately without waiting for old SW to release clients
  self.skipWaiting();
});

// ---- Activate ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('playbook-pro-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all open clients so the new SW controls them immediately
  self.clients.claim();
});

// ---- Fetch ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // API calls & Supabase — network-first strategy
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js data fetches — network-first
  if (url.pathname.startsWith('/_next/data/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (_next/static, images, fonts) — cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot|ico)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML navigation requests — network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else — network-first
  event.respondWith(networkFirst(request));
});

// ---- Listen for skip-waiting messages from the app ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================
// Cache Strategies
// ============================================================

/**
 * Cache-first: Try cache, fall back to network, then cache the response.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first: Try network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Navigation handler: Network-first with offline fallback page.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try to serve cached version of the page
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to offline page
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;

    // Last resort — return a basic offline response
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
