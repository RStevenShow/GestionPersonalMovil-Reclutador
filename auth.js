/* =====================================================
   MARK-NICA RECRUITING AI - CORE AUTH & PWA SERVICES
   Backend: Render (FastAPI) | Database: PostgreSQL
   Feature: Auth, Registration & UI Feedback
===================================================== */
const SUPABASE_URL =
    "https://mrretnaghvkipwggktfp.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycmV0bmFnaHZraXB3Z2drdGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTA0NDgsImV4cCI6MjA5MTc4NjQ0OH0.UF_bhFFP__31GiiTxy2fsaKVqNjGie6H2LdGuAvZmoc";

const supabaseClient = supabase.createClient(
   
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function probarConexionSupabase() {

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {

        console.error(
            "Error conectando Supabase:",
            error.message
        );

        return;
    }

    console.log(
        "Supabase conectado correctamente"
    );

    console.log(data);
}

probarConexionSupabase();
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

        actualizarStatus(
            'cargando',
            'Creando tu cuenta...'
        );

        const nombre =
            document.getElementById('reg-nombre').value;

        const email =
            document.getElementById('reg-email').value;

        const password =
            document.getElementById('reg-password').value;

        try {

            // ===================================
            // REGISTRO EN SUPABASE AUTH
            // ===================================

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            full_name: nombre
                        },

                        emailRedirectTo:
                            "https://gestion-personal-movil-reclutador.vercel.app/Login.html"
                    }
                });

            // ===================================
            // ERROR
            // ===================================

            if (error) {

                ocultarStatus();

                mostrarError(error.message);

                return;
            }

            // ===================================
            // ÉXITO
            // ===================================

            actualizarStatus(
                'exito',
                'Cuenta creada. Revisa tu correo electrónico.'
            );

            setTimeout(() => {

                window.location.href =
                    "Login.html";

            }, 3000);

        } catch (err) {

            ocultarStatus();

            mostrarError(
                "Error conectando con Supabase."
            );
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