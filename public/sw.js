/* BIYORA SHOP — minimal service worker
 * - App shell cache for offline navigation
 * - Cart lives in localStorage (zustand persist) so it survives offline
 */
const CACHE = "biyora-shell-v1";
const SHELL = ["/", "/shop", "/cart", "/offline", "/biyora-logo.png", "/site.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache API / auth
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok && (request.mode === "navigate" || url.pathname.match(/\.(js|css|png|jpg|webp|svg|woff2?)$/))) {
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const offline = await caches.match("/offline");
          if (offline) return offline;
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      }),
  );
});
