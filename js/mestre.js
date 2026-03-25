/* ===== MESTRE MODE — Combat Tracker ===== */

const MESTRE_STORAGE_KEY = 't20_mestre_combate';

function loadMestreData() {
  try {
    const raw = localStorage.getItem(MESTRE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { inimigos: [], iniciativas: {}, turnoIdx: -1, ordenado: false };
}

function saveMestreData(data) {
  localStorage.setItem(MESTRE_STORAGE_KEY, JSON.stringify(data));
}

let mestreData = loadMestreData();
let mestreJogadores = [];
let mestreTurnoIdx = mestreData.turnoIdx ?? -1;
let mestreOrdenado = [];
let mestreOrdenadoAtivo = false;

async function renderMestreCombate() {
  const container = document.getElementById('mestreContainer');
  if (!container) return;

  const fichas = await apiFetchFichas();

  mestreJogadores = [];
  for (const nome of fichas) {
    try {
      const f = await apiLoadFicha(nome);
      if (f) {
        mestreJogadores.push({
          nome: f.nome,
          pvMax: f.pv ? f.pv.maximo : 0,
          pvAtual: f.pv ? f.pv.atual : 0,
          pmMax: f.pm ? f.pm.maximo : 0,
          pmAtual: f.pm ? f.pm.atual : 0,
          tipo: 'jogador'
        });
      }
    } catch (_) {}
  }

  if (!mestreData.inimigos) mestreData.inimigos = [];
  if (!mestreData.iniciativas) mestreData.iniciativas = {};

  buildMestreHTML(container);
  renderCombateCards();
}

function buildMestreHTML(container) {
  container.innerHTML = `
    <div class="mestre-header">
      <h1>⚔ Painel do Mestre</h1>
      <p class="mestre-subtitle">Gerencie o combate e acompanhe a iniciativa dos participantes</p>
    </div>

    <div class="mestre-section">
      <div class="mestre-section-header">
        <h2>Tracker de Combate</h2>
        <div class="mestre-toolbar">
          <button id="btnOrdenarIniciativa" class="mestre-btn mestre-btn-gold" title="Ordenar por Iniciativa">
            <span class="btn-icon">↕</span> Ordenar
          </button>
          <button id="btnProxTurno" class="mestre-btn mestre-btn-blue" title="Próximo Turno">
            <span class="btn-icon">▶</span> Próximo
          </button>
          <button id="btnResetTurno" class="mestre-btn mestre-btn-ghost" title="Resetar Turno">
            <span class="btn-icon">⟲</span> Reset
          </button>
        </div>
      </div>

      <div id="combateCardsWrapper" class="combate-cards-wrapper"></div>

      <button id="btnAddInimigo" class="mestre-btn-add">
        <span class="btn-add-icon">+</span> Adicionar Inimigo
      </button>
    </div>
  `;

  document.getElementById('btnOrdenarIniciativa').addEventListener('click', ordenarIniciativa);
  document.getElementById('btnAddInimigo').addEventListener('click', adicionarInimigo);
  document.getElementById('btnProxTurno').addEventListener('click', proximoTurno);
  document.getElementById('btnResetTurno').addEventListener('click', resetTurno);
}

function buildCombateRows() {
  const rows = [];

  for (const j of mestreJogadores) {
    rows.push({
      id: 'jogador_' + j.nome,
      nome: j.nome,
      iniciativa: mestreData.iniciativas[j.nome] ?? '',
      pvAtual: j.pvAtual,
      pvMax: j.pvMax,
      pmAtual: j.pmAtual,
      pmMax: j.pmMax,
      tipo: 'jogador'
    });
  }

  for (let i = 0; i < mestreData.inimigos.length; i++) {
    const ini = mestreData.inimigos[i];
    rows.push({
      id: 'inimigo_' + i,
      nome: ini.nome,
      iniciativa: ini.iniciativa ?? '',
      pvAtual: ini.pvAtual || 0,
      pvMax: ini.pvMax || 0,
      tipo: 'inimigo',
      inimigoIdx: i
    });
  }

  return rows;
}

function pvPercent(atual, max) {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, (atual / max) * 100));
}

