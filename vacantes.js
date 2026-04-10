/* =====================================================
   VACANTES.JS - LOGICA DE GESTIÓN Y NAVEGACIÓN
===================================================== */

const API_URL = "http://localhost:8000";

document.addEventListener('DOMContentLoaded', () => {
    obtenerVacantes();
    const inputBusqueda = document.getElementById('searchInput');
    if (inputBusqueda) inputBusqueda.addEventListener('input', filtrarVacantes);
});

// 1. OBTENER DATOS REALES DE POSTGRESQL
async function obtenerVacantes() {
    const token = localStorage.getItem('token'); 
    if (!token) return window.location.href = "Login.html";

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = "Login.html";
            return;
        }

        const vacantes = await response.json();
        renderizarVacantes(vacantes);

    } catch (error) {
        document.getElementById('vacantes-list').innerHTML = `<p class="text-center p-5 text-danger">Error de conexión</p>`;
    }
}

// 2. RENDERIZAR TARJETAS CON EVENTO CLICK
function renderizarVacantes(vacantes) {
    const contenedor = document.getElementById('vacantes-list');
    if (!contenedor) return;

    contenedor.innerHTML = ''; 

    if (vacantes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-muted py-5">No hay vacantes.</p>';
        return;
    }

    vacantes.forEach(v => {
        const tarjeta = document.createElement('div');
        // Clase dinámica según prioridad (Roja, Naranja, Verde)
        tarjeta.className = `job-card shadow-sm prioridad-${v.priority || 'medium'}`;
        
        // PROCESO: Habilitar el clic para entrar al detalle
        tarjeta.style.cursor = "pointer";
        tarjeta.setAttribute('onclick', `irADetalle(${v.id})`);
        
        tarjeta.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="h6 fw-bold mb-0">${v.title}</h3>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> ${v.location || 'Remoto'}</small>
                </div>
                <i class="bi bi-chevron-right text-muted"></i>
            </div>
            <div class="d-flex gap-3 mb-2 small text-secondary">
                <span><i class="bi bi-briefcase text-primary"></i> ${v.experience_years} años</span>
                <span><i class="bi bi-people"></i> ${v.candidates ? v.candidates.length : 0} Aplicantes</span>
            </div>
            <div class="badge bg-light text-primary border-0 small">
               <i class="bi bi-cash-stack"></i> ${v.salary_range || 'Privado'}
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Actualizar contadores superiores
    document.getElementById('stat-abiertas').innerText = vacantes.length;
    const totalCand = vacantes.reduce((acc, v) => acc + (v.candidates ? v.candidates.length : 0), 0);
    document.getElementById('stat-candidatos').innerText = totalCand;
}

// 3. FUNCIÓN DE NAVEGACIÓN (Clave para entrar al Ranking)
function irADetalle(id) {
    window.location.href = `detalle_vacante.html?id=${id}`;
}

// 4. LÓGICA PARA CREAR NUEVA VACANTE
async function crearVacante() {
    const token = localStorage.getItem('token');
    const datosVacante = {
        title: document.getElementById('title').value,
        description_original: document.getElementById('description').value,
        salary_range: document.getElementById('salary_range').value || null,
        experience_years: parseInt(document.getElementById('experience_years').value) || 0,
        location: document.getElementById('location').value || "Remoto",
        priority: document.getElementById('priority').value || "medium"
    };

    if (!datosVacante.title || !datosVacante.description_original) return alert("Faltan campos");

    mostrarStatusPro('cargando', 'Analizando con IA...');

    try {
        const response = await fetch(`${API_URL}/offers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datosVacante)
        });

        if (response.ok) {
            mostrarStatusPro('exito', '¡Vacante Creada!');
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaVacante'));
                modal.hide();
                ocultarStatusPro();
                document.getElementById('formVacante').reset();
                obtenerVacantes();
            }, 1200);
        }
    } catch (error) { ocultarStatusPro(); }
}

// UTILIDADES VISUALES
function mostrarStatusPro(estado, mensaje) {
    const container = document.getElementById('status-container');
    container.classList.remove('d-none');
    document.getElementById('status-texto').innerText = mensaje;
    if (estado === 'exito') {
        document.getElementById('status-spinner').classList.add('d-none');
        document.getElementById('status-check').classList.remove('d-none');
    }
}

function ocultarStatusPro() { document.getElementById('status-container').classList.add('d-none'); }

function filtrarVacantes() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.job-card').forEach(t => {
        const titulo = t.querySelector('h3').innerText.toLowerCase();
        t.style.display = titulo.includes(texto) ? "block" : "none";
    });
}