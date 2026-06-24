/* =====================================================
   PERFIL.JS - VERSIÓN CORREGIDA Y OPTIMIZADA
===================================================== */

const API_BASE_URL2 = "https://reclutamiento-backend.onrender.com";
const token = localStorage.getItem('token');

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

// 2. EVENTOS
function configurarEventos() {
    // Modal Vacante
    document.getElementById('confirm-cancel')?.addEventListener('click', () => {
        document.getElementById('confirm-container').classList.add('d-none');
        idVacanteParaBorrar = null;
    });
    document.getElementById('confirm-accept')?.addEventListener('click', ejecutarEliminacion);

    // Modal Baja Cuenta
    document.getElementById('baja-cancel')?.addEventListener('click', () => {
        document.getElementById('confirm-baja-container').classList.add('d-none');
    });
    document.getElementById('baja-accept')?.addEventListener('click', ejecutarBajaCuenta);

    // Foto
    document.getElementById('subir-foto')?.addEventListener('change', subirFotoPerfil);
}

// 3. CARGAR DATOS
async function cargarDatosUsuario() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            // Guardamos el nombre limpio sin el icono en un atributo data para usarlo luego
            const nombreElemento = document.getElementById('perfil-nombre');
            nombreElemento.dataset.nombreLimpio = user.full_name || user.username;
            nombreElemento.innerHTML = `${user.full_name || user.username} <i class="bi bi-pencil-square small opacity-50 ms-1"></i>`;
            
            document.getElementById('perfil-email').innerText = user.email;
            
            if (user.photo_url) {
                const finalUrl = user.photo_url.startsWith('http') ? user.photo_url : `${API_BASE_URL2}${user.photo_url}`;
                document.getElementById('img-perfil').src = finalUrl + "?t=" + new Date().getTime();
            }
        }
    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }
}

// 4. EDITOR BOTTOM SHEET
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
        label.innerText = "Nueva Clave";
        input.type = "password";
        input.placeholder = "Mínimo 6 caracteres";
    } else if (campo === 'nombre') {
        titulo.innerText = "Editar Nombre";
        label.innerText = "Nombre Completo";
        input.type = "text";
        input.placeholder = "Ej: Ana García";
        // Pre-cargar el nombre actual
        input.value = document.getElementById('perfil-nombre').dataset.nombreLimpio || "";
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
    const nuevoValor = document.getElementById('input-nuevo-valor').value.trim();
    if (!nuevoValor) return;

    cerrarSheet();
    mostrarStatusPro('cargando', 'Actualizando...');

    try {
        // Obtenemos los datos actuales de los atributos data o texto
        const currentEmail = document.getElementById('perfil-email').innerText;
        const currentName = document.getElementById('perfil-nombre').dataset.nombreLimpio;
        
        // Construimos el objeto respetando lo que el backend UserCreate espera
        const updateData = {
            username: currentEmail, // El backend suele usar email como username
            email: currentEmail,
            full_name: currentName,
            password: "" // Se enviará vacío si no se cambia
        };

        if (campoActual === 'password') updateData.password = nuevoValor;
        if (campoActual === 'nombre') updateData.full_name = nuevoValor;

        const response = await fetch(`${API_BASE_URL2}/users/me`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            mostrarStatusPro('exito', '¡Actualizado!');
            setTimeout(() => {
                ocultarStatusPro();
                cargarDatosUsuario();
            }, 1000);
        } else {
            const err = await response.json();
            throw new Error(err.detail || "Error en actualización");
        }
    } catch (error) {
        ocultarStatusPro();
        alert(error.message);
    }
}

// 5. VACANTES
async function cargarMisVacantes() {
    const contenedor = document.getElementById('lista-mis-vacantes');
    const badge = document.getElementById('badge-vacantes');

    try {
        const response = await fetch(`${API_BASE_URL2}/offers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const vacantes = await response.json();
            if (badge) badge.innerText = vacantes.length;

            if (vacantes.length === 0) {
                contenedor.innerHTML = `<div class="text-center p-4 opacity-50 small">No hay vacantes publicadas</div>`;
                return;
            }

            contenedor.innerHTML = vacantes.map(v => `
                <div class="mini-card-vacante d-flex justify-content-between align-items-center p-3 bg-white rounded-4 shadow-sm mb-2">
                    <div>
                        <h6 class="fw-bold mb-0">${v.title}</h6>
                        <small class="text-muted">${v.location || 'Managua, Nicaragua'}</small>
                    </div>
                    <button class="btn btn-light rounded-circle text-danger" onclick="prepararEliminacion(${v.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error(error);
    }
}

function prepararEliminacion(id) {
    idVacanteParaBorrar = id;
    document.getElementById('confirm-container').classList.remove('d-none');
}

async function ejecutarEliminacion() {
    if (!idVacanteParaBorrar) return;
    document.getElementById('confirm-container').classList.add('d-none');
    mostrarStatusPro('cargando', 'Borrando...');

    try {
        const response = await fetch(`${API_BASE_URL2}/offers/${idVacanteParaBorrar}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            mostrarStatusPro('exito', 'Eliminada');
            setTimeout(() => {
                ocultarStatusPro();
                cargarMisVacantes();
            }, 1000);
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error al eliminar");
    }
}

// 6. BAJA CUENTA
function confirmarBajaCuenta() {
    document.getElementById('confirm-baja-container').classList.remove('d-none');
}

async function ejecutarBajaCuenta() {
    document.getElementById('confirm-baja-container').classList.add('d-none');
    mostrarStatusPro('cargando', 'Procesando baja...');
    try {
        const response = await fetch(`${API_BASE_URL2}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            localStorage.clear();
            window.location.href = "Login.html";
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error de conexión");
    }
}

// 7. FOTO PERFIL
async function subirFotoPerfil(e) {
    const file = e.target.files[0];
    if (!file) return;

    mostrarStatusPro('cargando', 'Subiendo foto...');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL2}/users/me/photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            mostrarStatusPro('exito', '¡Foto lista!');
            setTimeout(() => {
                ocultarStatusPro();
                cargarDatosUsuario();
            }, 1000);
        }
    } catch (error) {
        ocultarStatusPro();
        alert("Error al subir imagen");
    }
}

// UI UTILS
function mostrarStatusPro(estado, mensaje) {
    const container = document.getElementById('status-container');
    if (!container) return;
    container.classList.remove('d-none');
    document.getElementById('status-texto').innerText = mensaje;
    
    const spinner = document.getElementById('status-spinner');
    const check = document.getElementById('status-check');
    
    if (estado === 'cargando') {
        spinner.classList.remove('d-none');
        check.classList.add('d-none');
    } else {
        spinner.classList.add('d-none');
        check.classList.remove('d-none');
    }
}

function ocultarStatusPro() {
    document.getElementById('status-container')?.classList.add('d-none');
}