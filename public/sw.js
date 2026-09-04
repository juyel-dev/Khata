// Khata PWA Service Worker — full offline app shell
// প্রথম ভিজিটে পুরো অ্যাপ (সব স্থির পেজ + স্ট্যাটিক ফাইল) ক্যাশে জমিয়ে রাখে,
// যাতে পরে নেট না থাকলেও প্রতিটা পেজ খোলে। লেনদেনের তথ্য Dexie-তে (ফোনে) থাকে।

const CACHE_NAME = 'khata-cache-v2';

// সব স্থির পেজ — প্রথমবারেই ডাউনলোড করে জমিয়ে রাখা হয়।
// ডায়নামিক পেজ (/notebook/[id], /person/[id]) প্রথমবার দেখার পর আপনাআপনি জমে।
const APP_SHELL = [
  '/',
  '/history',
  '/settings',
  '/settings/backup',
  '/settings/archived',
  '/about',
  '/notebook/new',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        // একটা ফাইল ফেল করলে যেন পুরো install বাতিল না হয়
        await Promise.all(
          APP_SHELL.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('Khata SW precache skip:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('Khata SW install error:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// পেজের ভেতরে ভেতরে যাওয়া (Next.js client navigation) শনাক্ত করা
function isRSCRequest(request) {
  return (
    request.headers.has('rsc') ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('next-url')
  );
}

function shouldBypass(url) {
  return (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('whatsapp.com') ||
    url.hostname.includes('whatsapp.net') ||
    url.pathname.startsWith('/api/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // non-GET বা অন্য প্রোটোকল SW ধরবে না
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // ক্লাউড/গুগল/হোয়াটসঅ্যাপ — ক্যাশে হাত দেবে না
  if (shouldBypass(url)) {
    return;
  }

  // 1. পেজ খোলা (HTML navigation): নেট আগে, না পেলে ক্যাশ, তাও না পেলে হোম
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          const rootFallback = await caches.match('/');
          if (rootFallback) {
            return rootFallback;
          }
          return new Response('You are offline. Khata will sync when you reconnect.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 2. Next.js ভেতরের পেজ বদল (RSC payload): নেট আগে, না পেলে ক্যাশ
  if (isRSCRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          throw new Error('offline');
        })
    );
    return;
  }

  // 3. Next.js স্ট্যাটিক ফাইল, ছবি, ফন্ট: ক্যাশ আগে, পেছনে নেট থেকে তাজা করে রাখে
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/_next/image') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff2'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((freshResponse) => {
              if (freshResponse && freshResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, freshResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. বাকি same-origin GET: ক্যাশ আগে, না থাকলে নেট থেকে এনে জমিয়ে রাখে
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. অন্য সাইটের ফাইল: SW ধরবে না (ব্রাউজার নিজে সামলাবে)
});
