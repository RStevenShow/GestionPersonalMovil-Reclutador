/* =====================================================
   MARK-NICA RECRUITING AI - CORE AUTH & PWA SERVICES
   Backend: Render (FastAPI) | Database: PostgreSQL
   Feature: Auth, Registration & UI Feedback
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com";

// Seleccionamos los formularios
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

// --- 1. GESTIÓN DE LOGIN ---
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        actualizarStatus('cargando', 'Verificando credenciales...');

        // FastAPI OAuth2 usa FormData por defecto
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
                actualizarStatus('exito', '¡Bienvenido de nuevo!');
                setTimeout(() => { window.location.href = "menu.html"; }, 1200);
            } else {
                ocultarStatus();
                mostrarError("Correo o contraseña incorrectos.");
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("Error al conectar. El servidor podría estar iniciando.");
        }
    });
}

// --- 2. GESTIÓN DE REGISTRO ---
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Iniciamos el proceso mostrando el modal de carga
        actualizarStatus('cargando', 'Creando tu perfil en MarkNica...');

        // Capturamos los datos del formulario
        const nombre = document.getElementById('reg-nombre').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Construimos el objeto exacto que pide tu SQLModel (UserCreate)
        const nuevoUsuario = {
            username: email,    // Obligatorio en tu modelo
            email: email,       // Obligatorio
            full_name: nombre,  // Opcional/Heredado
            password: password, // Obligatorio en UserCreate
            role: "reclutador"  // Valor por defecto
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoUsuario)
            });

            if (response.ok) {
                // CAMBIO SOLICITADO: El mismo modal cambia el mensaje y muestra el éxito
                actualizarStatus('exito', '¡Cuenta creada correctamente!');
                
                // Esperamos un momento para que el usuario vea el mensaje de éxito antes de redirigir
                setTimeout(() => { 
                    window.location.href = "Login.html"; 
                }, 2500);
            } else {
                const errorData = await response.json();
                ocultarStatus();
                // Manejamos el error 422 o correos duplicados
                const mensaje = errorData.detail && typeof errorData.detail === 'string' 
                                ? errorData.detail 
                                : "Error en el registro. Verifica los datos.";
                mostrarError(mensaje);
            }
        } catch (err) {
            ocultarStatus();
            mostrarError("Fallo de conexión. Reintenta en unos segundos.");
        }
    });
}

// --- 3. UTILIDADES DE INTERFAZ (UI) ---

function actualizarStatus(estado, mensaje) {
    const container = document.getElementById('status-container');
    const texto = document.getElementById('status-texto');
    const spinner = document.getElementById('status-spinner');
    const check = document.getElementById('status-check');

    if (!container || !texto) return;

    // Mostrar el contenedor de status
    container.classList.remove('d-none');
    texto.innerText = mensaje;

    if (estado === 'exito') {
        // Ocultamos el spinner de carga y mostramos el icono de éxito
        if (spinner) spinner.classList.add('d-none');
        if (check) check.classList.remove('d-none');
    } else {
        // Por defecto mostramos la animación de carga (spinner)
        if (spinner) spinner.classList.remove('d-none');
        if (check) check.classList.add('d-none');
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
        // El error desaparece automáticamente tras 4 segundos
        setTimeout(() => { alerta.classList.add('d-none'); }, 4000);
    } else {
        // Fallback en caso de que no existan los elementos en el HTML
        alert(mensaje);
    }
}