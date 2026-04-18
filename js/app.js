// --- Parseador CSV Básico ---
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    // La primera linea en data.js es: Email;First Name;Last Name;Phone;Etapa_lead;Modelo_Interes;Uso_Moto;Puntaje_Lead
    // Saltamos la línea de encabezado (index 0)
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(';');
        if (columns.length >= 8) {
            data.push({
                email: columns[0],
                nombre: `${columns[1]} ${columns[2]}`,
                modelo: columns[5],
                puntaje: parseInt(columns[7]) || 0
            });
        }
    }
    return data;
}

// --- Estado Global de la Aplicación ---
let appLeads = [];
let chartInstance = null;

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    renderTable();
    updateDashboard();
    updateActivityFeed();
    setupForm();
});

// Cargar o Inicializar Datos
function initData() {
    // Revisar si ya existen datos en LocalStorage (para no sobreescribir con los del CSV si hay nuevos locales)
    const storedLeads = localStorage.getItem('hondaLeads');
    
    if (storedLeads) {
        // Datos locales existen: los cargamos
        appLeads = JSON.parse(storedLeads);
    } else {
        // Primera ejecución: Parseamos el CSV y lo guardamos
        appLeads = parseCSV(rawCSVData);
        saveData();
    }
}

function saveData() {
    localStorage.setItem('hondaLeads', JSON.stringify(appLeads));
}

// --- Renderizado de UI ---

// Rendimiento de Puntos y Badges
function getScoreBadge(score) {
    if (score >= 70) return '<span class="score-badge score-high"><i class="fa-solid fa-fire"></i> Alta</span>';
    if (score >= 40) return '<span class="score-badge score-medium"><i class="fa-solid fa-temperature-half"></i> Media</span>';
    return '<span class="score-badge score-low"><i class="fa-solid fa-snowflake"></i> Baja</span>';
}

function renderTable() {
    const tbody = document.getElementById('leadsTableBody');
    const countSpan = document.getElementById('totalLeads');
    
    // Ordenar de mayor a menor puntaje
    // Evitamos mutar appLeads directamente creando una copia antes del sort
    const sortedLeads = [...appLeads].sort((a, b) => b.puntaje - a.puntaje);
    
    let html = '';
    
    sortedLeads.forEach(lead => {
        html += `
            <tr>
                <td>
                    <span class="row-nombre">${lead.nombre}</span>
                    <span class="row-email">${lead.email}</span>
                </td>
                <td><strong>${lead.modelo}</strong></td>
                <td class="puntaje-val">${lead.puntaje}</td>
                <td>${getScoreBadge(lead.puntaje)}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    countSpan.textContent = sortedLeads.length;
}

// Panel de Análisis de Segmentos Estructurado
function updateDashboard() {
    let hot = 0;
    let warm = 0;
    let cold = 0;
    const modelCounts = {};

    appLeads.forEach(lead => {
        // Temperatura
        if (lead.puntaje >= 80) hot++;
        else if (lead.puntaje >= 50) warm++;
        else cold++;

        // Modelos
        const mod = lead.modelo || 'Otro';
        modelCounts[mod] = (modelCounts[mod] || 0) + 1;
    });

    // 1. Actualizar métricas térmicas
    document.getElementById('hot-count').textContent = hot;
    document.getElementById('warm-count').textContent = warm;
    document.getElementById('cold-count').textContent = cold;

    // 2. Renderizar Barras de Progreso Dinamicas
    const progressContainer = document.getElementById('models-progress');
    progressContainer.innerHTML = '';
    const totalLeads = appLeads.length || 1;
    
    // Ordenar de más cotizado a menos
    const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);

    sortedModels.forEach(([model, count]) => {
        const percentage = Math.round((count / totalLeads) * 100);
        progressContainer.innerHTML += `
            <div class="progress-group">
                <div class="progress-labels">
                    <span>${model}</span>
                    <span>${percentage}% (${count})</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: 0%" data-width="${percentage}%"></div>
                </div>
            </div>
        `;
    });

    // Animar anchos de barra asíncronamente
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 50);

    // 3. Sistema de Recomendaciones Estratégicas
    const insightBox = document.getElementById('insight-box');
    const insightText = document.getElementById('insight-text');
    
    // Resetear colores base
    insightBox.className = 'insight-box';

    if (hot > 0) {
        insightBox.classList.add('insight-urgent');
        insightText.textContent = 'Priorizar contacto telefónico inmediato a leads con potencial candente 🔥.';
    } else if (cold > (hot + warm)) {
        insightBox.classList.add('insight-nurture');
        insightText.textContent = 'Reactivar base con campaña de Retargeting por Email y Oportunidades.';
    } else {
        insightBox.classList.add('insight-followup');
        insightText.textContent = 'Mantener seguimiento constante para madurar prospectos actuales.';
    }
}

// Lógica de envíos del Formulario
function setupForm() {
    const form = document.getElementById('leadForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const modelo = document.getElementById('modelo').value;
        const puntaje = parseInt(document.getElementById('puntaje').value);
        
        // Crear nuevo objeto Lead
        const nuevoLead = {
            nombre,
            email,
            modelo,
            puntaje
        };
        
        // Añadir al inicio del arreglo
        appLeads.unshift(nuevoLead);
        
        // Guardar persistencia
        saveData();
        
        // Refrescar UI (Rebotará en animación si Chart.JS lo permite y la tabla re-renderiza)
        renderTable();
        updateDashboard();
        updateActivityFeed();
        
        // Mostrar feedback y resetear (Efecto sutil)
        const btn = form.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado Exitosamente!';
        btn.style.backgroundColor = '#27ae60';
        
        form.reset();
        
        // Restaurar botón después de 2s
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    });
}

// --- Actividad Reciente ---
function updateActivityFeed() {
    const feedContainer = document.getElementById('activity-feed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';

    if (appLeads.length === 0) {
        feedContainer.innerHTML = '<p class="empty-feed">Esperando nuevos leads...</p>';
        return;
    }

    const recentLeads = appLeads.slice(0, 5);

    recentLeads.forEach((lead, index) => {
        const isHot = lead.puntaje >= 80;
        const stateClass = isHot ? 'hot-event' : 'normal-event';
        
        // Simular indicativo de tiempo reciente para UI Dashboard
        let timeStr = index === 0 ? 'Hace un instante' : `hace ${index * 12 + 5} min`;

        feedContainer.innerHTML += `
            <div class="activity-item ${stateClass}">
                <div class="activity-icon"></div>
                <div class="activity-details">
                    <div class="act-name">${lead.nombre}</div>
                    <div class="act-model"><i class="fa-solid fa-motorcycle"></i> ${lead.modelo || 'Honda'}</div>
                </div>
                <div class="act-time">${timeStr}</div>
            </div>
        `;
    });
}