function pvBarColor(pct) {
  if (pct > 60) return '#16a34a';
  if (pct > 30) return '#eab308';
  return '#ef4444';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderCombateCards() {
  const wrapper = document.getElementById('combateCardsWrapper');
  if (!wrapper) return;

  let rows;
  if (mestreOrdenadoAtivo && mestreOrdenado.length > 0) {
    rows = refreshOrdenadoRows();
  } else {
    rows = buildCombateRows();
    mestreOrdenado = rows;
  }

  if (rows.length === 0) {
    wrapper.innerHTML = `<div class="combate-empty">
      <span class="combate-empty-icon">🎲</span>
      <p>Nenhum participante no combate ainda.</p>
      <p class="combate-empty-hint">Os personagens salvos aparecerão automaticamente. Use o botão abaixo para adicionar inimigos.</p>
    </div>`;
    return;
  }

  let html = '';
  rows.forEach((row, idx) => {
    const isTurno = mestreTurnoIdx >= 0 && idx === mestreTurnoIdx;
    const pct = pvPercent(row.pvAtual, row.pvMax);
    const barColor = pvBarColor(pct);
    const isJogador = row.tipo === 'jogador';
    const cardClass = `combate-card ${isJogador ? 'combate-card-jogador' : 'combate-card-inimigo'}${isTurno ? ' combate-card-turno' : ''}`;

    html += `<div class="${cardClass}" data-combate-idx="${idx}">
      ${isTurno ? '<div class="combate-turno-indicator">▶ TURNO ATUAL</div>' : ''}

      <div class="combate-card-top">
        <div class="combate-card-left">
          <div class="combate-card-avatar ${row.tipo}">
            ${isJogador ? '🛡' : '💀'}
          </div>
          <div class="combate-card-info">
            <div class="combate-card-name-row">
              ${isJogador
                ? `<span class="combate-card-name">${escapeHtml(row.nome)}</span>`
                : `<input type="text" class="combate-card-name-input" value="${escapeHtml(row.nome)}" data-inimigo-nome="${row.inimigoIdx}">`}
              <span class="combate-tipo-tag ${row.tipo}">${isJogador ? 'Jogador' : 'Inimigo'}</span>
            </div>
            <div class="combate-card-inic">
              <label>Iniciativa</label>
              <input type="number" value="${row.iniciativa}" data-iniciativa="${row.id}" data-tipo="${row.tipo}" placeholder="—">
            </div>
          </div>
        </div>
        <div class="combate-hp-icons">
          <div class="combate-pv-heart" data-heart-id="${row.id}" data-tipo="${row.tipo}" data-nome="${escapeHtml(row.nome)}"${!isJogador ? ` data-inimigo-idx="${row.inimigoIdx}"` : ''} data-pv-atual="${row.pvAtual}" data-pv-max="${row.pvMax}" title="Clique para dano/cura">
            <svg class="heart-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f87171"/>
                  <stop offset="100%" stop-color="#dc2626"/>
                </linearGradient>
              </defs>
              <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" fill="url(#heartGrad)"/>
              <ellipse cx="180" cy="170" rx="40" ry="28" fill="rgba(255,255,255,0.18)" transform="rotate(-25 180 170)"/>
            </svg>
            <span class="heart-val">${row.pvAtual}<span class="heart-sep">/</span>${row.pvMax}</span>
          </div>
          ${isJogador ? `
          <div class="combate-pm-drop">
            <svg class="drop-svg" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#60a5fa"/>
                  <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
              </defs>
              <path d="M192 512C86 512 0 426 0 320c0-77.4 27-99 172.3-309.7c9.5-13.8 29.9-13.8 39.5 0C357 221 384 242.6 384 320c0 106-86 192-192 192z" fill="url(#dropGrad)"/>
              <ellipse cx="140" cy="280" rx="35" ry="50" fill="rgba(255,255,255,0.12)" transform="rotate(-15 140 280)"/>
            </svg>
            <span class="drop-val">${row.pmAtual}<span class="drop-sep">/</span>${row.pmMax}</span>
          </div>` : ''}
        </div>
        <div class="combate-card-right">
          ${!isJogador ? `<button class="combate-card-remove" data-remove-inimigo="${row.inimigoIdx}" title="Remover">✕</button>` : ''}
        </div>
      </div>

      <div class="combate-hp-bar-track">
        <div class="combate-hp-bar-fill" style="width:${pct}%; background:${barColor}"></div>
      </div>
    </div>`;
  });

  wrapper.innerHTML = html;
  attachCombateEvents(wrapper);
}

function attachCombateEvents(wrapper) {
  if (wrapper._eventsAttached) return;
  wrapper._eventsAttached = true;

  wrapper.addEventListener('input', async (e) => {
    const el = e.target;

    if (el.dataset.iniciativa) {
      const id = el.dataset.iniciativa;
      const val = el.value === '' ? '' : (parseInt(el.value) || 0);

      if (el.dataset.tipo === 'jogador') {
        const nome = id.replace('jogador_', '');
        mestreData.iniciativas[nome] = val;
      } else {
        const idx = parseInt(id.replace('inimigo_', ''));
        if (mestreData.inimigos[idx]) mestreData.inimigos[idx].iniciativa = val;
      }
      saveMestreData(mestreData);
    }

    if (el.dataset.inimigoNome !== undefined) {
      const idx = parseInt(el.dataset.inimigoNome);
      if (mestreData.inimigos[idx]) {
        mestreData.inimigos[idx].nome = el.value;
        saveMestreData(mestreData);
      }
    }
  });

  wrapper.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-inimigo]');
    if (btn) {
      const idx = parseInt(btn.dataset.removeInimigo);
      mestreData.inimigos.splice(idx, 1);
      mestreOrdenadoAtivo = false;
      saveMestreData(mestreData);
      renderCombateCards();
      return;
    }

    const heart = e.target.closest('.combate-pv-heart');
    if (heart) {
      abrirDanoPopover(heart);
    }
  });
}

