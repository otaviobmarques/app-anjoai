// Anjo IA — service worker da Fase 0
// SOS e números de emergência abrem sem internet.
const CACHE = "anjo-v2";
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

// Avisos da Rede de Cuidado (Web Push). Sem conteúdo de conversa: só quem e o que fazer.
self.addEventListener("push", (e) => {
  let d = { title: "Anjo IA", body: "Você tem um aviso da Rede de Cuidado.", url: "/cuidando", tag: "anjo-alerta" };
  try { d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      tag: d.tag,
      renotify: true,
      requireInteraction: true,
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      data: { url: d.url },
      vibrate: [300, 100, 300, 100, 300],
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/cuidando";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
