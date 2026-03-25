/* ===== MESTRE MODE — Combat Tracker ===== */

function showToast(text) {
  const el = document.createElement('div');
  el.className = 'toast-notification';
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove());
  }, 3000);
}

const COMBATE_DEFAULT = { inimigos: [], iniciativas: {}, turnoIdx: -1, ordenado: false };

function saveMestreData(data) {
  if (mestreWs && mestreWs.readyState === WebSocket.OPEN) {
    mestreWs.send(JSON.stringify({ type: 'combate_update', data }));
  } else {
    apiSaveCombate(data).catch(() => {});
  }
}

let mestreData = { ...COMBATE_DEFAULT };
let mestreJogadores = [];
let mestreTurnoIdx = -1;
let mestreOrdenado = [];
let mestreOrdenadoAtivo = false;
let mestreModoAtivo = false;
let mestreWs = null;

function connectWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  mestreWs = new WebSocket(`${proto}//${location.host}`);

  mestreWs.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'combate_sync' && msg.data) {
        mestreData = msg.data;
        mestreTurnoIdx = mestreData.turnoIdx ?? -1;
        mestreOrdenadoAtivo = false;
        renderCombateCards();
      }
      if (msg.type === 'ficha_hp_sync' && msg.nome) {
        const j = mestreJogadores.find(x => x.nome === msg.nome);
        if (j) {
          if (msg.pv) { j.pvAtual = msg.pv.atual; j.pvMax = msg.pv.maximo; }
          if (msg.pm) { j.pmAtual = msg.pm.atual; j.pmMax = msg.pm.maximo; }
          renderCombateCards();
          showToast(`PV/PM de ${msg.nome} atualizado`);
        }
      }
      if (msg.type === 'mestre_hp_sync' && msg.nome) {
        const j = mestreJogadores.find(x => x.nome === msg.nome);
        if (j) {
          j.pvAtual = msg.pvAtual;
          renderCombateCards();
          showToast(`PV de ${msg.nome} atualizado pelo Mestre`);
        }
      }
    } catch (_) {}
  });

  mestreWs.addEventListener('close', () => {
    setTimeout(connectWebSocket, 2000);
  });

  mestreWs.addEventListener('error', () => {
    mestreWs.close();
  });
}

async function renderMestreCombate() {
  const container = document.getElementById('mestreContainer');
  if (!container) return;

  mestreData = await apiLoadCombate().catch(() => ({ ...COMBATE_DEFAULT }));
  mestreTurnoIdx = mestreData.turnoIdx ?? -1;

  const fichas = await apiFetchFichas();

  mestreJogadores = [];
  for (const nome of fichas) {
    try {
      const f = await apiLoadFicha(nome);
      if (f) {
        let avatar = f.avatar || '';
        try {
          const sfRes = await fetch(`/api/avatar-sem-fundo/${encodeURIComponent(f.nome)}`);
          const sfData = await sfRes.json();
          if (sfData.url) avatar = sfData.url;
        } catch (_) {}
        mestreJogadores.push({
          nome: f.nome,
          pvMax: f.pv ? f.pv.maximo : 0,
          pvAtual: f.pv ? f.pv.atual : 0,
          pmMax: f.pm ? f.pm.maximo : 0,
          pmAtual: f.pm ? f.pm.atual : 0,
          avatar,
          classes: f.classes || [],
          tipo: 'jogador'
        });
      }
    } catch (_) {}
  }

  if (!mestreData.inimigos) mestreData.inimigos = [];
  if (!mestreData.iniciativas) mestreData.iniciativas = {};

  buildMestreHTML(container);
  renderCombateCards();

  const btnModo = document.getElementById('btnModoMestre');
  if (btnModo && !btnModo._listenerAttached) {
    btnModo._listenerAttached = true;
    btnModo.addEventListener('click', () => {
      mestreModoAtivo = !mestreModoAtivo;
      document.body.classList.toggle('modo-mestre-on', mestreModoAtivo);
      btnModo.classList.toggle('active', mestreModoAtivo);
      btnModo.innerHTML = mestreModoAtivo ? '🔓 Modo Mestre' : '🔒 Modo Mestre';
    });
  }

  if (!mestreWs) connectWebSocket();
}

