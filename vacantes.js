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

// 1. OBTENER DATOS REALES DESDE RENDER / SUPABASE
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

// 2. RENDERIZAR TARJETAS
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
    if (!contenedor) return;

    contenedor.innerHTML = ''; 

    if (vacantes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted py-5 small">No tienes vacantes activas aún.</p>';
        return;
    }

    vacantes.forEach(v => {
        const tarjeta = document.createElement('div');
        // Clase dinámica según prioridad (prioridad-high, prioridad-medium, prioridad-low)
        tarjeta.className = `job-card shadow-sm mb-3 prioridad-${v.priority || 'medium'}`;
        
        tarjeta.style.cursor = "pointer";
        tarjeta.onclick = () => irADetalle(v.id);
        
        const numCandidatos = v.candidates ? v.candidates.length : 0;

        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="h6 fw-bold mb-0 text-dark">${v.title}</h3>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> ${v.location || 'Nicaragua'}</small>
                </div>
                <i class="bi bi-chevron-right text-muted"></i>
            </div>
            <div class="d-flex gap-3 mb-2 small text-secondary">
                <span><i class="bi bi-briefcase text-primary"></i> ${v.experience_years} años exp.</span>
                <span><i class="bi bi-people"></i> ${numCandidatos} Aplicantes</span>
            </div>
            <div class="badge bg-light text-primary border-0 small">
               <i class="bi bi-cash-stack"></i> ${v.salary_range || 'Sueldo a convenir'}
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Actualizar contadores superiores en el Dashboard
    const statAbiertas = document.getElementById('stat-abiertas');
    const statCandidatos = document.getElementById('stat-candidatos');
    
    if (statAbiertas) statAbiertas.innerText = vacantes.length;
    if (statCandidatos) {
        const totalCand = vacantes.reduce((acc, v) => acc + (v.candidates ? v.candidates.length : 0), 0);
        statCandidatos.innerText = totalCand;
    }
}

// 3. FUNCIÓN DE NAVEGACIÓN (Entrar al Ranking IA)
function irADetalle(id) {
    window.location.href = `detalle_vacante.html?id=${id}`;
}

// 4. LÓGICA PARA CREAR NUEVA VACANTE (CON IA)
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
        priority: document.getElementById('priority').value || "medium"
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
                // Cerrar modal usando Bootstrap
                const modalElement = document.getElementById('modalNuevaVacante');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
                
                ocultarStatusPro();
                document.getElementById('formVacante').reset();
                obtenerVacantes(); // Refrescar lista
            }, 1200);
        } else {
            ocultarStatusPro();
            alert("Error al crear la vacante. Intenta de nuevo.");
        }
    } catch (error) { 
        ocultarStatusPro(); 
        console.error("Error de red:", error);
    }
}

// --- UTILIDADES VISUALES ---
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

function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.job-card').forEach(tarjeta => {
        const titulo = tarjeta.querySelector('h3').innerText.toLowerCase();
        tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
    });
}