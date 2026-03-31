
const CACHE_NAME = 'lofi-start-cache-v1';
const DYNAMIC_CACHE = 'lofi-start-dynamic-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,400&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests for chrome extensions or unsupported schemes
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Don't cache bad responses or basic data types that change often
        if (
          !networkResponse || 
          networkResponse.status !== 200 || 
          networkResponse.type !== 'basic' && !event.request.url.includes('fonts')
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          // Limit dynamic cache size logic could go here
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Optional: Return a custom offline page here if navigation fails
        // For now, if config is local, app still loads from shell
      });
    })
  );
});
