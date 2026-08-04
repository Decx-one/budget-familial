// Service worker : la page principale (index.html) est TOUJOURS récupérée en priorité
// sur le réseau si une connexion est disponible, pour afficher les mises à jour
// immédiatement. En cas de coupure réseau (mode avion), on retombe sur le cache.
// Les autres fichiers (icônes, manifest) restent en cache-first classique.
const CACHE_NAME = 'budget-familial-v3';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const isPage = event.request.mode === 'navigate' ||
    event.request.destination === 'document';

  if (isPage) {
    // Réseau en priorité pour toujours afficher la dernière version de l'app
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // hors-ligne : on retombe sur le cache
    );
    return;
  }

  // Pour les autres fichiers (icônes, manifest...) : cache d'abord, réseau en secours
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
