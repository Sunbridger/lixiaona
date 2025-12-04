
const CACHE_NAME = 'momofit-static-v5';
const DYNAMIC_CACHE = 'momofit-dynamic-v5';
const ASSETS_CACHE = 'momofit-assets-v5';

// Core Assets (Precached on install)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// CDN Domains to cache
const CDN_DOMAINS = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'cdn-icons-png.flaticon.com'
];

// 1. Install: Precache App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching App Shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Do NOT skipWaiting automatically. Wait for user interaction.
});

// 2. Activate: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && key !== ASSETS_CACHE) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch: Intercept Requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Bypass API requests
  if (url.pathname.includes('/api') || url.hostname.includes('moonshot.cn')) {
    return;
  }

  // B. Local Bundled Assets (JS/CSS/IMG): Stale-While-Revalidate
  // This strategy returns the cached version immediately (fast), 
  // then updates the cache in the background (fresh next time).
  if (url.origin === self.location.origin && /\.(js|css|png|jpg|jpeg|svg|ico|json|tsx|ts|jsx)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        
        // Define the background update promise
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(ASSETS_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        }).catch((err) => {
          // Network failed, nothing to do (fallback to cache if available)
          console.log('[SW] Background fetch failed for asset', event.request.url);
        });

        // If we have a cached response, return it AND schedule the update
        if (cachedResponse) {
          event.waitUntil(fetchPromise); // Keep SW alive for the update
          return cachedResponse;
        }

        // If no cache, return the network promise directly
        return fetchPromise;
      })
    );
    return;
  }

  // C. CDN Libraries: Cache First -> Fallback to Network
  if (CDN_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((response) => {
          // Cache only successful GET requests
          if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
             const clone = response.clone();
             caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // D. Navigation (HTML): Stale-While-Revalidate for offline support
  if (event.request.mode === 'navigate') {
     event.respondWith(
        caches.match('/index.html').then((cachedResponse) => {
           const fetchPromise = fetch(event.request).then((networkResponse) => {
              if(networkResponse && networkResponse.status === 200) {
                 const clone = networkResponse.clone();
                 caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
              }
              return networkResponse;
           }).catch(() => {});
           
           if (cachedResponse) {
             event.waitUntil(fetchPromise);
             return cachedResponse;
           }
           return fetchPromise;
        })
     );
     return;
  }
  
  // E. Default: Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 4. Message: Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