function buildMestreHTML(container) {
  container.innerHTML = `
    <div class="mestre-section">
      <div class="mestre-section-header">
        <h2>Tracker de Combate</h2>
        <div class="mestre-toolbar">
          <button id="btnResetTurno" class="mestre-btn mestre-btn-ghost" title="Resetar Turno">
            <span class="btn-icon">⟲</span> Reset
          </button>
          <button id="btnOrdenarIniciativa" class="mestre-btn mestre-btn-gold" title="Ordenar por Iniciativa">
            <span class="btn-icon">↕</span> Reordenar
          </button>
          <button id="btnProxTurno" class="mestre-btn mestre-btn-primary" title="Próximo Turno">
            <span class="btn-icon">▶</span> Próximo Turno
          </button>
        </div>
      </div>

      <div id="combateCardsWrapper" class="combate-cards-wrapper"></div>

      <button id="btnAddInimigo" class="mestre-btn-add">
        <span class="btn-add-icon">+</span> Adicionar Inimigo
      </button>
    </div>

    <div id="combateMiniOrder" class="combate-mini-order"></div>
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
      avatar: j.avatar || '',
      classes: j.classes || [],
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
      avatar: '',
      tipo: 'inimigo',
      inimigoIdx: i,
      limiarAlerta: ini.limiarAlerta ?? 50,
      limiarCritico: ini.limiarCritico ?? 15
    });
  }

  return rows;
}

function pvPercent(atual, max) {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, (atual / max) * 100));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f43f5e','#84cc16','#a855f7','#14b8a6'];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
    renderMiniOrder([]);
    return;
  }

  let html = '';
  rows.forEach((row, idx) => {
    const isTurno = mestreTurnoIdx >= 0 && idx === mestreTurnoIdx;
    const pct = pvPercent(row.pvAtual, row.pvMax);
    const isJogador = row.tipo === 'jogador';
    let hpStatus = '';
    if (!isJogador) {
      if (pct <= row.limiarCritico) hpStatus = ' combate-card-critico';
      else if (pct <= row.limiarAlerta) hpStatus = ' combate-card-alerta';
    }
    const cardClass = `combate-card ${isJogador ? 'combate-card-jogador' : 'combate-card-inimigo'}${isTurno ? ' combate-card-turno' : ''}${hpStatus}`;

    html += `<div class="${cardClass}" data-combate-idx="${idx}">
      ${isTurno ? '<div class="combate-turno-indicator">▶ TURNO ATUAL</div>' : ''}

      <div class="combate-card-avatar ${row.tipo}">
        ${row.avatar
          ? `<img src="${row.avatar}" class="combate-card-avatar-img">`
          : getInitials(row.nome)}
      </div>

      ${isJogador && row.classes && row.classes.length > 0 && row.classes[0].nome
        ? `<div class="combate-classe-strip">
            <img src="/assets/classes/${row.classes[0].nome.toLowerCase()}.png" class="combate-classe-icon" onerror="this.parentElement.style.display='none'">
          </div>`
        : !isJogador
          ? `<div class="combate-classe-strip inimigo">
              <svg class="combate-classe-icon combate-vilao-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 2.76 1.34 5.2 3.4 6.72L6 22h3l1-2h4l1 2h3l-1.4-5.28C18.66 15.2 20 12.76 20 10c0-4.42-3.58-8-8-8zm-2.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
            </div>`
          : ''}

      <div class="combate-card-top">
        <div class="combate-card-info">
          <div class="combate-card-name-row">
            ${isJogador
              ? `<span class="combate-card-name">${escapeHtml(row.nome)}</span>`
              : `<input type="text" class="combate-card-name-input" value="${escapeHtml(row.nome)}" data-inimigo-nome="${row.inimigoIdx}">`}
          </div>
          <div class="combate-card-meta">
            <span class="combate-tipo-tag ${row.tipo}">${isJogador ? 'Jogador' : 'Inimigo'}</span>
            <div class="combate-card-inic">
              <label>Iniciativa:</label>
              <input type="number" value="${row.iniciativa}" data-iniciativa="${row.id}" data-tipo="${row.tipo}" placeholder="—">
            </div>
          </div>
        </div>
        <div class="combate-bars${!isJogador ? ' combate-bars-inimigo' : ''}">
          <div class="combate-bar combate-bar-hp" data-bar-id="${row.id}" data-tipo="${row.tipo}" data-nome="${escapeHtml(row.nome)}"${!isJogador ? ` data-inimigo-idx="${row.inimigoIdx}"` : ''} data-pv-atual="${row.pvAtual}" data-pv-max="${row.pvMax}" title="Clique para dano/cura">
            <div class="combate-bar-fill hp-fill" style="width:${pct}%"></div>
            <span class="combate-bar-label">${row.pvAtual} / ${row.pvMax}</span>
          </div>
          ${isJogador ? `
          <div class="combate-bar combate-bar-pm">
            <div class="combate-bar-fill pm-fill" style="width:${row.pmMax > 0 ? Math.round((row.pmAtual / row.pmMax) * 100) : 0}%"></div>
            <span class="combate-bar-label">${row.pmAtual} / ${row.pmMax}</span>
          </div>` : ''}
        </div>
        ${!isJogador ? `<button class="combate-card-remove" data-remove-inimigo="${row.inimigoIdx}" title="Remover">✕</button>` : ''}
      </div>
    </div>`;
  });

  wrapper.innerHTML = html;
  attachCombateEvents(wrapper);

  renderMiniOrder(rows);

  if (mestreTurnoIdx >= 0) {
    const turnoCard = wrapper.querySelector('.combate-card-turno');
    if (turnoCard) setTimeout(() => turnoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }
}

function renderMiniOrder(rows) {
  const mini = document.getElementById('combateMiniOrder');
  if (!mini) return;

  if (!rows || rows.length === 0) {
    mini.innerHTML = '';
    mini.style.display = 'none';
    return;
  }

  mini.style.display = '';
  let html = '';
  rows.forEach((row, idx) => {
    const isTurno = mestreTurnoIdx >= 0 && idx === mestreTurnoIdx;
    const cor = getAvatarColor(row.nome);
    html += `<div class="combate-mini-item${isTurno ? ' combate-mini-turno' : ''}">
      <div class="combate-mini-avatar ${row.tipo}" style="background:${cor}20; border-color:${cor}55; color:${cor}">
        ${row.avatar
          ? `<img src="${row.avatar}" class="combate-mini-avatar-img">`
          : getInitials(row.nome)}
      </div>
      <span class="combate-mini-name">${escapeHtml(row.nome)}</span>
    </div>`;
  });
  mini.innerHTML = html;
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

  wrapper.addEventListener('blur', (e) => {
    const el = e.target;

    if (el.dataset.iniciativa) {
      ordenarIniciativa();
      return;
    }

    if (el.dataset.inimigoNome === undefined) return;
    const card = el.closest('.combate-card');
    if (!card) return;
    const nome = el.value || '';
    const avatar = card.querySelector('.combate-card-avatar');
    if (avatar && !avatar.querySelector('.combate-card-avatar-img')) {
      avatar.textContent = getInitials(nome);
    }
  }, true);

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

    const hpBar = e.target.closest('.combate-bar-hp');
    if (hpBar) {
      abrirDanoPopover(hpBar);
    }
  });
}

function updateCardBar(card) {
  if (!card) return;
  const hpBar = card.querySelector('.combate-bar-hp');
  if (!hpBar) return;
  const atual = parseInt(hpBar.dataset.pvAtual) || 0;
  const max = parseInt(hpBar.dataset.pvMax) || 0;
  const pct = pvPercent(atual, max);
  const fill = hpBar.querySelector('.hp-fill');
  if (fill) fill.style.width = pct + '%';
  const label = hpBar.querySelector('.combate-bar-label');
  if (label) label.textContent = `${atual} / ${max}`;

  if (card.classList.contains('combate-card-inimigo')) {
    const idx = parseInt(hpBar.dataset.inimigoIdx);
    const ini = mestreData.inimigos[idx];
    const limAlerta = ini ? (ini.limiarAlerta ?? 50) : 50;
    const limCritico = ini ? (ini.limiarCritico ?? 15) : 15;
    card.classList.remove('combate-card-alerta', 'combate-card-critico');
    if (pct <= limCritico) card.classList.add('combate-card-critico');
    else if (pct <= limAlerta) card.classList.add('combate-card-alerta');
  }
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
  mestreData.inimigos.push({
    nome: `Inimigo ${count}`,
    iniciativa: '',
    pvMax: 10,
    pvAtual: 10,
    limiarAlerta: Math.floor(Math.random() * 21) + 40,
    limiarCritico: Math.floor(Math.random() * 21) + 5
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

async function aplicarHpChange(bar, delta) {
  const pvAtual = parseInt(bar.dataset.pvAtual) || 0;
  const pvMax = parseInt(bar.dataset.pvMax) || 0;
  const novoPv = Math.max(0, Math.min(pvMax, pvAtual + delta));
  bar.dataset.pvAtual = novoPv;

  const tipo = bar.dataset.tipo;
  const nome = bar.dataset.nome;
  const card = bar.closest('.combate-card');

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
    if (mestreWs && mestreWs.readyState === WebSocket.OPEN) {
      mestreWs.send(JSON.stringify({ type: 'mestre_hp_update', nome, pvAtual: novoPv }));
    }
  } else {
    const idx = parseInt(bar.dataset.inimigoIdx);
    if (mestreData.inimigos[idx]) {
      mestreData.inimigos[idx].pvAtual = novoPv;
      saveMestreData(mestreData);
    }
  }

  updateCardBar(card);
}

function abrirDanoPopover(bar) {
  fecharDanoPopover();

  const rect = bar.getBoundingClientRect();

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
    await aplicarHpChange(bar, -val);
    fecharDanoPopover();
  };

  const aplicarCura = async () => {
    const val = parseInt(input.value) || 0;
    if (val <= 0) { fecharDanoPopover(); return; }
    await aplicarHpChange(bar, +val);
    fecharDanoPopover();
  };

  pop.querySelector('#danoSubBtnDano').addEventListener('click', aplicarDano);
  pop.querySelector('#danoSubBtnCura').addEventListener('click', aplicarCura);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') aplicarDano();
    if (e.key === 'Escape') fecharDanoPopover();
  });
}
