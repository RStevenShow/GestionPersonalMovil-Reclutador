/* =====================================================
   MARK-NICA RECRUITING AI - CORE AUTH & PWA SERVICES
   Backend: Render (FastAPI) | Database: PostgreSQL
   Feature: Web Push Notifications (VAPID)
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com"; 


// --- 2. GESTIÓN DE AUTENTICACIÓN ---
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        actualizarStatus('cargando', 'Verificando credenciales...');

        const formData = new FormData();
        formData.append('username', document.getElementById('login-email').value);
        formData.append('password', document.getElementById('login-password').value);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                actualizarStatus('exito', 'Sesión iniciada');
                setTimeout(() => { window.location.href = "menu.html"; }, 1200);
            } else {
                ocultarStatus();
                mostrarError("Credenciales inválidas. Por favor, revisa tus datos.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("El servidor está procesando el encendido (Cold Start). Reintenta en breve.");
        }
    });
}

//

// --- 4. UTILIDADES UI ---
function actualizarStatus(estado, mensaje) {
    const container = document.getElementById('status-container');
    const texto = document.getElementById('status-texto');
    if (!container) return;
    container.classList.remove('d-none');
    texto.innerText = mensaje;
    if (estado === 'exito') {
        document.getElementById('status-spinner').classList.add('d-none');
        document.getElementById('status-check').classList.remove('d-none');
    }
}

function ocultarStatus() {
    const container = document.getElementById('status-container');
    if (container) container.classList.add('d-none');
}

function mostrarError(mensaje) {
    const alerta = document.getElementById('alerta-error');
    const texto = document.getElementById('mensaje-error-texto');
    if (alerta && texto) {
        texto.innerText = mensaje;
        alerta.classList.remove('d-none');
        setTimeout(() => { alerta.classList.add('d-none'); }, 4000);
    }
}
