/* =====================================================
   PERFIL.JS - VERSIÓN ENFOCADA A MÓVIL (BOTTOM SHEET)
   Proyecto: MarkNica Recruiting AI
===================================================== */

const API_BASE_URL = "http://127.0.0.1:8000";
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
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        document.getElementById('confirm-container').classList.add('d-none');
        idVacanteParaBorrar = null;
    });
    document.getElementById('confirm-accept').addEventListener('click', ejecutarEliminacion);

    // Evento para subir foto
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
            document.getElementById('perfil-nombre').innerText = user.full_name || user.username;
            document.getElementById('perfil-email').innerText = user.email;
            
            if (user.photo_url) {
                document.getElementById('img-perfil').src = user.photo_url + "?t=" + new Date().getTime();
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

    // Resetear y configurar según el campo
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

    // Animación de subida
    setTimeout(() => sheet.classList.add('active'), 10);
}

function cerrarSheet() {
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('sheet-overlay');
    
    sheet.classList.remove('active');
    setTimeout(() => overlay.classList.add('d-none'), 400);
}

async function guardarCambioSheet() {
    const nuevoValor = document.getElementById('input-nuevo-valor').value;
    if (!nuevoValor) return;

    cerrarSheet();
    mostrarStatusPro('cargando', 'Actualizando...');

    try {
        // Creamos un objeto con los datos actuales para no enviar campos nulos
        // El backend necesita username y email obligatoriamente según UserCreate
        const updateData = {
            username: document.getElementById('perfil-email').innerText, // Usamos el correo como username
            email: document.getElementById('perfil-email').innerText,
            full_name: document.getElementById('perfil-nombre').innerText,
            password: "" // Por defecto vacía si no se cambia
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
            mostrarStatusPro('exito', '¡Datos Guardados!');
            setTimeout(() => {
                ocultarStatusPro();
                cargarDatosUsuario(); // Refresca la pantalla
            }, 1200);
        } else {
            ocultarStatusPro();
            alert("Error al guardar: Verifique los datos");
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error de conexión con el servidor");
    }
}

// 5. GESTIÓN DE VACANTES (CARGAR Y ELIMINAR)
async function cargarMisVacantes() {
    const contenedor = document.getElementById('lista-mis-vacantes');
    const badge = document.getElementById('badge-vacantes');

    try {
        const response = await fetch(`${API_BASE_URL}/offers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const vacantes = await response.json();
            badge.innerText = vacantes.length;

            if (vacantes.length === 0) {
                contenedor.innerHTML = `<p class="text-center small text-muted py-3">No tienes vacantes activas.</p>`;
                return;
            }

            contenedor.innerHTML = vacantes.map(v => `
                <div class="mini-card-vacante" id="card-${v.id}">
                    <div>
                        <h6 class="fw-bold mb-0">${v.title}</h6>
                        <small class="text-muted">${v.location || 'Remoto'}</small>
                    </div>
                    <button class="btn-borrar-mini" onclick="prepararEliminacion(${v.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        contenedor.innerHTML = `<p class="text-danger small text-center">Error de conexión.</p>`;
    }
}

function prepararEliminacion(id) {
    idVacanteParaBorrar = id;
    document.getElementById('confirm-container').classList.remove('d-none');
}

async function ejecutarEliminacion() {
    if (!idVacanteParaBorrar) return;

    document.getElementById('confirm-container').classList.add('d-none');
    mostrarStatusPro('cargando', 'Eliminando...');

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

// 6. FOTO DE PERFIL
async function subirFotoPerfil(e) {
    const file = e.target.files[0];
    if (!file) return;

    mostrarStatusPro('cargando', 'Subiendo foto...');
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
            document.getElementById('img-perfil').src = data.foto_url + "?t=" + new Date().getTime();
            mostrarStatusPro('exito', 'Foto actualizada');
            setTimeout(ocultarStatusPro, 1500);
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error al subir foto.");
    }
}

// 7. DAR DE BAJA
function confirmarBajaCuenta() {
    // Mostramos el modal de baja en lugar del alert
    document.getElementById('confirm-baja-container').classList.remove('d-none');
}

// Configurar botones del modal de BAJA
document.getElementById('baja-cancel').addEventListener('click', () => {
    document.getElementById('confirm-baja-container').classList.add('d-none');
});

document.getElementById('baja-accept').addEventListener('click', async () => {
    // Cerramos el modal de pregunta
    document.getElementById('confirm-baja-container').classList.add('d-none');
    
    // Mostramos la cajita de estado
    mostrarStatusPro('cargando', 'Borrando cuenta permanentemente...');

    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            mostrarStatusPro('exito', 'Cuenta eliminada');
            
            // Esperamos un momento y limpiamos todo para ir al Login
            setTimeout(() => {
                localStorage.clear();
                window.location.href = "Login.html";
            }, 2000);
        } else {
            ocultarStatusPro();
            alert("Error al intentar eliminar la cuenta.");
        }
    } catch (error) {
        ocultarStatusPro();
        console.error("Error de red:", error);
    }
});

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