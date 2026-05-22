/**
 * Progressive Web App Service Worker for Moody.
 * Implements a cache-first strategy for the core application shell to enable offline usage
 * and fast initial loading times.
 */

const CACHE_NAME = "moody-static-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

/**
 * Install Event Handler
 * Pre-caches the application shell assets and immediately activates the new service worker.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate Event Handler
 * Cleans up outdated caches from previous service worker versions and takes control of all clients.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch Event Handler
 * Intercepts GET requests to the origin and serves cached assets if available,
 * otherwise falls back to the network.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
