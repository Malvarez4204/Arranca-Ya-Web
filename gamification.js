// Constantes clave para el almacenamiento local y la estructura de datos
const LS_KEY = 'gy_state_v1';
const BADGES = {
    'primer-paso': { name: 'Primer Paso', desc: 'Completaste tu primer reto' },
    'buena-racha': { name: 'Buena Racha', desc: 'Completaste 5 retos' },
    'veterano': { name: 'Veterano', desc: 'Completaste 10 retos' },
    'experto': { name: 'Experto', desc: 'Completaste 20 retos' },
    'pionero': { name: 'Pionero', desc: 'Creaste tu primer reto personalizado' }
};

// --- Funciones para manejar el estado del juego ---

function loadState() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            // Asegura que las propiedades existen
            if (!state.user) state.user = { xp: 0, level: 1, badges: [] };
            if (!state.quests) state.quests = { active: [], done: [] };
            return state;
        }
    } catch (e) {
        console.error("Error al cargar el estado:", e);
    }
    // Estado inicial si no se encuentra nada
    return {
        user: { xp: 0, level: 1, badges: [] },
        quests: {
            active: [
                { id: 'reto-ventas-1', title: 'Vende tu primer producto', desc: 'Registra tu primera venta en el sistema.', xp: 20 },
                { id: 'reto-ventas-2', title: 'Vende 5 productos', desc: 'Alcanza las 5 ventas totales en tu histórico.', xp: 50 },
                { id: 'reto-registro-1', title: 'Completa tu perfil', desc: 'Añade tu información personal en la sección de registro.', xp: 10 }
            ],
            done: []
        }
    };
}

function saveState(state) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error al guardar el estado:", e);
    }
}

// --- Funciones de lógica de la gamificación ---

function updateProgress(state, xpGain = 0) {
    state.user.xp += xpGain;
    const xpNeededForNextLevel = 100 * state.user.level;

    while (state.user.xp >= xpNeededForNextLevel) {
        state.user.xp -= xpNeededForNextLevel;
        state.user.level++;
        console.log(`¡Subiste al nivel ${state.user.level}!`);
    }

    // Lógica para asignar insignias
    const doneCount = state.quests.done.length;
    if (doneCount >= 1 && !state.user.badges.includes('primer-paso')) {
        state.user.badges.push('primer-paso');
        console.log("¡Nueva insignia: Primer Paso!");
    }
    if (doneCount >= 5 && !state.user.badges.includes('buena-racha')) {
        state.user.badges.push('buena-racha');
        console.log("¡Nueva insignia: Buena Racha!");
    }
    if (doneCount >= 10 && !state.user.badges.includes('veterano')) {
        state.user.badges.push('veterano');
        console.log("¡Nueva insignia: Veterano!");
    }
    if (doneCount >= 20 && !state.user.badges.includes('experto')) {
        state.user.badges.push('experto');
        console.log("¡Nueva insignia: Experto!");
    }

    const hasCustomQuest = state.quests.active.some(q => q.isCustom) || state.quests.done.some(q => q.isCustom);
    if (hasCustomQuest && !state.user.badges.includes('pionero')) {
        state.user.badges.push('pionero');
        console.log("¡Nueva insignia: Pionero!");
    }

    saveState(state);
    return state;
}

function renderProgress(state) {
    const xpBar = document.getElementById('xpBar');
    const statsContainer = document.getElementById('stats');
    const xpNeeded = 100 * state.user.level;
    const progressPercent = (state.user.xp / xpNeeded) * 100;
    
    xpBar.style.width = `${Math.min(progressPercent, 100)}%`;
    statsContainer.innerHTML = `
        <span class="stat">Nivel: ${state.user.level}</span>
        <span class="stat">XP: ${state.user.xp} / ${xpNeeded}</span>
        <span class="stat">Retos Completados: ${state.quests.done.length}</span>
    `;
}

