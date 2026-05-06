/**
 * =====================================================
 * SW.JS - GESTION DE NOTIFICACIONES PUSH Y CICLO DE VIDA
 * Proyecto: MarkNica Recruiting AI
 * Ubicacion: Raiz del proyecto (/)
 * =====================================================
 */

/**
 * Evento: push
 * Descripcion: Se activa al recibir un mensaje push del servidor.
 * Procesa el payload JSON y muestra la notificacion visual.
 */
self.addEventListener("push", function (event) {
  let payload = {};

  try {
    // Extraccion de datos JSON enviados desde el backend (FastAPI)
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("Error al procesar el payload de la notificacion:", error);
  }

  const title = payload.title || "Notificacion de MarkNica";
  const notificationOptions = {
    body: payload.body || "Usted tiene una nueva actualizacion en su cuenta.",
    icon: "/assets/icon-192.png",
    badge: "/assets/icon-192.png",
    vibrate: [200, 100, 200],
    // Almacenamiento de metadatos para recuperacion posterior en el clic
    data: {
      url: payload.url || "/menu.html"
    },
    // Definicion de acciones rapidas compatibles con dispositivos moviles
    actions: [
      { action: "open", title: "Abrir Aplicacion" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

/**
 * Evento: notificationclick
 * Descripcion: Gestiona la interaccion del usuario con la notificacion.
 * Implementa logica de enfoque de ventana existente para evitar duplicidad de pestañas.
 */
self.addEventListener("notificationclick", function (event) {
  // Cierre inmediato de la notificacion para mejorar la experiencia de usuario
  event.notification.close();

  // Construccion de URL absoluta basada en el origen de la aplicacion
  const targetUrl = new URL(
    event.notification.data.url || "/menu.html",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Intento de localizar una ventana abierta con la misma URL
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      // En caso de no existir ventanas activas, se procede a abrir una nueva instancia
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Evento: install
 * Descripcion: Se ejecuta durante la instalacion del Service Worker.
 * Fuerza la activacion inmediata mediante skipWaiting.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("SISTEMA: Service Worker instalado satisfactoriamente.");
});

/**
 * Evento: activate
 * Descripcion: Se ejecuta tras la instalacion exitosa.
 * Toma el control de todos los clientes de forma inmediata mediante clients.claim.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
  console.log("SISTEMA: Service Worker activado y en control de los clientes.");
});