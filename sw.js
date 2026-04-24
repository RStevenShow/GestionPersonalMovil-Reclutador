/* =====================================================
   SW.JS - SERVICE WORKER DE NOTIFICACIONES (MarkNica AI)
   Este archivo debe estar en la RAÍZ de tu proyecto.
===================================================== */

// 1. EVENTO: RECEPCIÓN DE NOTIFICACIÓN PUSH
// Este evento se dispara cuando el servidor de Google/Apple envía el mensaje
self.addEventListener("push", function (event) {
  let payload = {};

  try {
    // Intentamos extraer el JSON enviado por FastAPI
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn("Recibido push sin JSON válido, usando valores por defecto.");
  }

  // Configuración de la apariencia de la notificación
  const title = payload.title || "Nueva actualización en MarkNica";
  const options = {
    body: payload.body || "Tienes novedades en tu cuenta de reclutador.",
    icon: "/assets/icon-192.png", // Icono de la notificación
    badge: "/assets/icon-192.png", // Icono pequeño para la barra de estado
    vibrate: [200, 100, 200], // Patrón de vibración en móviles

    // Datos adicionales para usar cuando el usuario haga clic
    data: {
      url: payload.url || "/vacantes.html",
    },

    // Botones de acción rápida dentro de la notificación
    actions: [
      { action: "open", title: "Ver ahora" },
      { action: "close", title: "Cerrar" },
    ],
  };

  // waitUntil asegura que el Service Worker no se "duerma" antes de mostrar la notificación
  event.waitUntil(self.registration.showNotification(title, options));
});

/* =====================================================
   2. EVENTO: CLIC EN LA NOTIFICACIÓN
   Define qué pasa cuando el usuario toca la notificación
===================================================== */
/*self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/agenda.html";

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});*/


self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = new URL(
    event.notification.data?.url || "/agenda.html",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {

      // Buscar si hay una pestaña abierta
      for (let client of clientsArr) {
        if ("focus" in client) {
          return client.focus(); // 
        }
      }

      //  Si no hay pestañas → abrir nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
/* =====================================================
   3. EVENTO: INSTALACIÓN Y ACTIVACIÓN
   Ayuda a que el SW tome el control de la página de inmediato
===================================================== */
self.addEventListener("install", (event) => {
  // Forzamos al SW a convertirse en el SW activo
  self.skipWaiting();
  console.log("Service Worker Instalado");
});

self.addEventListener("activate", (event) => {
  // Tomamos el control de todas las pestañas abiertas inmediatamente
  event.waitUntil(clients.claim());
  console.log("Service Worker Activado y listo para recibir Push");
});
