// =============== ARRANCA YA! Gamificación (cliente) ===============
(function () {
  const LS_KEY = 'gy_state_v1';

  const DEFAULT_STATE = {
    xp: 0,
    level: 1,
    streak: 0,
    lastOpenDate: null,
    badges: [],
    quests: {
      primer_login: { title: 'Primer ingreso', desc: 'Explora la plataforma.', xp: 50, done: false },
      completa_cuestionario: { title: 'Define tu perfil', desc: 'Completa el cuestionario de cursos.', xp: 100, done: false },
      registra_primera_venta: { title: 'Primera venta', desc: 'Emite tu primer ticket en Histórico.', xp: 120, done: false },
      envia_pregunta_asistente: { title: 'Habla con Sparkia', desc: 'Envía una pregunta en el Asistente.', xp: 60, done: false },
      agenda_asesoria: { title: 'Agenda asesoría', desc: 'Envía el formulario de Asesoría.', xp: 80, done: false }
    }
  };

  // Utilidad
  const todayStr = () => new Date().toISOString().slice(0,10);

  const Gy = {
    state: { ...DEFAULT_STATE },

    load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        this.state = raw ? JSON.parse(raw) : { ...DEFAULT_STATE };
      } catch {
        this.state = { ...DEFAULT_STATE };
      }
    },

    save() { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); },

    addXP(amount, reason = '') {
      if (!amount) return;
      this.state.xp += amount;
      const newLevel = 1 + Math.floor(this.state.xp / 200);
      if (newLevel > this.state.level) {
        this.state.level = newLevel;
        this.toast(`🎉 ¡Subiste a nivel ${newLevel}!`);
      }
      this.save();
      this.renderPill();
      this.log(`+${amount} XP ${reason ? `(${reason})` : ''}`);
    },

    completeQuest(key) {
      const q = this.state.quests[key];
      if (!q || q.done) return;
      q.done = true;
      this.addXP(q.xp, `quest:${key}`);
      if (!this.state.badges.includes(key)) this.state.badges.push(key);
      this.save();
      this.renderModal(); // actualiza listado
      this.toast(`🏆 ¡Reto completado: ${q.title}! +${q.xp} XP`);
    },

    // Racha diaria por abrir la web
    updateStreak() {
      const last = this.state.lastOpenDate;
      const today = todayStr();
      if (!last) {
        this.state.streak = 1;
      } else {
        const d1 = new Date(last);
        const d2 = new Date(today);
        const diff = Math.round((d2 - d1) / (1000*60*60*24));
        if (diff === 1) this.state.streak += 1;
        else if (diff > 1) this.state.streak = 1;
      }
      this.state.lastOpenDate = today;
      this.save();
    },

    // UI ------------------------------------------------------------
    ensureStyles() {
      if (document.getElementById('gy-styles')) return;
      const s = document.createElement('style');
      s.id = 'gy-styles';
      s.textContent = `
        .gy-pill{
          position:fixed; top:14px; right:14px; z-index:9999;
          background:#388E3C; color:#fff; padding:8px 12px; border-radius:999px;
          font:600 12px/1.2 'Poppins', sans-serif; box-shadow:0 2px 10px rgba(0,0,0,.12);
          display:flex; align-items:center; gap:10px; cursor:pointer;
        }
        .gy-pill span{opacity:.95}
        .gy-modal-backdrop{
          position:fixed; inset:0; background:rgba(0,0,0,.35); display:none; z-index:9998;
        }
        .gy-modal{
          position:fixed; right:16px; top:56px; width:320px; max-width:92vw; z-index:9999;
          background:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.18);
          padding:14px;
          display:none;
          font-family:'Poppins', sans-serif;
        }
        .gy-modal h3{margin:6px 0 12px; color:#388E3C; font-size:18px}
        .gy-quest{border:1px solid #E8F5E9; border-radius:10px; padding:10px; margin:8px 0}
        .gy-quest h4{margin:0 0 6px; font-size:14px; color:#212121}
        .gy-quest p{margin:0 0 8px; font-size:12px; color:#555}
        .gy-badge{display:inline-block; background:#E8F5E9; color:#388E3C; padding:4px 8px; border-radius:999px; font-size:11px; margin:4px 6px 0 0}
        .gy-muted{color:#777; font-size:12px}
        .gy-btn{
          background:#388E3C; color:#fff; border:0; border-radius:999px; padding:6px 10px; font-weight:600; cursor:pointer;
        }
      `;
      document.head.appendChild(s);
    },

    renderPill() {
      let el = document.getElementById('gy-pill');
      if (!el) {
        el = document.createElement('div');
        el.id = 'gy-pill';
        el.className = 'gy-pill';
        el.onclick = () => this.toggleModal();
        document.body.appendChild(el);
      }
      el.innerHTML = `⭐ <span>${this.state.xp} XP</span> · 🔥 <span>${this.state.streak}</span> · 🏅 <span>Nv ${this.state.level}</span>`;
    },

    renderModal() {
      let m = document.getElementById('gy-modal');
      let b = document.getElementById('gy-backdrop');
      if (!m) {
        b = document.createElement('div'); b.id = 'gy-backdrop'; b.className = 'gy-modal-backdrop'; b.onclick = () => this.toggleModal(false);
        m = document.createElement('div'); m.id = 'gy-modal'; m.className = 'gy-modal';
        document.body.appendChild(b); document.body.appendChild(m);
      }
      const questsHtml = Object.entries(this.state.quests).map(([k,q]) => `
        <div class="gy-quest">
          <h4>${q.title} ${q.done ? '✅' : ''}</h4>
          <p>${q.desc}</p>
          <div class="gy-muted">Recompensa: +${q.xp} XP</div>
          ${q.done ? '<span class="gy-badge">Completado</span>' : `<button class="gy-btn" data-claim="${k}">Marcar hecho</button>`}
        </div>
      `).join('');
      const badgesHtml = this.state.badges.map(b => `<span class="gy-badge">${this.state.quests[b]?.title || b}</span>`).join('');
      m.innerHTML = `
        <h3>Retos & Recompensas</h3>
        ${questsHtml}
        <h4 style="margin:10px 0 6px">Insignias</h4>
        <div>${badgesHtml || '<span class="gy-muted">Aún no tienes insignias.</span>'}</div>
      `;
      // Delegación de clicks para "Marcar hecho"
      m.querySelectorAll('[data-claim]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-claim');
          this.completeQuest(key);
        });
      });
    },

    toggleModal(force) {
      const m = document.getElementById('gy-modal');
      const b = document.getElementById('gy-backdrop');
      if (!m || !b) return;
      const show = typeof force === 'boolean' ? force : (m.style.display !== 'block');
      m.style.display = show ? 'block' : 'none';
      b.style.display = show ? 'block' : 'none';
    },

    toast(msg) {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed; bottom:16px; left:50%; transform:translateX(-50%); background:#388E3C; color:#fff; padding:10px 14px; border-radius:10px; font:600 13px Poppins; box-shadow:0 6px 20px rgba(0,0,0,.16); z-index:9999;';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    },

    log(msg){ try{ console.debug('[GY]', msg);}catch{} },

    // Inicialización en cada página
    init() {
      this.load();
      this.updateStreak();
      this.ensureStyles();
      this.renderPill();
      this.renderModal();
      // Bonus de primer ingreso
      if (!this.state.quests.primer_login.done) {
        this.completeQuest('primer_login');
      }
      // Auto-integraciones por página (opcionales)
      this.autoWire();
    },

    // Detecta elementos comunes y se "engancha"
    autoWire() {
      // Si hay un <video> en asistente.html, da XP al reproducir 10s
      const video = document.querySelector('video');
      if (video) {
        let t = 0, awarded = false;
        video.addEventListener('timeupdate', () => {
          if (!awarded) {
            t = video.currentTime;
            if (t >= 10) { this.addXP(40, 'ver_video'); awarded = true; }
          }
        });
      }
    }
  };

  // Exponer API sencilla para que las páginas la llamen
  window.Gy = {
    init: () => Gy.init(),
    addXP: (n, reason) => Gy.addXP(n, reason),
    completeQuest: k => Gy.completeQuest(k)
  };

  // Arranca cuando el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Gy.init());
  } else {
    Gy.init();
  }
})();
