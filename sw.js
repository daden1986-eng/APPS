// Nama cache
const CACHE_NAME = 'sirekap-dgn-cache-v3'; // Version bump for new assets and logic

// Daftar file yang akan di-cache
const urlsToCache = [
  '/',
  '/index.php', // Main entry point
  '/index.tsx',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/vite.svg'
];

// Event 'install': dipanggil saat service worker pertama kali diinstal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache dibuka');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'fetch': dipanggil setiap kali aplikasi membuat permintaan jaringan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika permintaan ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }

        // Jika tidak, lakukan permintaan jaringan, dan cache hasilnya
        return fetch(event.request).then(
          (response) => {
            // Periksa apakah kita menerima respons yang valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Penting: Kloning respons. Respons adalah Stream dan hanya bisa dikonsumsi sekali.
            // Kita perlu satu untuk browser dan satu lagi untuk dimasukkan ke cache.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Event 'activate': dipanggil saat service worker diaktifkan
// Berguna untuk membersihkan cache lama
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});