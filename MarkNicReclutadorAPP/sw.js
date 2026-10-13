/* Service Worker de MarkNic: shell offline, recursos locales y notificaciones. */
const CACHE_PREFIX = "marknic-pwa-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v2`;
const CDN_CACHE = `${CACHE_PREFIX}cdn-v1`;
const APP_BASE = new URL("./", self.registration.scope);
const SHELL_FILES = [
  "./",
  "index.html",
  "Login.html",
  "Registro.html",
  "Olvidar.html",
  "reset-password.html",
  "menu.html",
  "vacantes.html",
  "detalle_vacante.html",
  "detalle_candidato.html",
  "agenda.html",
  "sala_entrevista.html",
  "perfil.html",
  "manifest.json",
  "css/app.css",
  "js/pwa.js",
  "js/app.js",
  "js/auth.js",
  "js/vacantes.js",
  "js/perfil.js",
  "js/detalle_vacante.js",
  "logo.png",
  "icons/colored-logo.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/logoLogin.png",
];
const CACHEABLE_CDN_HOSTS = new Set([
  "cdn.jsdelivr.net",
  "cdn-icons-png.flaticon.com",
  "via.placeholder.com",
]);

const appUrl = (path) => new URL(path, APP_BASE).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES.map(appUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, CDN_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(appUrl("index.html")));
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (request.mode === "navigate" && requestUrl.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (["style", "script", "image", "font"].includes(request.destination)) {
    if (requestUrl.origin === self.location.origin) {
      event.respondWith(cacheFirst(request, SHELL_CACHE));
    } else if (CACHEABLE_CDN_HOSTS.has(requestUrl.hostname)) {
      event.respondWith(cacheFirst(request, CDN_CACHE));
    }
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("PWA: no se pudo leer la notificación push.", error);
  }

  const title = payload.title || "Notificación de MarkNic";
  const options = {
    body: payload.body || "Tiene una nueva actualización en su cuenta.",
    icon: appUrl("icons/icon-192.png"),
    badge: appUrl("icons/icon-192.png"),
    vibrate: [200, 100, 200],
    data: { url: payload.url || appUrl("menu.html") },
    actions: [{ action: "open", title: "Abrir aplicación" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || appUrl("menu.html"), APP_BASE);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((client) => client.url === targetUrl.href);
        if (existingClient) return existingClient.focus();
        return self.clients.openWindow ? self.clients.openWindow(targetUrl.href) : undefined;
      }),
  );
});