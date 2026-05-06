/* =====================================================
   VACANTES.JS - LOGICA DE GESTIÓN Y NAVEGACIÓN
   Proyecto: MarkNica Recruiting AI
===================================================== */

const API_URL = "https://reclutamiento-backend.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    obtenerVacantes();
    const inputBusqueda = document.getElementById('searchInput');
    if (inputBusqueda) inputBusqueda.addEventListener('input', filtrarVacantes);
});

// 1. OBTENER DATOS
async function obtenerVacantes() {
    const token = localStorage.getItem('token'); 
    if (!token) return window.location.href = "Login.html";

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = "Login.html";
            return;
        }

        const vacantes = await response.json();
        renderizarVacantes(vacantes);

    } catch (error) {
        console.error("Error al obtener vacantes:", error);
        document.getElementById('vacantes-list').innerHTML = 
            `<p class="text-center p-5 text-danger small">El servidor está despertando. Reintenta en unos segundos.</p>`;
    }
}

// 2. RENDERIZAR
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
    if (!contenedor) return;

    contenedor.innerHTML = ''; 

    if (vacantes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted py-5 small">No tienes vacantes activas aún.</p>';
        return;
    }

    let totalCandidatos = 0;
    let vacantesCerradas = 0;

    vacantes.forEach(v => {
        const tarjeta = document.createElement('div');
        tarjeta.className = `job-card shadow-sm mb-3 prioridad-${v.priority || 'medium'}`;
        tarjeta.style.cursor = "pointer";

        const estado = v.estado || "abierta";
        const llena = estado === "cerrada";

        if (llena) vacantesCerradas++;

        const numCandidatos = v.candidates ? v.candidates.length : 0;
        totalCandidatos += numCandidatos;

        tarjeta.onclick = () => {
    irADetalle(v.id);
};

        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="h6 fw-bold mb-0 text-dark">${v.title}</h3>
                    <small class="text-muted">
                        <i class="bi bi-geo-alt"></i> ${v.location || 'Nicaragua'}
                    </small>
                </div>
                ${llena ? '<span class="badge bg-danger">Vacante Llena</span>' : ''}
            </div>

            <div class="d-flex gap-3 mb-2 small text-secondary">
                <span><i class="bi bi-briefcase text-primary"></i> ${v.experience_years} años</span>
                <span><i class="bi bi-people"></i> ${numCandidatos}/${v.max_candidatos}</span>
            </div>

            <div class="badge bg-light text-primary border-0 small">
                <i class="bi bi-cash-stack"></i> ${v.salary_range || 'Sueldo a convenir'}
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });

    // STATS
    const statAbiertas = document.getElementById('stat-abiertas');
    const statCandidatos = document.getElementById('stat-candidatos');
    const statLlenas = document.getElementById('stat-llenas');

    if (statAbiertas) statAbiertas.innerText = vacantes.length;
    if (statCandidatos) statCandidatos.innerText = totalCandidatos;
    if (statLlenas) statLlenas.innerText = `${vacantesCerradas}/${vacantes.length}`;
}

// 3. NAVEGACIÓN
function irADetalle(id) {
    window.location.href = `detalle_vacante.html?id=${id}`;
}

// 4. CREAR VACANTE
async function crearVacante() {
    const token = localStorage.getItem('token');
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');

    if (!titleInput.value || !descInput.value) {
        alert("Por favor completa el título y la descripción.");
        return;
    }

    const datosVacante = {
        title: titleInput.value,
        description_original: descInput.value,
        salary_range: document.getElementById('salary_range').value || null,
        experience_years: parseInt(document.getElementById('experience_years').value) || 0,
        location: document.getElementById('location').value || "Remoto",
        priority: document.getElementById('priority').value || "medium",
        max_candidatos: parseInt(document.getElementById('max_candidatos')?.value) || 1
    };

    mostrarStatusPro('cargando', 'IA analizando puesto...');

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
            mostrarStatusPro('exito', '¡Vacante Publicada!');
            setTimeout(() => {
                const modalElement = document.getElementById('modalNuevaVacante');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
                
                ocultarStatusPro();
                document.getElementById('formVacante').reset();
                obtenerVacantes();
            }, 1200);
        } else {
            ocultarStatusPro();
            alert("Error al crear la vacante.");
        }
    } catch (error) { 
        ocultarStatusPro(); 
        console.error("Error:", error);
    }
}

// UI
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

// BUSCADOR
function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.job-card').forEach(tarjeta => {
        const titulo = tarjeta.querySelector('h3').innerText.toLowerCase();
        tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
    });
}