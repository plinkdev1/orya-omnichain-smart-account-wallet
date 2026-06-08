// Service Worker for background sync

const CACHE_NAME = 'orya-v1'
const urlsToCache = [
  '/',
  '/offline.html',
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Continue even if some assets fail to cache
      })
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }).catch(() => {
      // Return offline page if available
      return caches.match('/offline.html')
    })
  )
})

// Background Sync for transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      fetch('/api/transactions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        if (!response.ok) {
          throw new Error('Sync failed')
        }
      }).catch(() => {
        // Retry sync
        event.waitUntil(self.registration.sync.register('sync-transactions'))
      })
    )
  }
})

// Periodic background sync (optional)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-portfolio') {
    event.waitUntil(
      fetch('/api/portfolio/update', { method: 'POST' })
        .catch(() => console.log('Periodic update failed'))
    )
  }
})
