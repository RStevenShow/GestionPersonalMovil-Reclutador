/* =====================================================
   LÓGICA DE DETALLE Y RANKING IA (MOBILE - PRODUCCIÓN)
   Proyecto: MarkNica Recruiting AI
===================================================== */

const API_BASE_URL = "https://reclutamiento-backend.onrender.com";
const token = localStorage.getItem('token');

// 1. OBTENER ID: Capturamos el ID de la vacante de la URL (?id=X)
const params = new URLSearchParams(window.location.search);
const offerId = params.get('id');

document.addEventListener('DOMContentLoaded', () => {
    // Si no hay token, al login
    if (!token) {
        window.location.href = "Login.html";
        return;
    }

    // Si entran sin ID, los devolvemos a vacantes
    if (!offerId) {
        window.location.href = "vacantes.html";
        return;
    }
    consultarServidor();
});

// 2. PETICIÓN: Traemos la oferta y sus candidatos desde Render/Supabase
async function consultarServidor() {
    try {
        const response = await fetch(`${API_BASE_URL}/offers/${offerId}`, {
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

        if (!response.ok) throw new Error("Error al obtener datos");
        
        const data = await response.json();
        
        // Llenamos la info de la vacante en el encabezado
        const infoVacante = document.getElementById('info-vacante');
        if (infoVacante) {
            infoVacante.innerHTML = `
                <h2 class="h5 fw-bold mb-1 text-white">${data.title}</h2>
                <div class="d-flex align-items-center opacity-75 small text-white">
                    <i class="bi bi-geo-alt me-1"></i> ${data.location || 'Managua, Nicaragua'}
                </div>
            `;
        }

        // Si el backend devuelve los candidatos dentro del objeto de la oferta
        pintarRanking(data.candidates || []);

    } catch (e) {
        console.error("Error cargando detalle:", e);
        const lista = document.getElementById('lista-ranking');
        if (lista) {
            lista.innerHTML = '<div class="text-center p-5 text-danger small">Error de conexión. El servidor está despertando...</div>';
        }
    }
}

// 3. RENDER: Dibujamos a los candidatos ordenados por Score de IA
function pintarRanking(candidatos) {
    const lista = document.getElementById('lista-ranking');
    const contador = document.getElementById('total-cands');
    
    if (contador) contador.innerText = candidatos.length;
    if (!lista) return;

    lista.innerHTML = '';

    if (candidatos.length === 0) {
        lista.innerHTML = '<div class="text-center p-5 text-muted small">Aún no hay CVs procesados para esta vacante.</div>';
        return;
    }

    // PROCESO CLAVE: Ordenar candidatos de mayor a menor Match Score
    candidatos.sort((a, b) => b.match_score - a.match_score);

    candidatos.forEach((cand, index) => {
        // Mapeamos el score a los estilos de prioridad de tu CSS
        let prioridad = "prioridad-baja"; // Verde (Default)
        let icono = "bi-patch-check text-success";
        
        if (cand.match_score >= 80) {
            prioridad = "prioridad-alta"; // Rojo (Excelente Match)
            icono = "bi-patch-check-fill text-danger";
        } else if (cand.match_score >= 50) {
            prioridad = "prioridad-media"; // Naranja (Buen candidato)
            icono = "bi-patch-check text-warning";
        }

        // Creamos la tarjeta usando tus clases .tarjeta-accion
        const card = document.createElement('div');
        card.className = `tarjeta-accion ${prioridad} p-3 mb-2 shadow-sm d-flex align-items-center`;
        
        // Limpiamos el nombre (quitamos .pdf o extensiones)
        const nombreLimpio = cand.name.replace(/\.[^/.]+$/, "");

        card.innerHTML = `
            <div class="me-3 fw-bold text-secondary" style="min-width: 25px;">#${index + 1}</div>
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold text-dark">${nombreLimpio}</h6>
                <small class="text-muted d-block">
                    <i class="bi bi-telephone me-1"></i>${cand.phone || 'Sin teléfono'}
                </small>
            </div>
            <div class="text-end">
                <span class="fw-bold d-block text-dark" style="font-size: 1.1rem;">${Math.round(cand.match_score)}%</span>
                <i class="bi ${icono}"></i>
            </div>
        `;
        
        // Agregar evento para ver detalle del candidato si lo deseas en el futuro
        card.style.cursor = "pointer";
        
        lista.appendChild(card);
    });
}