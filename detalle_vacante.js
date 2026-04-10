/* =====================================================
   LÓGICA DE DETALLE Y RANKING IA (MOBILE)
===================================================== */

const API_BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem('token');

// 1. OBTENER ID: Capturamos el ID de la vacante de la URL (?id=X)
const params = new URLSearchParams(window.location.search);
const offerId = params.get('id');

document.addEventListener('DOMContentLoaded', () => {
    // Si entran sin ID, los devolvemos a vacantes
    if (!offerId) {
        window.location.href = "vacantes.html";
        return;
    }
    consultarServidor();
});

// 2. PETICIÓN: Traemos la oferta y sus candidatos desde PostgreSQL
async function consultarServidor() {
    try {
        const response = await fetch(`${API_BASE_URL}/offers/${offerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Token inválido o error de red");
        
        const data = await response.json();
        
        // Llenamos la info de la vacante en el encabezado
        document.getElementById('info-vacante').innerHTML = `
            <h2 class="h5 fw-bold mb-1 text-white">${data.title}</h2>
            <div class="d-flex align-items-center opacity-75 small">
                <i class="bi bi-geo-alt me-1"></i> ${data.location || 'Managua, Nicaragua'}
            </div>
        `;

        pintarRanking(data.candidates);
    } catch (e) {
        console.error("Error cargando detalle:", e);
    }
}

// 3. RENDER: Dibujamos a los candidatos ordenados por Score
function pintarRanking(candidatos) {
    const lista = document.getElementById('lista-ranking');
    document.getElementById('total-cands').innerText = candidatos.length;
    lista.innerHTML = '';

    if (candidatos.length === 0) {
        lista.innerHTML = '<div class="text-center p-5 text-muted small">No hay aplicantes registrados.</div>';
        return;
    }

    // PROCESO CLAVE: Ordenar candidatos de mayor a menor Match Score
    candidatos.sort((a, b) => b.match_score - a.match_score);

    candidatos.forEach((cand, index) => {
        // MApamos el score a tus estilos de prioridad
        let prioridad = "prioridad-baja"; // Verde (Default)
        let icono = "bi-patch-check text-success";
        
        if (cand.match_score >= 80) {
            prioridad = "prioridad-alta"; // Rojo (Muy importante)
            icono = "bi-patch-check-fill text-danger";
        } else if (cand.match_score >= 50) {
            prioridad = "prioridad-media"; // Naranja (Interesante)
            icono = "bi-patch-check text-warning";
        }

        // Creamos la tarjeta usando tus clases .tarjeta-accion
        const card = document.createElement('div');
        card.className = `tarjeta-accion ${prioridad} p-3 mb-2 shadow-sm d-flex align-items-center fade`;
        card.innerHTML = `
            <div class="me-3 fw-bold text-secondary">#${index + 1}</div>
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold">${cand.name.split('.')[0]}</h6>
                <small class="text-muted"><i class="bi bi-telephone me-1"></i>${cand.phone || 'N/A'}</small>
            </div>
            <div class="text-end">
                <span class="fw-bold d-block text-dark">${Math.round(cand.match_score)}%</span>
                <i class="bi ${icono}"></i>
            </div>
        `;
        lista.appendChild(card);
    });
}