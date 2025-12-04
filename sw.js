// Enhanced Service Worker for MomoFit PWA
// Version: 6.0 - Comprehensive caching for instant loads

const VERSION = 'v16'; // Bump this version to force update
const CACHE_NAME = `momofit-static-v${VERSION}`;
const DYNAMIC_CACHE = `momofit-dynamic-v${VERSION}`;
const ASSETS_CACHE = `momofit-assets-v${VERSION}`;
const RUNTIME_CACHE = `momofit-runtime-v${VERSION}`;

// Core Assets (Precached on install for instant loading)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/splash.png',
  '/icon-192.png',
  '/icon-512.png'
];

// CDN Domains to cache aggressively
const CDN_DOMAINS = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'cdn-icons-png.flaticon.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Cache duration settings
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  DYNAMIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  RUNTIME: 24 * 60 * 60 * 1000 // 1 day
};

// ============================================
// 1. INSTALL: Aggressive Precaching
// ============================================
self.addEventListener('install', (event) => {
  console.log(`[SW v${VERSION}] Installing...`);

  event.waitUntil(
    (async () => {
      try {
        // Open cache and precache core assets
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Precaching core assets for instant loading...');

        // Add core assets
        await cache.addAll(PRECACHE_ASSETS);

        // Try to precache built assets if available
        try {
          const assetManifest = await fetch('/dist/manifest.json').then(r => r.json()).catch(() => null);
          if (assetManifest) {
            const builtAssets = Object.values(assetManifest).filter(path =>
              typeof path === 'string' && /\.(js|css)$/.test(path)
            );
            if (builtAssets.length > 0) {
              console.log('[SW] Precaching built assets:', builtAssets);
              await cache.addAll(builtAssets.map(path => `/${path}`));
            }
          }
        } catch (e) {
          console.log('[SW] No build manifest found, skipping built assets precache');
        }

        console.log('[SW] Precaching complete!');
      } catch (error) {
        console.error('[SW] Precaching failed:', error);
      }
    })()
  );

  // Don't auto-activate - wait for user to trigger update
  console.log('[SW] Installed, waiting for activation...');
});

// ============================================
// 2. ACTIVATE: Cleanup Old Caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log(`[SW v${VERSION}] Activating...`);

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, DYNAMIC_CACHE, ASSETS_CACHE, RUNTIME_CACHE];

      await Promise.all(
        cacheNames.map(cacheName => {
          if (!validCaches.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      // Take control of all clients immediately
      await self.clients.claim();

      console.log('[SW] Activation complete, controlling all clients');
    })()
  );
});

// ============================================
// 3. FETCH: Smart Caching Strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // A. Bypass API requests (always go to network)
  if (url.pathname.includes('/api') || url.hostname.includes('moonshot.cn')) {
    return;
  }

  // B. Navigation Requests: Cache First with Network Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try cache first for instant loading
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) {
            // Update cache in background
            event.waitUntil(
              fetch(request)
                .then(response => {
                  if (response && response.status === 200) {
                    return caches.open(CACHE_NAME).then(cache => {
                      cache.put('/index.html', response.clone());
                    });
                  }
                })
                .catch(() => {})
            );
            return cachedResponse;
          }

          // No cache, fetch from network
          const response = await fetch(request);
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', response.clone());
          }
          return response;
        } catch (error) {
          // Network failed, try to return cached index.html
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) return cachedResponse;
          throw error;
        }
      })()
    );
    return;
  }

  // C. Static Assets (JS/CSS/Images): Cache First with Background Update
  if (url.origin === self.location.origin &&
      /\.(js|jsx|ts|tsx|css|png|jpg|jpeg|svg|ico|webp|woff2?|ttf|eot)$/i.test(url.pathname)) {

    event.respondWith(
      (async () => {
        // Check all caches for the asset
        const cachedResponse = await caches.match(request);

        // Background update function
        const updateCache = async () => {
          try {
            const response = await fetch(request);
            if (response && response.status === 200 && response.type === 'basic') {
              const cache = await caches.open(ASSETS_CACHE);
              await cache.put(request, response.clone());
            }
          } catch (error) {
            console.log('[SW] Background update failed for:', url.pathname);
          }
        };

        if (cachedResponse) {
          // Return cached version immediately, update in background
          event.waitUntil(updateCache());
          return cachedResponse;
        }

        // No cache, fetch and cache
        try {
          const response = await fetch(request);
          if (response && response.status === 200 && response.type === 'basic') {
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          console.error('[SW] Failed to fetch asset:', url.pathname);
          throw error;
        }
      })()
    );
    return;
  }

  // D. CDN Resources: Cache First, Long-term Storage
  if (CDN_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const response = await fetch(request);
          if (response && response.status === 200 &&
              (response.type === 'basic' || response.type === 'cors')) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          console.error('[SW] CDN fetch failed:', url.href);
          throw error;
        }
      })()
    );
    return;
  }

  // E. Runtime Caching: Network First with Cache Fallback
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response && response.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
      }
    })()
  );
});

// ============================================
// 4. MESSAGE: Handle Update Commands
// ============================================
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      console.log('[SW] Received SKIP_WAITING command');
      self.skipWaiting();
      break;

    case 'CLIENTS_CLAIM':
      console.log('[SW] Received CLIENTS_CLAIM command');
      self.clients.claim();
      break;

    case 'CACHE_STATS':
      // Return cache statistics
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          const stats = {};

          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            stats[name] = keys.length;
          }

          // Send stats back to client
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_STATS_RESPONSE',
              stats
            });
          });
        })()
      );
      break;

    case 'CLEAR_CACHE':
      // Clear all caches (useful for debugging)
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('[SW] All caches cleared');
        })()
      );
      break;
  }
});

// ============================================
// 5. PUSH NOTIFICATIONS (Future Enhancement)
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  // Future: Handle push notifications
});

console.log(`[SW v${VERSION}] Script loaded and ready`);
