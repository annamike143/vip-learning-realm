// --- Service Worker for VIP Learning Realm ---
const CACHE_NAME = 'vip-learning-realm-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Cache strategies
const CACHE_STRATEGIES = {
  static: ['/_next/static/', '/static/', '/icons/'],
  dynamic: ['/api/', '/course/', '/lesson/'],
  networkFirst: ['/api/chat', '/api/openai-assistant'],
  cacheFirst: ['/images/', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  staleWhileRevalidate: ['/', '/dashboard', '/courses']
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Cache First Strategy (Images, fonts, static assets)
    if (shouldUseCacheFirst(pathname)) {
      return await cacheFirst(request);
    }

    // Network First Strategy (API calls)
    if (shouldUseNetworkFirst(pathname)) {
      return await networkFirst(request);
    }

    // Stale While Revalidate (Pages)
    if (shouldUseStaleWhileRevalidate(pathname)) {
      return await staleWhileRevalidate(request);
    }

    // Default: Network first with cache fallback
    return await networkFirst(request);

  } catch (error) {
    console.error('Service Worker: Request failed', error);
    return await getOfflineFallback(request);
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return await getOfflineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return await getOfflineFallback(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Strategy determination functions
function shouldUseCacheFirst(pathname) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => pathname.includes(pattern));
}

function shouldUseNetworkFirst(pathname) {
  return CACHE_STRATEGIES.networkFirst.some(pattern => pathname.includes(pattern));
}

function shouldUseStaleWhileRevalidate(pathname) {
  return CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pathname === pattern);
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    const offlinePage = await caches.match('/offline');
    return offlinePage || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }

  if (request.destination === 'image') {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Handle offline analytics events
    const offlineEvents = await getOfflineAnalytics();
    if (offlineEvents.length > 0) {
      for (const event of offlineEvents) {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
      await clearOfflineAnalytics();
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline storage
async function getOfflineAnalytics() {
  try {
    const cache = await caches.open('offline-data');
    const response = await cache.match('/offline-analytics');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to get offline analytics:', error);
  }
  return [];
}

async function clearOfflineAnalytics() {
  try {
    const cache = await caches.open('offline-data');
    await cache.delete('/offline-analytics');
  } catch (error) {
    console.error('Failed to clear offline analytics:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-close.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

console.log('Service Worker: VIP Learning Realm SW loaded');
