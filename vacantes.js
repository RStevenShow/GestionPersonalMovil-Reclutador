/* =====================================================
   LOGICA DE VACANTES - CONEXIÓN CON FASTAPI & POSTGRES
===================================================== */

// Configuración de la URL de tu laptop (Cambiar por la de la nube en el futuro)
const API_URL = "http://localhost:8000"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar vacantes al iniciar
    obtenerVacantes();

    // 2. Configurar el filtro de búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', filtrarVacantes);
});

// --- 1. OBTENER DATOS DE LA LAPTOP ---
async function obtenerVacantes() {
    try {
        const response = await fetch(`${API_URL}/offers/`);
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        
        const vacantes = await response.json();
        renderizarVacantes(vacantes);
    } catch (error) {
        console.error("Error al conectar:", error);
        document.getElementById('vacantes-list').innerHTML = `
            <div class="alert alert-danger mx-3 small text-center">
                <i class="bi bi-wifi-off d-block fs-3 mb-2"></i>
                No se pudo conectar con el servidor local.<br>
                Asegúrate de que FastAPI esté corriendo en tu laptop.
            </div>`;
    }
}

// --- 2. RENDERIZAR TARJETAS DINÁMICAMENTE ---
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
    contenedor.innerHTML = '';

    if (vacantes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted">No hay vacantes registradas.</p>';
        return;
    }

    vacantes.forEach(v => {
        const tarjeta = document.createElement('div');
        // Usamos la prioridad para el color del borde izquierdo
        tarjeta.className = `job-card shadow-sm prioridad-${v.priority} fade`;
        
        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="h6 fw-bold mb-0 text-dark">${v.title}</h3>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> ${v.location || 'Remoto'}</small>
                </div>
                <span class="badge bg-primary-subtle text-primary border-0 small">
                    ${v.salary_range ? v.salary_range : 'S/N'}
                </span>
            </div>
            
            <div class="d-flex gap-3 mb-1 small text-secondary">
                <span><i class="bi bi-person-workspace text-primary"></i> ${v.experience_years} años exp.</span>
                <span><i class="bi bi-people"></i> 0 Aplicantes</span>
            </div>

            <p class="text-muted small mb-0 text-truncate" style="max-width: 250px;">
                ${v.description_original}
            </p>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Actualizar los números de las estadísticas del Header
    actualizarEstadisticas(vacantes);
}

// --- 3. CREAR NUEVA VACANTE (POST A LAPTOP) ---
async function crearVacante() {
    const boton = event.target;
    const textoOriginal = boton.innerHTML;

    // Captura de todos los campos según tu SQLModel
    const datosVacante = {
        title: document.getElementById('title').value,
        description_original: document.getElementById('description').value,
        salary_range: document.getElementById('salary_range').value || null,
        experience_years: parseInt(document.getElementById('experience_years').value) || 0,
        responsibilities: document.getElementById('responsibilities').value || null,
        location: document.getElementById('location').value || "Remoto",
        priority: document.getElementById('priority').value || "medium"
    };

    // Validación básica
    if (!datosVacante.title || !datosVacante.description_original) {
        alert("Los campos con * son obligatorios.");
        return;
    }

    // UI: Estado de carga
    boton.disabled = true;
    boton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Analizando con IA...`;

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVacante)
        });

        if (response.ok) {
            alert("¡Éxito! Vacante enviada a IA y guardada en PostgreSQL.");
            
            // Cerrar modal y limpiar formulario
            const modalElement = document.getElementById('modalNuevaVacante');
            const modalBus = bootstrap.Modal.getInstance(modalElement);
            modalBus.hide();
            document.getElementById('formVacante').reset();
            
            // Recargar lista
            obtenerVacantes();
        } else {
            alert("Hubo un problema al guardar la vacante.");
        }
    } catch (error) {
        alert("Error crítico de conexión.");
        console.error(error);
    } finally {
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

// --- 4. FUNCIONES AUXILIARES ---
function actualizarEstadisticas(vacantes) {
    document.getElementById('stat-abiertas').innerText = vacantes.length;
    // Aquí puedes sumar candidatos de las relaciones en el futuro
    document.getElementById('stat-candidatos').innerText = "0"; 
}

function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.job-card');

    tarjetas.forEach(t => {
        const titulo = t.querySelector('h3').innerText.toLowerCase();
        if (titulo.includes(texto)) {
            t.style.display = "block";
        } else {
            t.style.display = "none";
        }
    });
}