function updateCardBar(card) {
  if (!card) return;
  const heart = card.querySelector('.combate-pv-heart');
  if (!heart) return;
  const atual = parseInt(heart.dataset.pvAtual) || 0;
  const max = parseInt(heart.dataset.pvMax) || 0;
  const pct = pvPercent(atual, max);
  const bar = card.querySelector('.combate-hp-bar-fill');
  if (bar) {
    bar.style.width = pct + '%';
    bar.style.background = pvBarColor(pct);
  }
  const valSpan = heart.querySelector('.heart-val');
  if (valSpan) valSpan.innerHTML = `${atual}<span class="heart-sep">/</span>${max}`;
}

function refreshOrdenadoRows() {
  return mestreOrdenado.map(entry => {
    if (entry.tipo === 'jogador') {
      const j = mestreJogadores.find(x => x.nome === entry.nome);
      if (!j) return null;
      return {
        ...entry,
        iniciativa: mestreData.iniciativas[j.nome] ?? '',
        pvAtual: j.pvAtual,
        pvMax: j.pvMax,
        pmAtual: j.pmAtual,
        pmMax: j.pmMax
      };
    } else {
      const ini = mestreData.inimigos.find(x => x.nome === entry.nome);
      if (!ini) return null;
      const idx = mestreData.inimigos.indexOf(ini);
      return {
        ...entry,
        iniciativa: ini.iniciativa ?? '',
        pvAtual: ini.pvAtual || 0,
        pvMax: ini.pvMax || 0,
        inimigoIdx: idx
      };
    }
  }).filter(Boolean);
}

function ordenarIniciativa() {
  const rows = buildCombateRows();
  rows.sort((a, b) => {
    const aVal = a.iniciativa === '' ? -Infinity : a.iniciativa;
    const bVal = b.iniciativa === '' ? -Infinity : b.iniciativa;
    return bVal - aVal;
  });

  mestreOrdenado = rows;
  mestreOrdenadoAtivo = true;
  mestreTurnoIdx = rows.length > 0 ? 0 : -1;
  mestreData.turnoIdx = mestreTurnoIdx;
  saveMestreData(mestreData);

  renderCombateCards();
}

function adicionarInimigo() {
  const count = mestreData.inimigos.length + 1;
  const nomeInput = prompt('Nome do inimigo:', `Inimigo ${count}`);
  if (nomeInput === null) return;
  const pvInput = prompt('PV Máximo:', '10');
  if (pvInput === null) return;
  const pvMax = Math.max(1, parseInt(pvInput) || 10);
  mestreData.inimigos.push({
    nome: nomeInput || `Inimigo ${count}`,
    iniciativa: '',
    pvMax: pvMax,
    pvAtual: pvMax
  });
  mestreOrdenadoAtivo = false;
  saveMestreData(mestreData);
  renderCombateCards();
}

