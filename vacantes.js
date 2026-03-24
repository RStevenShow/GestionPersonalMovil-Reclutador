/* =====================================================
   VACANTES.JS - GESTIÓN DE VACANTES (SISTEMA PRO)
   Proyecto: MarkNica Recruiting AI
   Explicación: Este archivo maneja la lista de trabajos
   y la creación de nuevos puestos usando IA.
===================================================== */

const API_URL = "http://localhost:8000";

// 1. INICIALIZACIÓN: Se ejecuta cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    // Pedimos las vacantes guardadas al servidor
    obtenerVacantes();
    
    // Escuchamos lo que el usuario escribe en la lupa de buscar
    const inputBusqueda = document.getElementById('searchInput');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', filtrarVacantes);
    }
});

/**
 * FUNCIÓN: Obtener vacantes del servidor
 * Explicación: Trae la lista de trabajos usando el Token de seguridad.
 */
async function obtenerVacantes() {
    const token = localStorage.getItem('token'); 

    // Si no hay token, el usuario no está logueado
    if (!token) {
        window.location.href = "Login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });

        // Si el token expiró (401), lo mandamos a loguearse de nuevo
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = "Login.html";
            return;
        }

        if (!response.ok) throw new Error("Error en el servidor");
        
        const vacantes = await response.json();
        
        // Dibujamos las tarjetas en pantalla
        renderizarVacantes(vacantes);

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('vacantes-list').innerHTML = `
            <div class="text-center p-5 opacity-50">
                <i class="bi bi-cloud-slash fs-1 text-danger"></i>
                <p>No se pudo conectar con el servidor.</p>
            </div>`;
    }
}

/**
 * FUNCIÓN: Crear las tarjetas visuales
 * Explicación: Convierte los datos del servidor en cuadritos HTML.
 */
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
    if (!contenedor) return;

    contenedor.innerHTML = ''; 

    if (vacantes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted py-5">No hay vacantes registradas.</p>';
        return;
    }

    vacantes.forEach(v => {
        const tarjeta = document.createElement('div');
        tarjeta.className = `job-card shadow-sm prioridad-${v.priority || 'medium'}`;
        
        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="h6 fw-bold mb-0 text-dark">${v.title}</h3>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> ${v.location || 'Remoto'}</small>
                </div>
                <span class="badge bg-primary-subtle text-primary border-0 small">
                    ${v.salary_range || 'Privado'}
                </span>
            </div>
            <div class="d-flex gap-3 mb-2 small text-secondary">
                <span><i class="bi bi-briefcase text-primary"></i> ${v.experience_years} años exp.</span>
                <span><i class="bi bi-people"></i> 0 Aplicantes</span>
            </div>
            <p class="text-muted small mb-0 text-truncate">${v.description_original}</p>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Actualizamos el contador de la parte superior
    const statAbiertas = document.getElementById('stat-abiertas');
    if (statAbiertas) statAbiertas.innerText = vacantes.length;
}

/**
 * FUNCIÓN: Crear una nueva vacante
 * Explicación: Envía los datos del formulario al servidor y procesa con IA.
 */
async function crearVacante() {
    const token = localStorage.getItem('token');
    const btn = document.getElementById('btn-crear-vacante');
    
    // Recolectamos los datos del formulario
    const datosVacante = {
        title: document.getElementById('title').value,
        description_original: document.getElementById('description').value,
        salary_range: document.getElementById('salary_range').value || null,
        experience_years: parseInt(document.getElementById('experience_years').value) || 0,
        responsibilities: document.getElementById('responsibilities').value || null,
        location: document.getElementById('location').value || "Remoto",
        priority: document.getElementById('priority').value || "medium"
    };

    // Validación: El título y la descripción son obligatorios
    if (!datosVacante.title || !datosVacante.description_original) {
        mostrarErrorVacante("Completa los campos obligatorios (*)");
        return;
    }

    // 1. ESTADO: Mostramos la cajita blanca de "Procesando"
    mostrarStatusPro('cargando', 'Analizando con IA...');
    ocultarErrorVacante();

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosVacante)
        });

        if (response.ok) {
            // 2. ESTADO: ¡Éxito! (Check verde)
            mostrarStatusPro('exito', '¡Vacante Creada!');

            setTimeout(() => {
                // Cerramos el modal de Bootstrap del formulario
                const modalEl = document.getElementById('modalNuevaVacante');
                const modalBus = bootstrap.Modal.getInstance(modalEl);
                if (modalBus) modalBus.hide();

                // Limpiamos todo
                ocultarStatusPro();
                document.getElementById('formVacante').reset();
                obtenerVacantes(); // Recargamos la lista para ver la nueva
            }, 1500);

        } else {
            const err = await response.json();
            ocultarStatusPro();
            mostrarErrorVacante(err.detail || "Error al guardar");
        }
    } catch (error) {
        ocultarStatusPro();
        mostrarErrorVacante("Sin conexión con el servidor");
    }
}

/* =====================================================
   FUNCIONES DE APOYO VISUAL (MODAL DE ESTADO PRO)
===================================================== */

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
        texto.classList.remove('text-success');
    } else {
        spinner.classList.add('d-none');
        check.classList.remove('d-none');
        texto.classList.add('text-success');
    }
}

function ocultarStatusPro() {
    const container = document.getElementById('status-container');
    if (container) container.classList.add('d-none');
}

function mostrarErrorVacante(mensaje) {
    const alerta = document.getElementById('alerta-error-vacante');
    const texto = document.getElementById('mensaje-error-vacante');
    if (alerta && texto) {
        texto.innerText = mensaje;
        alerta.classList.remove('d-none');
    }
}

function ocultarErrorVacante() {
    const alerta = document.getElementById('alerta-error-vacante');
    if (alerta) alerta.classList.add('d-none');
}

/**
 * Filtra las tarjetas de vacantes en tiempo real
 */
function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.job-card');
    tarjetas.forEach(t => {
        const titulo = t.querySelector('h3').innerText.toLowerCase();
        t.style.display = titulo.includes(texto) ? "block" : "none";
    });
}