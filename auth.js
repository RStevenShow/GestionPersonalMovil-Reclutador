/* =====================================================
   AUTH.JS - CONTROL DE LOGIN Y REGISTRO (CON MODAL PRO)
   Proyecto: MarkNica Recruiting AI
===================================================== */

const API_BASE_URL = "http://127.0.0.1:8000"; 

// --- 1. DETECCIÓN DE FORMULARIOS ---
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

// --- 2. LÓGICA PARA INICIO DE SESIÓN ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Paso 1: Mostrar modal de carga
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
                
                // Paso 2: Mostrar éxito (Check verde)
                actualizarStatus('exito', '¡Bienvenido!');

                setTimeout(() => { 
                    window.location.href = "menu.html"; 
                }, 1500);
            } else {
                // Paso 3: Ocultar modal y mostrar error en el letrerito rojo
                ocultarStatus();
                mostrarError("Correo o contraseña incorrectos.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("Sin conexión con el servidor.");
        }
    });
}

// --- 3. LÓGICA PARA REGISTRO DE USUARIO ---
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Paso 1: Mostrar modal de carga
        actualizarStatus('cargando', 'Guardando cuenta...');

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
                // Paso 2: Mostrar éxito
                actualizarStatus('exito', '¡Registro exitoso!');
                
                setTimeout(() => { 
                    window.location.href = "Login.html"; 
                }, 2000);
            } else {
                const errorData = await response.json();
                ocultarStatus();
                // Si el usuario ya existe, FastAPI manda el mensaje en errorData.detail
                mostrarError(errorData.detail || "Error al registrar.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("Error de red. Intenta más tarde.");
        }
    });
}

/* =====================================================
   FUNCIONES DE CONTROL VISUAL 
===================================================== */

/**
 * (Modal de Estado)
 * @param {string} estado - 'cargando' o 'exito'
 * @param {string} mensaje - El texto que verá el usuario
 */
function actualizarStatus(estado, mensaje) {
    const container = document.getElementById('status-container');
    const texto = document.getElementById('status-texto');
    const spinner = document.getElementById('status-spinner');
    const check = document.getElementById('status-check');

    if (!container) return; // Seguridad por si no existe el HTML

    // Mostrar el contenedor con el fondo borroso
    container.classList.remove('d-none');
    texto.innerText = mensaje;

    if (estado === 'cargando') {
        spinner.classList.remove('d-none');
        check.classList.add('d-none');
    } else if (estado === 'exito') {
        spinner.classList.add('d-none');
        check.classList.remove('d-none');
        // Pequeño efecto de color al texto cuando hay éxito
        texto.classList.add('text-success');
    }
}

/**
 * Esconde la cajita flotante por completo
 */
function ocultarStatus() {
    const container = document.getElementById('status-container');
    if (container) container.classList.add('d-none');
}

/**
 * Muestra el letrerito rojo de error arriba del botón
 */
function mostrarError(mensaje) {
    const alerta = document.getElementById('alerta-error');
    const texto = document.getElementById('mensaje-error-texto');
    if (alerta && texto) {
        texto.innerText = mensaje;
        alerta.classList.remove('d-none');
        
        // Hacer que el error desaparezca solo después de 5 segundos
        setTimeout(() => {
            alerta.classList.add('d-none');
        }, 5000);
    }
}

/**
 * Borra el carnet de socio (Token) y sale al Login
 */
function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = "Login.html";
}