function renderQuests(state) {
    const activeList = document.getElementById('activeList');
    const doneList = document.getElementById('doneList');
    activeList.innerHTML = '';
    doneList.innerHTML = '';

    state.quests.active.forEach(quest => {
        const item = document.createElement('div');
        item.className = 'quest-item';
        item.innerHTML = `
            <h4>${quest.title}</h4>
            <p>${quest.desc || 'Sin descripción.'}</p>
            <div class="quest-badges">
                <span class="badge">XP: +${quest.xp}</span>
            </div>
            <div class="quest-actions">
                <button class="btn" onclick="markDone('${quest.id}')">Marcar como hecho</button>
                <button class="btn btn-delete" onclick="deleteQuest('${quest.id}')">Eliminar</button>
            </div>
        `;
        activeList.appendChild(item);
    });

    state.quests.done.forEach(quest => {
        const item = document.createElement('div');
        item.className = 'quest-item';
        item.innerHTML = `
            <h4>${quest.title}</h4>
            <p>${quest.desc || 'Sin descripción.'}</p>
            <div class="quest-badges">
                <span class="badge" style="background-color: var(--green-primary);">Completado</span>
            </div>
        `;
        doneList.appendChild(item);
    });
}

function renderBadges(state) {
    const badgesRow = document.getElementById('badgesRow');
    badgesRow.innerHTML = '';
    state.user.badges.forEach(badgeId => {
        const badgeData = BADGES[badgeId];
        if (badgeData) {
            const span = document.createElement('span');
            span.className = 'badge';
            span.textContent = badgeData.name;
            badgesRow.appendChild(span);
        }
    });
}

// --- Funciones de interacción del usuario ---

let currentState = loadState();

window.renderAll = function() {
    renderProgress(currentState);
    renderQuests(currentState);
    renderBadges(currentState);
}

window.markDone = function(questId) {
    const questIndex = currentState.quests.active.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
        const [quest] = currentState.quests.active.splice(questIndex, 1);
        currentState.quests.done.push(quest);
        currentState = updateProgress(currentState, quest.xp);
        renderAll();
    }
}

window.deleteQuest = function(questId) {
    if (confirm("¿Estás seguro de que quieres eliminar este reto?")) {
        currentState.quests.active = currentState.quests.active.filter(q => q.id !== questId);
        saveState(currentState);
        renderAll();
    }
}

window.addCustomQuest = function() {
    const title = document.getElementById('qTitle').value;
    const desc = document.getElementById('qDesc').value;
    const xp = parseInt(document.getElementById('qXP').value);

    if (title.trim() === '' || isNaN(xp) || xp < 10) {
        alert("Por favor, introduce un título y un valor de XP válido (mínimo 10).");
        return;
    }

    const newQuest = {
        id: 'custom-' + Date.now(),
        title: title.trim(),
        desc: desc.trim(),
        xp: xp,
        isCustom: true
    };

    currentState.quests.active.push(newQuest);
    currentState = updateProgress(currentState, 0); // Re-evalúa insignias
    saveState(currentState);
    renderAll();
    
    // Limpiar formulario
    document.getElementById('qTitle').value = '';
    document.getElementById('qDesc').value = '';
}

window.shareProgress = function() {
    const level = currentState.user.level;
    const doneCount = currentState.quests.done.length;
    const text = `¡He alcanzado el nivel ${level} y completado ${doneCount} retos en Arranca Ya!! ¡Empieza tu propio negocio y únete al desafío!`;
    if (navigator.share) {
        navigator.share({
            title: 'Mi Progreso en Arranca Ya!',
            text: text,
            url: window.location.href,
        }).then(() => {
            console.log('Contenido compartido con éxito');
        }).catch((error) => {
            console.error('Error al compartir:', error);
        });
    } else {
        // Fallback para navegadores que no soportan la API de Share
        alert(`¡Copia y comparte tu progreso!\n\n${text}`);
    }
}

window.resetAll = function() {
    if (confirm("¿Estás seguro de que quieres reiniciar toda tu gamificación? ¡Perderás todo tu progreso!")) {
        localStorage.removeItem(LS_KEY);
        currentState = loadState(); // Carga el estado inicial
        renderAll();
    }
}

// Llamada inicial para renderizar la página
document.addEventListener('DOMContentLoaded', () => {
    window.renderAll();
    document.getElementById('addQuestBtn').addEventListener('click', window.addCustomQuest);
    document.getElementById('shareBtn').addEventListener('click', window.shareProgress);
    document.getElementById('resetBtn').addEventListener('click', window.resetAll);
});