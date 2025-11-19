// Service Worker with Cache Versioning and Update Handling
// Increment CACHE_VERSION whenever you deploy changes
const CACHE_VERSION = 'v3'; // Change this when deploying updates
const CACHE_NAME = `dumps-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = 'dumps-runtime';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker, cache version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
          console.warn('[SW] Some assets failed to cache:', err);
          // Continue even if some assets fail
        });
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker, cache version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName.startsWith('dumps-cache-') && cacheName !== CACHE_NAME) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
            // Also clean up runtime cache on version change
            if (cacheName === RUNTIME_CACHE) {
              console.log(`[SW] Clearing runtime cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets (JS, CSS, images) - Cache first, fallback to network
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - Network first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: try cache, then network
  event.respondWith(cacheFirstStrategy(request));
});

// Cache First Strategy - good for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    // Return a fallback response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First Strategy - good for API and HTML
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's an HTML request and cache fails, return index.html for SPA routing
    if (request.headers.get('accept')?.includes('text/html')) {
      const indexCache = await caches.match('/index.html');
      if (indexCache) {
        return indexCache;
      }
    }
    
    throw error;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
