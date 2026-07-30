// Service worker minimal : met en cache l'app pour un fonctionnement 100% hors-ligne
// une fois installée. À chaque changement de CACHE_NAME, les anciens caches sont
// supprimés et les fichiers sont re-téléchargés une fois (nécessite le PC/Pi allumé
// ce jour-là), puis ça fonctionne à nouveau sans connexion.
const CACHE_NAME = 'budget-familial-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192-v2.png',
  './icon-512-v2.png',
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Met à jour le cache en arrière-plan à chaque visite en ligne
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // hors-ligne : on retombe sur le cache
      return cached || fetchPromise;
    })
  );
});
