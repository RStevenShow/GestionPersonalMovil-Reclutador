/* =====================================================
   APP.JS - CORE DE HARDWARE Y PWA (MARK-NICA AI)
   Gestión de Notificaciones Push y Service Worker
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com";
// CLAVE VAPID: Asegúrate de que no tenga espacios ni saltos de línea
const PUBLIC_VAPID_KEY = 'BHoEUkzRM2Q1dV--9491i3Z3dBpFpDQL1DkSW6EmyUK7s7NltbaKm89p1up6-vVG87t3TaGvoUzysmut_5wsddk';

// --- 1. REGISTRO DEL SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('[PWA] Service Worker registrado con éxito');
                // Forzamos la actualización si hay un SW nuevo esperando
                if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            })
            .catch(err => console.warn('[PWA] Error en registro de SW:', err));
    });
}

// --- 2. LÓGICA DE NOTIFICACIONES ---

/**
 * Función auxiliar para convertir la llave VAPID de Base64 a un Array de hardware
 * Sin esta conversión, muchos navegadores móviles dan "Push Service Error"
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Orquestador para el Switch en perfil.html
 */
async function gestionarNotificaciones(checkbox) {
    if (checkbox.checked) {
        const exito = await activarNotificaciones();
        if (!exito) {
            checkbox.checked = false; // Revertir visualmente si el hardware falla
        }
    } else {
        console.info("[Push] Notificaciones desactivadas localmente.");
    }
}

/**
 * Proceso de suscripción con el hardware del móvil
 */
async function activarNotificaciones() {
    try {
        // 1. Verificar que el Service Worker esté listo y activo
        const registration = await navigator.serviceWorker.ready;
        
        // 2. Solicitar permiso físico al usuario
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // 3. Convertir llave VAPID para el motor de suscripción
            const convertedKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);

            // 4. Suscribir al servicio de Push del fabricante (Google/Apple)
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            });

            // 5. Sincronizar el "token" obtenido con el Backend en Render
            const response = await fetch(`${API_BASE_URL}/api/save-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                alert('¡Hardware vinculado! MarkNica te notificará en este móvil.');
                return true;
            }
        } else {
            alert('Permiso de notificaciones denegado. Actívalo en los ajustes del sitio.');
        }
        return false;
    } catch (error) {
        // Si sale "Push service error", suele ser porque no estás en HTTPS o usas Incógnito
        console.error('[Hardware Error]', error);
        alert('Error de Hardware: Asegúrate de no estar en modo incógnito y usar HTTPS.');
        return false;
    }
}

// --- 3. EXPORTACIÓN GLOBAL ---
window.gestionarNotificaciones = gestionarNotificaciones;
window.activarNotificaciones = activarNotificaciones;