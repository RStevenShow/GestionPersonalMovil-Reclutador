/* =====================================================
   AUTH.JS - PROYECTO MARKNICA RECRUITING AI
   CONEXIÓN A PRODUCCIÓN (RENDER)
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com"; 

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

// --- INICIO DE SESIÓN ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        actualizarStatus('cargando', 'Verificando datos...');

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
                actualizarStatus('exito', '¡Bienvenido!');
                setTimeout(() => { window.location.href = "menu.html"; }, 1500);
            } else {
                ocultarStatus();
                mostrarError("Correo o contraseña incorrectos.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("El servidor está despertando. Reintenta en 30 segundos.");
        }
    });
}

// --- REGISTRO ---
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        actualizarStatus('cargando', 'Creando cuenta...');

        const userData = {
            username: document.getElementById('reg-email').value, 
            email: document.getElementById('reg-email').value,
            full_name: document.getElementById('reg-nombre').value,
            password: document.getElementById('reg-password').value,
            role: "reclutador" 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                actualizarStatus('exito', '¡Registro exitoso!');
                setTimeout(() => { window.location.href = "Login.html"; }, 2000);
            } else {
                const errorData = await response.json();
                ocultarStatus();
                mostrarError(errorData.detail || "Error al registrar.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("Error de red. Intenta más tarde.");
        }
    });
}

// --- FUNCIONES VISUALES ---
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
        setTimeout(() => { alerta.classList.add('d-none'); }, 5000);
    }
}