// Anjo IA — service worker da Fase 0
// SOS e números de emergência abrem sem internet.
const CACHE = "anjo-v1";
const PRECACHE = ["/sos", "/offline", "/brand/anjo.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(PRECACHE);
      // guarda também os scripts e estilos usados pela tela SOS
      try {
        const html = await (await fetch("/sos")).text();
        const assets = [...html.matchAll(/\/_next\/static\/[^"' )]+/g)].map((m) => m[0]);
        await c.addAll([...new Set(assets)]);
      } catch {}
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(async () => {
        const c = await caches.open(CACHE);
        return (url.pathname === "/sos" && (await c.match("/sos"))) || (await c.match("/offline")) || (await c.match("/sos"));
      }),
    );
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })),
    );
  }
});