function proximoTurno() {
  const total = mestreJogadores.length + mestreData.inimigos.length;
  if (total === 0) return;

  if (mestreTurnoIdx < 0) {
    mestreTurnoIdx = 0;
  } else {
    mestreTurnoIdx = (mestreTurnoIdx + 1) % total;
  }
  mestreData.turnoIdx = mestreTurnoIdx;
  saveMestreData(mestreData);
  renderCombateCards();
}

function resetTurno() {
  mestreTurnoIdx = -1;
  mestreData.turnoIdx = -1;
  mestreOrdenadoAtivo = false;
  saveMestreData(mestreData);
  renderCombateCards();
}

function fecharDanoPopover() {
  const old = document.querySelector('.combate-dano-popover');
  if (old) old.remove();
  const oldOverlay = document.querySelector('.combate-dano-overlay');
  if (oldOverlay) oldOverlay.remove();
}

async function aplicarHpChange(heart, delta) {
  const pvAtual = parseInt(heart.dataset.pvAtual) || 0;
  const pvMax = parseInt(heart.dataset.pvMax) || 0;
  const novoPv = Math.max(0, Math.min(pvMax, pvAtual + delta));
  heart.dataset.pvAtual = novoPv;

  const tipo = heart.dataset.tipo;
  const nome = heart.dataset.nome;
  const card = heart.closest('.combate-card');

  if (tipo === 'jogador') {
    const jogador = mestreJogadores.find(j => j.nome === nome);
    if (jogador) jogador.pvAtual = novoPv;
    try {
      const fichaData = await apiLoadFicha(nome);
      if (fichaData && fichaData.pv) {
        fichaData.pv.atual = novoPv;
        await apiSaveFicha(nome, fichaData);
      }
    } catch (_) {}
  } else {
    const idx = parseInt(heart.dataset.inimigoIdx);
    if (mestreData.inimigos[idx]) {
      mestreData.inimigos[idx].pvAtual = novoPv;
      saveMestreData(mestreData);
    }
  }

  updateCardBar(card);
}

function abrirDanoPopover(heart) {
  fecharDanoPopover();

  const rect = heart.getBoundingClientRect();

  const overlay = document.createElement('div');
  overlay.className = 'combate-dano-overlay';
  overlay.addEventListener('click', fecharDanoPopover);
  document.body.appendChild(overlay);

  const pop = document.createElement('div');
  pop.className = 'combate-dano-popover';
  pop.innerHTML = `
    <label>Alterar PV:</label>
    <div class="combate-dano-row">
      <input type="number" id="danoSubInput" min="0" placeholder="0" autofocus>
    </div>
    <div class="combate-dano-actions">
      <button id="danoSubBtnDano" class="combate-dano-btn combate-dano-btn-dano" title="Subtrair">− Dano</button>
      <button id="danoSubBtnCura" class="combate-dano-btn combate-dano-btn-cura" title="Curar">+ Cura</button>
    </div>
  `;
  document.body.appendChild(pop);

  const popW = pop.offsetWidth;
  const popH = pop.offsetHeight;
  let top = rect.bottom + 6;
  let left = rect.left + rect.width / 2 - popW / 2;
  if (left < 8) left = 8;
  if (left + popW > window.innerWidth - 8) left = window.innerWidth - 8 - popW;
  if (top + popH > window.innerHeight - 8) top = rect.top - popH - 6;
  pop.style.top = top + 'px';
  pop.style.left = left + 'px';

  const input = pop.querySelector('#danoSubInput');
  setTimeout(() => input.focus(), 50);

  const aplicarDano = async () => {
    const val = parseInt(input.value) || 0;
    if (val <= 0) { fecharDanoPopover(); return; }
    await aplicarHpChange(heart, -val);
    fecharDanoPopover();
  };

  const aplicarCura = async () => {
    const val = parseInt(input.value) || 0;
    if (val <= 0) { fecharDanoPopover(); return; }
    await aplicarHpChange(heart, +val);
    fecharDanoPopover();
  };

  pop.querySelector('#danoSubBtnDano').addEventListener('click', aplicarDano);
  pop.querySelector('#danoSubBtnCura').addEventListener('click', aplicarCura);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') aplicarDano();
    if (e.key === 'Escape') fecharDanoPopover();
  });
}
