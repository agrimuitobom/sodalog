const CACHE_NAME = "sodalog-v2";
const STATIC_ASSETS = [
  "/dashboard/",
  "/new/",
  "/timeline/",
  "/analysis/",
  "/settings/",
  "/compare/",
  "/plots/",
  "/weather/",
  "/export/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
  "/offline/",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Skip Firebase/API requests
  if (
    request.url.includes("firebaseapp.com") ||
    request.url.includes("googleapis.com") ||
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("firebasestorage.googleapis.com") ||
    request.url.includes("identitytoolkit.googleapis.com") ||
    request.url.includes("open-meteo.com")
  ) {
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline/"))
        )
    );
    return;
  }

  // Static assets (_next chunks have content hashes): network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached))
  );
});
