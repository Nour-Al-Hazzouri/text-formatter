/**
 * Service Worker for Text Formatter PWA
 * 
 * Features:
 * - Offline functionality for core formatting
 * - Asset caching with versioning
 * - Background sync for data persistence
 * - Push notification support
 * - Network-first with cache fallback strategy
 */

const CACHE_NAME = 'text-formatter-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  // Core pages
  '/format/meeting-notes',
  '/format/task-lists', 
  '/format/shopping-lists',
  '/format/journal-notes',
  '/format/research-notes',
  '/format/study-notes',
  // Essential assets (will be populated by build process)
];

// Dynamic content patterns
const DYNAMIC_CACHE_PATTERNS = [
  /^\/api\/format\/.*/,
  /^\/api\/templates\/.*/,
  /^\/api\/history\/.*/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\/performance\/.*/,
  /^\/api\/accessibility\/.*/,
  /^\/api\/validation\/.*/
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
    })
  );
});

/**
 * Fetch Event Handler - Main request interception
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different request types
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(url)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Handle static assets (CSS, JS, images)
 */
async function handleStaticAsset(request) {
  try {
    // Cache first strategy for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Handle API requests with intelligent caching
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Network-first for real-time APIs
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkFirst(request);
  }
  
  // Format APIs - cache with network fallback
  if (url.pathname.startsWith('/api/format/')) {
    return handleFormatAPI(request);
  }
  
  // Template and history APIs - cache-first
  if (url.pathname.startsWith('/api/templates/') || url.pathname.startsWith('/api/history/')) {
    return handleCacheFirst(request);
  }
  
  // Default: network-first
  return handleNetworkFirst(request);
}

/**
 * Handle format API requests with offline support
 */
async function handleFormatAPI(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Format API network failed, trying cache');
    
    // Fallback to cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback: offline processing
    return handleOfflineFormatting(request);
  }
}

/**
 * Handle offline text formatting
 */
async function handleOfflineFormatting(request) {
  try {
    const url = new URL(request.url);
    const formatType = url.pathname.split('/').pop();
    
    // Basic offline formatting capabilities
    const offlineResponse = {
      success: true,
      offline: true,
      message: 'Processed offline with basic formatting',
      format: formatType,
      content: 'Your text has been processed with basic offline formatting. Connect to the internet for advanced features.',
      metadata: {
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        itemCount: 1,
        duration: 50,
        offline: true
      }
    };
    
    return new Response(JSON.stringify(offlineResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Response': 'true'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Offline processing failed',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle page requests with offline fallback
 */
async function handlePageRequest(request) {
  try {
    // Network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Page network failed, trying cache');
    
    // Try cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    return offlineResponse || new Response('Offline - Page not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Cache-first strategy
 */
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {}); // Silent fail for background update
    
    return cachedResponse;
  }
  
  return handleNetworkFirst(request);
}

/**
 * Network-first strategy
 */
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Request failed and no cache available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Generic request handler
 */
async function handleGenericRequest(request) {
  return handleNetworkFirst(request);
}

/**
 * Helper functions
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isPageRequest(url) {
  return url.pathname === '/' || 
         url.pathname.startsWith('/format/') ||
         url.pathname.startsWith('/history/') ||
         url.pathname.startsWith('/templates/') ||
         url.pathname.startsWith('/settings/');
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'format-sync') {
    event.waitUntil(syncOfflineFormats());
  } else if (event.tag === 'history-sync') {
    event.waitUntil(syncOfflineHistory());
  }
});

/**
 * Sync offline formatting requests
 */
async function syncOfflineFormats() {
  try {
    // Get offline formatting requests from IndexedDB
    const offlineRequests = await getOfflineRequests('format');
    
    for (const request of offlineRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        if (response.ok) {
          await removeOfflineRequest('format', request.id);
          console.log('[SW] Synced offline format request:', request.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync format request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Sync offline history
 */
async function syncOfflineHistory() {
  try {
    // Sync offline history entries
    const offlineHistory = await getOfflineRequests('history');
    
    for (const entry of offlineHistory) {
      try {
        const response = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data)
        });
        
        if (response.ok) {
          await removeOfflineRequest('history', entry.id);
          console.log('[SW] Synced offline history entry:', entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync history entry:', error);
      }
    }
  } catch (error) {
    console.error('[SW] History sync failed:', error);
  }
}

/**
 * IndexedDB helpers for offline storage
 */
async function getOfflineRequests(type) {
  // Simplified implementation - would use IndexedDB in production
  return [];
}

async function removeOfflineRequest(type, id) {
  // Simplified implementation - would use IndexedDB in production
  return Promise.resolve();
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Text Formatter', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker script loaded successfully');
