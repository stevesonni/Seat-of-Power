/* Seat of Power, installed as an app (manifest.webmanifest). Network first,
   so every update arrives at once; the last copy of the game's own files is
   kept for when the phone is offline. Saves are not touched here. */
const CACHE = "sop-shell-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (!/\.(html|js|css|webmanifest)$|\/$/.test(url.pathname)) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || Response.error())));
});
