/* =====================================================
   LOGICA DE GESTIÓN DE VACANTES - MARKNICA
===================================================== */

const API_URL = "http://localhost:8000"; 

// Variables para los modales
let modalCargando, modalExito, modalError;

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de modales
    modalCargando = new bootstrap.Modal(document.getElementById('modal-cargando'));
    modalExito = new bootstrap.Modal(document.getElementById('modal-exito'));
    modalError = new bootstrap.Modal(document.getElementById('modal-error'));

    // Carga inicial
    obtenerVacantes();
    
    // Buscador en tiempo real
    document.getElementById('searchInput').addEventListener('input', filtrarVacantes);

    // ESCUCHADOR ESPECIAL: Limpiar el fondo negro cuando se cierre el modal de éxito
    const elExito = document.getElementById('modal-exito');
    elExito.addEventListener('hidden.bs.modal', removerFondoOscuro);
});

/**
 * Obtiene las vacantes del servidor
 */
async function obtenerVacantes() {
    try {
        const response = await fetch(`${API_URL}/offers/`);
        if (!response.ok) throw new Error("Error en el servidor");
        
        const vacantes = await response.json();
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
 * Crea las tarjetas de vacantes en el HTML
 */
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
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

    actualizarEstadisticas(vacantes);
}

/**
 * Lógica principal para crear la vacante
 */
async function crearVacante() {
    const datosVacante = {
        title: document.getElementById('title').value,
        description_original: document.getElementById('description').value,
        salary_range: document.getElementById('salary_range').value || null,
        experience_years: parseInt(document.getElementById('experience_years').value) || 0,
        responsibilities: document.getElementById('responsibilities').value || null,
        location: document.getElementById('location').value || "Remoto",
        priority: document.getElementById('priority').value || "medium"
    };

    if (!datosVacante.title || !datosVacante.description_original) {
        document.getElementById('mensaje-error-texto').innerText = "Llena los campos obligatorios (*).";
        modalError.show();
        return;
    }

    // 1. Mostrar carga
    modalCargando.show();

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVacante)
        });

        // 2. Ocultar carga inmediatamente después de la respuesta
        modalCargando.hide();

        if (response.ok) {
            // 3. Cerrar el modal del formulario
            const modalForm = bootstrap.Modal.getInstance(document.getElementById('modalNuevaVacante'));
            if (modalForm) modalForm.hide();

            // 4. LIMPIEZA CRÍTICA: Quitamos el fondo negro antes de mostrar el éxito
            removerFondoOscuro();

            // 5. Mostrar éxito
            setTimeout(() => {
                document.getElementById('mensaje-exito-texto').innerText = "Vacante creada correctamente.";
                modalExito.show();
            }, 300); // Pequeño delay para que Bootstrap respire

            document.getElementById('formVacante').reset();
            obtenerVacantes();
        } else {
            const err = await response.json();
            document.getElementById('mensaje-error-texto').innerText = "Error: " + (err.detail || "No guardado");
            modalError.show();
        }
    } catch (error) {
        modalCargando.hide();
        removerFondoOscuro();
        document.getElementById('mensaje-error-texto').innerText = "Error de red.";
        modalError.show();
    }
}

/**
 * FUNCIÓN DE LIMPIEZA FORZOSA (Solución al fondo negro)
 */
function removerFondoOscuro() {
    // Elimina la clase que bloquea el scroll
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Elimina cualquier capa oscura sobrante
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
}

function actualizarEstadisticas(vacantes) {
    document.getElementById('stat-abiertas').innerText = vacantes.length;
}

function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.job-card');
    tarjetas.forEach(t => {
        const titulo = t.querySelector('h3').innerText.toLowerCase();
        t.style.display = titulo.includes(texto) ? "block" : "none";
    });
}