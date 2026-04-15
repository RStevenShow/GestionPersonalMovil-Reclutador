/* =====================================================
   PERFIL.JS - VERSIÓN ENFOCADA A MÓVIL (RENDER)
   Proyecto: MarkNica Recruiting AI
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

// 2. CONFIGURACIÓN DE EVENTOS
function configurarEventos() {
    // Modal de Confirmación (Eliminar Vacante)
    const btnCancel = document.getElementById('confirm-cancel');
    const btnAccept = document.getElementById('confirm-accept');

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            document.getElementById('confirm-container').classList.add('d-none');
            idVacanteParaBorrar = null;
        });
    }
    
    if (btnAccept) {
        btnAccept.addEventListener('click', ejecutarEliminacion);
    }

    // Evento para subir foto
    const inputFoto = document.getElementById('subir-foto');
    if (inputFoto) {
        inputFoto.addEventListener('change', subirFotoPerfil);
    }
}

// 3. CARGAR DATOS DEL RECLUTADOR (RAMÓN)
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById('perfil-nombre').innerText = user.full_name || user.username;
            document.getElementById('perfil-email').innerText = user.email;
            
            if (user.photo_url) {
                // Si la ruta es relativa (/static/...), le pegamos la base de Render
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
        input.placeholder = "Ej: Ramón Steven";
    }

    setTimeout(() => sheet.classList.add('active'), 10);
}

function cerrarSheet() {
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');
    
    if (sheet) sheet.classList.remove('active');
    setTimeout(() => {
        if (overlay) overlay.classList.add('d-none');
    }, 400);
}

async function guardarCambioSheet() {
    const nuevoValor = document.getElementById('input-nuevo-valor').value;
    if (!nuevoValor) return;

    cerrarSheet();
    mostrarStatusPro('cargando', 'Actualizando perfil...');

    try {
        const updateData = {
            username: document.getElementById('perfil-email').innerText, 
            email: document.getElementById('perfil-email').innerText,
            full_name: document.getElementById('perfil-nombre').innerText,
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
                contenedor.innerHTML = `<p class="text-center small text-muted py-3">No hay vacantes activas.</p>`;
                return;
            }

            contenedor.innerHTML = vacantes.map(v => `
                <div class="mini-card-vacante" id="card-${v.id}">
                    <div>
                        <h6 class="fw-bold mb-0">${v.title}</h6>
                        <small class="text-muted">${v.location || 'Nicaragua'}</small>
                    </div>
                    <button class="btn-borrar-mini" onclick="prepararEliminacion(${v.id})">
                        <i class="bi bi-trash text-danger"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        if (contenedor) contenedor.innerHTML = `<p class="text-danger small text-center">Error al conectar.</p>`;
    }
}

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
            mostrarStatusPro('exito', '¡Eliminada!');
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

// 6. SUBIR FOTO DE PERFIL
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

// 7. CERRAR SESIÓN
function cerrarSesion() {
    localStorage.clear();
    window.location.href = "Login.html";
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