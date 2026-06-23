const CACHE_NAME = 'luz-al-dia-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './src/app.js',
  './src/router.js',
  './src/config/constants.js',
  './src/services/api.js',
  './src/utils/dom.js',
  './src/utils/dates.js',
  './src/utils/format.js',
  './src/utils/electricity.js',
  './src/components/appShell.js',
  './src/components/bottomNav.js',
  './src/components/themeToggle.js',
  './src/components/periodLegend.js',
  './src/components/priceChart.js',
  './src/components/priceTable.js',
  './src/components/kpiGrid.js',
  './src/components/daySelector.js',
  './src/pages/homePage.js',
  './src/pages/weekPage.js',
  './src/pages/monthPage.js',
  './src/pages/searchPage.js',
  './src/pages/statsPage.js',
  './src/pages/notFoundPage.js',
  './src/styles/base.css',
  './src/styles/layout.css',
  './src/styles/components.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/config.generated.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => response.ok ? response : new Response('', { headers: { 'Content-Type': 'application/javascript' } }))
        .catch(() => new Response('', { headers: { 'Content-Type': 'application/javascript' } }))
    );
    return;
  }
  if (url.origin.includes('alon.one')) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
