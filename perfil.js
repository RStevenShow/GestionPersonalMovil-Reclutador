/* =====================================================
   PERFIL.JS - VERSIÓN ENFOCADA A MÓVIL (ESTÉTICA PRO)
   Proyecto: MarkNica AI
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com";
const token = localStorage.getItem('token');

// Variables de estado
let idVacanteParaBorrar = null;
let campoActual = ''; 

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = "Login.html";
        return;
    }

    cargarDatosUsuario();
    cargarMisVacantes();
    configurarEventos();
});

// 2. CONFIGURACIÓN DE EVENTOS (MODALES)
function configurarEventos() {
    // --- Modal: Eliminar Vacante ---
    const btnCancelVacante = document.getElementById('confirm-cancel');
    const btnAcceptVacante = document.getElementById('confirm-accept');

    if (btnCancelVacante) {
        btnCancelVacante.addEventListener('click', () => {
            document.getElementById('confirm-container').classList.add('d-none');
            idVacanteParaBorrar = null;
        });
    }
    if (btnAcceptVacante) {
        btnAcceptVacante.addEventListener('click', ejecutarEliminacion);
    }

    // --- Modal: Eliminar Cuenta ---
    const btnCancelBaja = document.getElementById('baja-cancel');
    const btnAcceptBaja = document.getElementById('baja-accept');

    if (btnCancelBaja) {
        btnCancelBaja.addEventListener('click', () => {
            document.getElementById('confirm-baja-container').classList.add('d-none');
        });
    }
    if (btnAcceptBaja) {
        btnAcceptBaja.addEventListener('click', ejecutarBajaCuenta);
    }

    // --- Evento: Subir foto ---
    const inputFoto = document.getElementById('subir-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', subirFotoPerfil);
    }
}

// 3. CARGAR DATOS DEL RECLUTADOR
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById('perfil-nombre').innerHTML = `${user.full_name || user.username} <i class="bi bi-pencil-square small opacity-50 ms-1"></i>`;
            document.getElementById('perfil-email').innerText = user.email;
            
            if (user.photo_url) {
                const finalUrl = user.photo_url.startsWith('http') 
                    ? user.photo_url 
                    : `${API_BASE_URL}${user.photo_url}`;
                document.getElementById('img-perfil').src = finalUrl + "?t=" + new Date().getTime();
            }
        }
    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }
}

// 4. LÓGICA DE EDICIÓN "BOTTOM SHEET" (ESTILO MÓVIL)
function abrirEditor(campo) {
    campoActual = campo;
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');
    const titulo = document.getElementById('sheet-titulo');
    const input = document.getElementById('input-nuevo-valor');
    const label = document.getElementById('label-input');

    if (!sheet || !overlay) return;

    input.value = "";
    overlay.classList.remove('d-none');

    if (campo === 'password') {
        titulo.innerText = "Cambiar Contraseña";
        label.innerText = "Ingresa tu nueva clave";
        input.type = "password";
        input.placeholder = "********";
    } else if (campo === 'nombre') {
        titulo.innerText = "Editar Nombre";
        label.innerText = "Nombre Completo";
        input.type = "text";
        input.placeholder = "Ej: Ana García";
    }

    setTimeout(() => sheet.classList.add('active'), 10);
}

function cerrarSheet() {
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');
    
    if (sheet) sheet.classList.remove('active');
    setTimeout(() => {
        if (overlay) overlay.classList.add('d-none');
    }, 400); // Tiempo de la animación de bajada
}

async function guardarCambioSheet() {
    const nuevoValor = document.getElementById('input-nuevo-valor').value;
    if (!nuevoValor) return;

    cerrarSheet();
    mostrarStatusPro('cargando', 'Actualizando perfil...');

    try {
        const currentEmail = document.getElementById('perfil-email').innerText;
        // Limpiamos el HTML del nombre por si trae el icono del lapicito
        const currentName = document.getElementById('perfil-nombre').innerText.trim();
        
        const updateData = {
            username: currentEmail, 
            email: currentEmail,
            full_name: currentName,
            password: "" 
        };

        if (campoActual === 'password') updateData.password = nuevoValor;
        if (campoActual === 'nombre') updateData.full_name = nuevoValor;

        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            mostrarStatusPro('exito', '¡Datos Actualizados!');
            setTimeout(() => {
                ocultarStatusPro();
                cargarDatosUsuario();
            }, 1200);
        } else {
            ocultarStatusPro();
            alert("Error al actualizar. Intenta de nuevo.");
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Sin conexión con el servidor.");
    }
}

// 5. GESTIÓN DE MIS VACANTES
async function cargarMisVacantes() {
    const contenedor = document.getElementById('lista-mis-vacantes');
    const badge = document.getElementById('badge-vacantes');

    try {
        const response = await fetch(`${API_BASE_URL}/offers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const vacantes = await response.json();
            if (badge) badge.innerText = vacantes.length;

            if (vacantes.length === 0) {
                contenedor.innerHTML = `<p class="text-center small text-muted py-3 bg-white rounded-4 shadow-sm">No tienes vacantes activas.</p>`;
                return;
            }

            contenedor.innerHTML = vacantes.map(v => `
                <div class="mini-card-vacante border-0 mb-2" id="card-${v.id}">
                    <div>
                        <h6 class="fw-bold mb-0 text-dark">${v.title}</h6>
                        <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${v.location || 'Nicaragua'}</small>
                    </div>
                    <button class="btn-borrar-mini shadow-sm" onclick="prepararEliminacion(${v.id})">
                        <i class="bi bi-trash-fill fs-5"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        if (contenedor) contenedor.innerHTML = `<p class="text-danger small text-center">Error al conectar.</p>`;
    }
}

// --- Eliminar Vacante ---
function prepararEliminacion(id) {
    idVacanteParaBorrar = id;
    const confirmContainer = document.getElementById('confirm-container');
    if (confirmContainer) confirmContainer.classList.remove('d-none');
}

async function ejecutarEliminacion() {
    if (!idVacanteParaBorrar) return;

    document.getElementById('confirm-container').classList.add('d-none');
    mostrarStatusPro('cargando', 'Eliminando vacante...');

    try {
        const response = await fetch(`${API_BASE_URL}/offers/${idVacanteParaBorrar}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            mostrarStatusPro('exito', '¡Vacante eliminada!');
            setTimeout(() => {
                ocultarStatusPro();
                cargarMisVacantes();
            }, 1200);
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error al eliminar.");
    }
}

// 6. ELIMINAR CUENTA (NUEVO)
function confirmarBajaCuenta() {
    const modalBaja = document.getElementById('confirm-baja-container');
    if (modalBaja) modalBaja.classList.remove('d-none');
}

async function ejecutarBajaCuenta() {
    document.getElementById('confirm-baja-container').classList.add('d-none');
    mostrarStatusPro('cargando', 'Eliminando datos...');

    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            mostrarStatusPro('exito', 'Cuenta eliminada');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = "Login.html";
            }, 1500);
        } else {
            ocultarStatusPro();
            alert("No se pudo eliminar la cuenta.");
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error de conexión al intentar borrar.");
    }
}

// 7. SUBIR FOTO DE PERFIL
async function subirFotoPerfil(e) {
    const file = e.target.files[0];
    if (!file) return;

    mostrarStatusPro('cargando', 'Subiendo imagen...');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/users/me/photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            const finalUrl = data.foto_url.startsWith('http') ? data.foto_url : `${API_BASE_URL}${data.foto_url}`;
            document.getElementById('img-perfil').src = finalUrl + "?t=" + new Date().getTime();
            mostrarStatusPro('exito', 'Foto actualizada');
            setTimeout(ocultarStatusPro, 1500);
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error de red al subir foto.");
    }
}

// --- UTILIDADES DE UI ---
function mostrarStatusPro(estado, mensaje) {
    const container = document.getElementById('status-container');
    const texto = document.getElementById('status-texto');
    const spinner = document.getElementById('status-spinner');
    const check = document.getElementById('status-check');

    if (!container) return;
    container.classList.remove('d-none');
    texto.innerText = mensaje;

    if (estado === 'cargando') {
        spinner.classList.remove('d-none');
        check.classList.add('d-none');
    } else {
        spinner.classList.add('d-none');
        check.classList.remove('d-none');
    }
}

function ocultarStatusPro() {
    const container = document.getElementById('status-container');
    if (container) container.classList.add('d-none');
}