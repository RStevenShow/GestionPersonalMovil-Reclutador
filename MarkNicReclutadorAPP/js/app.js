/* =====================================================
   APP.JS - LOGICA GLOBAL DE PWA Y NOTIFICACIONES
   Proyecto: MarkNic AI
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com";
const PUBLIC_VAPID_KEY = "BI_lRYve2woqTrvcOsCfyGGyxIuOEtTYOeze1pYJswGfLZ3qyEJBK2xLf5dqkJoULJe5CTAZAdn6OD84P2ICHAc";

/* --- UTILIDAD: Conversión de llave VAPID --- */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/* --- PUSH: Activar Notificaciones --- */
async function activarNotificaciones() {
  try {
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      alert("Las notificaciones requieren HTTPS");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    // Solicitar permiso explícito al usuario
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Permiso de notificaciones denegado");
      return false;
    }

    // Suscripción al servicio de mensajería del navegador
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    // Envío de suscripción al Backend (FastAPI)
    const res = await fetch(`${API_BASE_URL}/api/save-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(subscription)
    });

    if (!res.ok) throw new Error("Error al guardar en el servidor");

    console.log("Suscripcion Push guardada");
    return true;

  } catch (error) {
    console.error("Error en activarNotificaciones:", error);
    return false;
  }
}

/* --- PUSH: Desactivar Notificaciones --- */
async function desactivarNotificaciones() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      console.log("Suscripcion eliminada");
    }
    return true;
  } catch (err) {
    console.error("Error al desactivar:", err);
    return false;
  }
}

/* --- INICIALIZACION --- */
(function() {
  window.addEventListener("load", async () => {
    
    const toggle = document.getElementById("switchNotificaciones");
    if (!toggle) return;

    // Sincronizar el estado del switch con la suscripción real
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      toggle.checked = !!sub;
    });

    // Manejador del evento change del switch
    toggle.addEventListener("change", async function() {
      if (this.checked) {
        const ok = await activarNotificaciones();
        if (!ok) this.checked = false;
      } else {
        await desactivarNotificaciones();
      }
    });
  });
})();

