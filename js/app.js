let ficha = null;
let fichaOriginalNome = '';
let saveTimeout = null;
let appWs = null;

function connectAppWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  appWs = new WebSocket(`${proto}://${location.host}`);
  appWs.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'mestre_hp_sync' && msg.nome && ficha && msg.nome === ficha.nome) {
        ficha.pv.atual = msg.pvAtual;
        renderVidaMana();
        showToast('PV atualizado pelo Mestre');
      }
    } catch (_) {}
  });
  appWs.addEventListener('close', () => { setTimeout(connectAppWs, 2000); });
  appWs.addEventListener('error', () => { appWs.close(); });
}

function sendFichaHpUpdate() {
  if (appWs && appWs.readyState === WebSocket.OPEN && ficha) {
    appWs.send(JSON.stringify({
      type: 'ficha_hp_update',
      nome: ficha.nome,
      pv: { atual: ficha.pv.atual, maximo: ficha.pv.maximo },
      pm: { atual: ficha.pm.atual, maximo: ficha.pm.maximo }
    }));
  }
}

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

// ==================== SAVE / LOAD ====================
function scheduleSave() {
  clearTimeout(saveTimeout);
  setSaveStatus('saving');
  saveTimeout = setTimeout(async () => {
    try {
      const nomeAtual = ficha.nome || 'Novo Personagem';
      if (fichaOriginalNome && fichaOriginalNome !== nomeAtual) {
        await apiRenomear(fichaOriginalNome, nomeAtual);
        fichaOriginalNome = nomeAtual;
      }
      await apiSaveFicha(nomeAtual, ficha);
      setSaveStatus('saved');
      refreshSelect(nomeAtual);
      sendFichaHpUpdate();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      setSaveStatus('error');
    }
  }, 800);
}

function setSaveStatus(status) {
  const el = document.getElementById('saveStatus');
  el.className = status;
  if (status === 'saving') el.textContent = 'Salvando...';
  else if (status === 'saved') el.textContent = 'Salvo';
  else if (status === 'error') el.textContent = 'Erro ao salvar';
}

async function refreshSelect(selectNome) {
  const sel = document.getElementById('selectPersonagem');
  const fichas = await apiFetchFichas();
  sel.innerHTML = '';
  fichas.forEach(nome => {
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    if (nome === selectNome) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function loadFicha(nome) {
  const data = await apiLoadFicha(nome);
  if (!data) return;
  ficha = data;
  fichaOriginalNome = nome;
  renderFicha();
  const url = new URL(window.location);
  url.searchParams.set('char', nome);
  history.replaceState(null, '', url);
}

async function novoPersonagem() {
  const nome = prompt('Nome do novo personagem:');
  if (!nome || !nome.trim()) return;
  ficha = criarFichaVazia(nome.trim());
  fichaOriginalNome = nome.trim();
  await apiSaveFicha(ficha.nome, ficha);
  await refreshSelect(ficha.nome);
  renderFicha();
}

async function excluirPersonagem() {
  if (!ficha) return;
  if (!confirm(`Excluir "${ficha.nome}"?`)) return;
  await apiDeleteFicha(fichaOriginalNome);
  const fichas = await apiFetchFichas();
  if (fichas.length > 0) {
    await refreshSelect(fichas[0]);
    await loadFicha(fichas[0]);
  } else {
    ficha = criarFichaVazia('Novo Personagem');
    fichaOriginalNome = ficha.nome;
    await apiSaveFicha(ficha.nome, ficha);
    await refreshSelect(ficha.nome);
    renderFicha();
  }
}

// ==================== RENDER COMPLETO ====================
function renderFicha() {
  if (!ficha) return;

  document.getElementById('campoNome').value = ficha.nome || '';

  const avatarImg = document.getElementById('avatarImg');
  const avatarPlaceholder = document.getElementById('avatarPlaceholder');
  if (ficha.avatar) {
    avatarImg.src = ficha.avatar;
    avatarImg.style.display = 'block';
    avatarPlaceholder.style.display = 'none';
  } else {
    avatarImg.src = '';
    avatarImg.style.display = 'none';
    avatarPlaceholder.style.display = '';
  }

  document.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    if (el.tagName === 'SELECT') el.value = ficha[key] || '';
    else if (el.tagName === 'TEXTAREA') el.value = ficha[key] || '';
    else if (el.type === 'number') el.value = ficha[key] ?? '';
    else el.value = ficha[key] || '';
  });

  if (!ficha.buffs) ficha.buffs = [];
  ficha.buffs.forEach(b => {
    if (b.tipo === 'dano') {
      b.tipo = isNaN(b.valor) ? 'dano_extra' : 'dano_fixo';
    }
  });
  if (ficha.pvTemporario === undefined) ficha.pvTemporario = 0;
  if (ficha.pmTemporario === undefined) ficha.pmTemporario = 0;
  if (!ficha.secoesFechadas) ficha.secoesFechadas = {};
  if (!ficha.equipados) ficha.equipados = [{ nome: '' }, { nome: '' }, { nome: '' }, { nome: '' }];

  renderClasses();
  renderAtributos();
  renderVidaMana();
  renderDefesa();
  renderBuffs();
  renderAtaques();
  renderPericias();
  renderHabilidades();
  renderMagias();
  renderInventario();
  renderEquipados();
  renderProgressao();
  renderMoedas();
  renderCalculados();
  aplicarCollapseState();

  if (!ficha.animacaoAtaque) ficha.animacaoAtaque = 'personagem';
  const selAnim = document.getElementById('selectAnimacao');
  if (selAnim) selAnim.value = ficha.animacaoAtaque;

  if (!ficha.secoesOcultas) ficha.secoesOcultas = {};
  if (!ficha.logs) ficha.logs = [];
  renderSecVisPanel();
  aplicarSecVisibility();
  renderLogs();
}

const SEC_NOMES = {
  secCabecalho: 'Info Básica',
  secAtributos: 'Atributos & Defesa',
  secVidaMana: 'Vida / Mana',
  secBuffs: 'Buffs',
  secAtaques: 'Ataques',
  secHabilidades: 'Habilidades & Poderes',
  secMagias: 'Magias',
  secInventario: 'Inventário',
  secProficiencias: 'Proficiências',
  secEfeitos: 'Efeitos Temporários'
};

function renderSecVisPanel() {
  const panel = document.getElementById('secVisPanel');
  const ocultas = ficha.secoesOcultas || {};
  panel.innerHTML = Object.entries(SEC_NOMES).map(([id, nome]) =>
    `<label class="secvis-item"><input type="checkbox" data-secvis="${id}" ${!ocultas[id] ? 'checked' : ''}> ${nome}</label>`
  ).join('');
}

function aplicarSecVisibility() {
  const ocultas = ficha.secoesOcultas || {};
  Object.keys(SEC_NOMES).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (ocultas[id]) el.classList.add('sec-hidden');
    else el.classList.remove('sec-hidden');
  });
  document.querySelectorAll('.section-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const id = href.slice(1);
    if (ocultas[id]) a.style.display = 'none';
    else a.style.display = '';
  });
}

function aplicarCollapseState() {
  const fechadas = ficha.secoesFechadas || {};
  document.querySelectorAll('.ficha-section[id]').forEach(sec => {
    if (fechadas[sec.id]) {
      sec.classList.add('collapsed');
    } else {
      sec.classList.remove('collapsed');
    }
  });
}

// ==================== CLASSES ====================
function migrateClasses() {
  if (!ficha.classes) {
    ficha.classes = [{ nome: ficha.classe || '', nivel: ficha.nivel || 1 }];
    delete ficha.classe;
    delete ficha.nivel;
  }
}

function renderClasses() {
  migrateClasses();
  const container = document.getElementById('classesLista');
  container.innerHTML = '';

  ficha.classes.forEach((cls, idx) => {
    const div = document.createElement('div');
    div.className = 'classe-item';
    div.innerHTML = `
      <input type="text" class="classe-nome-input" value="${escapeHtml(cls.nome)}" data-classe-nome="${idx}" placeholder="Nome da classe">
      <label class="classe-lvl-label">Nv.</label>
      <input type="number" class="classe-nivel-input" value="${cls.nivel || 1}" data-classe-nivel="${idx}" min="1" max="20">
      <button class="btn-remove classe-remove" data-classe-remove="${idx}" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  });

  document.getElementById('nivelTotalDisplay').textContent = getNivelTotal(ficha);

  const icone = document.getElementById('classeIcone');
  if (icone) {
    const primeiraClasse = ficha.classes && ficha.classes.length > 0 ? ficha.classes[0].nome : '';
    if (primeiraClasse) {
      icone.src = `/assets/classes/${primeiraClasse.toLowerCase()}.png`;
      icone.style.display = '';
      icone.onerror = () => { icone.style.display = 'none'; };
    } else {
      icone.style.display = 'none';
    }
  }
}

// ==================== ATRIBUTOS ====================
function renderAtributos() {
  Object.keys(ATRIBUTOS_NOME).forEach(attr => {
    const el = document.querySelector(`[data-display="${attr}"]`);
    if (!el) return;
    const base = ficha.atributos[attr] || 0;
    const efetivo = getAtributoEfetivo(ficha, attr);
    if (efetivo !== base) {
      el.textContent = `${formatMod(efetivo)} (${formatMod(base)})`;
      el.classList.add('attr-buffed');
    } else {
      el.textContent = formatMod(base);
      el.classList.remove('attr-buffed');
    }
  });
}

function startEditAtributo(attr) {
  const card = document.querySelector(`.atributo-card[data-attr="${attr}"]`);
  const display = card.querySelector('.attr-value');
  const pencil = card.querySelector('.btn-edit-pencil');
  const currentVal = ficha.atributos[attr] || 0;

  const input = document.createElement('input');
  input.type = 'number';
  input.value = currentVal;
  input.className = 'attr-input-edit';

  display.style.display = 'none';
  pencil.style.display = 'none';
  card.insertBefore(input, pencil);
  input.focus();
  input.select();

  function finish() {
    ficha.atributos[attr] = parseInt(input.value) || 0;
    display.style.display = '';
    pencil.style.display = '';
    input.remove();
    renderAtributos();
    renderPericias();
    renderAtaques();
    renderCalculados();
    scheduleSave();
  }

  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = currentVal; input.blur(); }
  });
}

// ==================== PV / PM ====================
function renderVidaMana() {
  const pvTemp = ficha.pvTemporario || 0;
  const pmTemp = ficha.pmTemporario || 0;
  const pvMaxEfetivo = ficha.pv.maximo + pvTemp;
  const pmMaxEfetivo = ficha.pm.maximo + pmTemp;

  document.getElementById('pvMaxDisplay').textContent = pvTemp > 0 ? `${pvMaxEfetivo} (${ficha.pv.maximo}+${pvTemp})` : ficha.pv.maximo;
  document.getElementById('pvAtualDisplay').textContent = ficha.pv.atual;
  document.getElementById('pmMaxDisplay').textContent = pmTemp > 0 ? `${pmMaxEfetivo} (${ficha.pm.maximo}+${pmTemp})` : ficha.pm.maximo;
  document.getElementById('pmAtualDisplay').textContent = ficha.pm.atual;
  const pvTempInput = document.getElementById('pvTempInput');
  const pmTempInput = document.getElementById('pmTempInput');
  if (pvTempInput && pvTempInput !== document.activeElement) pvTempInput.value = pvTemp;
  if (pmTempInput && pmTempInput !== document.activeElement) pmTempInput.value = pmTemp;
  updateBars();
}

function updateBars() {
  const pvMaxEfetivo = ficha.pv.maximo + (ficha.pvTemporario || 0);
  const pmMaxEfetivo = ficha.pm.maximo + (ficha.pmTemporario || 0);
  const pvPct = pvMaxEfetivo > 0 ? Math.max(0, Math.min(100, (ficha.pv.atual / pvMaxEfetivo) * 100)) : 0;
  const pmPct = pmMaxEfetivo > 0 ? Math.max(0, Math.min(100, (ficha.pm.atual / pmMaxEfetivo) * 100)) : 0;
  document.getElementById('pvBar').style.width = pvPct + '%';
  document.getElementById('pmBar').style.width = pmPct + '%';
}

function startEditVM(field) {
  let displayEl, currentVal;
  if (field === 'pv-max') { displayEl = document.getElementById('pvMaxDisplay'); currentVal = ficha.pv.maximo; }
  else if (field === 'pv-atual') { displayEl = document.getElementById('pvAtualDisplay'); currentVal = ficha.pv.atual; }
  else if (field === 'pm-max') { displayEl = document.getElementById('pmMaxDisplay'); currentVal = ficha.pm.maximo; }
  else if (field === 'pm-atual') { displayEl = document.getElementById('pmAtualDisplay'); currentVal = ficha.pm.atual; }

  const input = document.createElement('input');
  input.type = 'number';
  input.value = currentVal;
  input.className = 'attr-input-edit';
  input.style.width = '60px';
  input.style.fontSize = '1rem';

  displayEl.style.display = 'none';
  displayEl.parentElement.insertBefore(input, displayEl.nextSibling);
  input.focus();
  input.select();

  function finish() {
    const val = parseInt(input.value) || 0;
    if (field === 'pv-max') ficha.pv.maximo = val;
    else if (field === 'pv-atual') ficha.pv.atual = val;
    else if (field === 'pm-max') ficha.pm.maximo = val;
    else if (field === 'pm-atual') ficha.pm.atual = val;
    displayEl.style.display = '';
    input.remove();
    renderVidaMana();
    scheduleSave();
  }

  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = currentVal; input.blur(); }
  });
}

function incVM(type) {
  const temp = type === 'pv' ? (ficha.pvTemporario || 0) : (ficha.pmTemporario || 0);
  ficha[type].atual = Math.min(ficha[type].atual + 1, ficha[type].maximo + temp);
  renderVidaMana();
  scheduleSave();
}

function decVM(type) {
  ficha[type].atual = Math.max(ficha[type].atual - 1, 0);
  renderVidaMana();
  scheduleSave();
}

function resetVidaMana() {
  const pvTemp = ficha.pvTemporario || 0;
  const pmTemp = ficha.pmTemporario || 0;
  ficha.pv.atual = ficha.pv.maximo + pvTemp;
  ficha.pm.atual = ficha.pm.maximo + pmTemp;
  renderVidaMana();
  scheduleSave();
}

// ==================== DEFESA ====================
function renderDefesa() {
  const container = document.getElementById('defesaItens');
  container.innerHTML = '<div class="defesa-item defesa-base"><span class="defesa-item-nome">Base</span><span class="defesa-item-valor">10</span></div>';

  ficha.defesa.itens.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'defesa-item';
    div.innerHTML = `
      <input type="text" value="${escapeHtml(item.nome)}" placeholder="Nome" data-defesa-nome="${idx}">
      <input type="number" value="${item.valor || 0}" data-defesa-valor="${idx}" title="Bônus de Defesa">
      <span class="pen-label">Pen:</span>
      <input type="number" class="pen-input" value="${item.penalidade || 0}" data-defesa-pen="${idx}" title="Penalidade de Armadura (negativo)">
      <button class="btn-remove" data-defesa-remove="${idx}" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  });

  document.getElementById('defesaTotalDisplay').textContent = calcDefesaTotal(ficha);
}

function addDefesaItem() {
  ficha.defesa.itens.push({ nome: '', valor: 0, penalidade: 0 });
  renderDefesa();
  scheduleSave();
}

// ==================== BUFFS ====================
const BUFF_TIPOS = {
  teste_ataque: 'Teste de Ataque',
  dano_extra: 'Dano Extra',
  dano_fixo: 'Dano Fixo',
  atributo: 'Atributo',
  vida: 'Vida',
  mana: 'Mana',
  pericia: 'Perícia'
};

function renderBuffs() {
  const container = document.getElementById('buffsLista');
  container.innerHTML = '';

  ficha.buffs.forEach((buff, idx) => {
    const tipoOptions = Object.entries(BUFF_TIPOS).map(([k, v]) =>
      `<option value="${k}" ${buff.tipo === k ? 'selected' : ''}>${v}</option>`
    ).join('');

    let extraSelectHtml = '';
    if (buff.tipo === 'pericia') {
      const periciaOpts = PERICIAS_CONFIG.map(p =>
        `<option value="${p.id}" ${buff.periciaId === p.id ? 'selected' : ''}>${p.nome}</option>`
      ).join('');
      extraSelectHtml = `<select class="buff-pericia-sel" data-buff-pericia="${idx}">${periciaOpts}</select>`;
    } else if (buff.tipo === 'atributo') {
      const attrOpts = Object.entries(ATRIBUTOS_NOME).map(([k, v]) =>
        `<option value="${k}" ${buff.atributoId === k ? 'selected' : ''}>${v}</option>`
      ).join('');
      extraSelectHtml = `<select class="buff-pericia-sel" data-buff-atributo="${idx}">${attrOpts}</select>`;
    }

    const div = document.createElement('div');
    div.className = 'buff-card' + (buff.ativo ? ' buff-ativo' : '');
    div.innerHTML = `
      <input type="text" class="buff-nome" value="${escapeHtml(buff.nome)}" data-buff-nome="${idx}" placeholder="Nome do buff">
      <select class="buff-tipo-sel" data-buff-tipo="${idx}">${tipoOptions}</select>
      ${extraSelectHtml}
      <input type="text" class="buff-valor" value="${escapeHtml(String(buff.valor ?? ''))}" data-buff-valor="${idx}" placeholder="1d6 ou 2">
      <div class="buff-pm-field">
        <span class="buff-pm-label">PM:</span>
        <input type="number" class="buff-pm" value="${buff.pm || 0}" data-buff-pm="${idx}" min="0">
      </div>
      <button class="buff-toggle ${buff.ativo ? 'buff-toggle-on' : ''}" data-buff-toggle="${idx}" title="${buff.ativo ? 'Desativar' : 'Ativar'}">
        ${buff.ativo ? '&#9679;' : '&#9675;'}
      </button>
      <button class="btn-remove-sm" data-buff-remove="${idx}" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  });
}

function toggleBuff(idx) {
  const buff = ficha.buffs[idx];
  if (!buff) return;

  const tipoLabel = BUFF_TIPOS[buff.tipo] || buff.tipo;
  let alvoLabel = '';
  if (buff.tipo === 'pericia') {
    const pc = PERICIAS_CONFIG.find(p => p.id === buff.periciaId);
    alvoLabel = pc ? pc.nome : buff.periciaId;
  } else if (buff.tipo === 'atributo') {
    alvoLabel = ATRIBUTOS_NOME[buff.atributoId] || buff.atributoId;
  }

  if (!buff.ativo) {
    buff.ativo = true;
    if (buff.pm > 0) {
      ficha.pm.atual = Math.max(0, ficha.pm.atual - buff.pm);
    }
    if (buff.tipo === 'vida') {
      ficha.pvTemporario = (ficha.pvTemporario || 0) + (parseInt(buff.valor) || 0);
    } else if (buff.tipo === 'mana') {
      ficha.pmTemporario = (ficha.pmTemporario || 0) + (parseInt(buff.valor) || 0);
    }
    addLog({ tipo: 'buff_on', nome: buff.nome || 'Buff', pmGasto: parseInt(buff.pm) || 0, detalhes: { tipoBuff: tipoLabel, alvo: alvoLabel, valor: buff.valor } });
  } else {
    buff.ativo = false;
    if (buff.tipo === 'vida') {
      ficha.pvTemporario = Math.max(0, (ficha.pvTemporario || 0) - (parseInt(buff.valor) || 0));
    } else if (buff.tipo === 'mana') {
      ficha.pmTemporario = Math.max(0, (ficha.pmTemporario || 0) - (parseInt(buff.valor) || 0));
    }
    addLog({ tipo: 'buff_off', nome: buff.nome || 'Buff', pmGasto: 0, detalhes: { tipoBuff: tipoLabel, alvo: alvoLabel, valor: buff.valor } });
  }

  renderBuffs();
  renderAtributos();
  renderVidaMana();
  renderAtaques();
  renderPericias();
  renderCalculados();
  scheduleSave();
}

// ==================== ATAQUES ====================
function calcTesteAtaque(atk) {
  const periciaId = atk.alcanceTipo === 'ranged' ? 'pontaria' : 'luta';
  let total = calcTotalPericia(ficha, periciaId);
  if (atk.bonusExtras) atk.bonusExtras.forEach(b => { total += (parseInt(b.valor) || 0); });
  if (ficha.buffs) ficha.buffs.forEach(b => {
    if (b.ativo && b.tipo === 'teste_ataque') total += (parseInt(b.valor) || 0);
  });
  return total;
}

function calcDanoBonus(atk) {
  const attrKey = atk.danoAtributo || 'for';
  let total = getAtributoEfetivo(ficha, attrKey);
  if (atk.danoExtras) atk.danoExtras.forEach(b => { total += (parseInt(b.valor) || 0); });
  if (ficha.buffs) ficha.buffs.forEach(b => {
    if (b.ativo && b.tipo === 'dano_fixo') total += (parseInt(b.valor) || 0);
  });
  return total;
}

function buildDanoResumo(atk) {
  const parts = [];
  const danoDados = atk.dano || '';
  if (danoDados) parts.push(danoDados);

  const danoBonus = calcDanoBonus(atk);

  const extraDice = [];
  if (atk.danoExtras) atk.danoExtras.forEach(b => {
    const v = String(b.valor || '');
    if (v && isNaN(v)) extraDice.push(v);
  });
  if (ficha.buffs) ficha.buffs.forEach(b => {
    if (b.ativo && b.tipo === 'dano_extra') {
      const v = String(b.valor || '');
      if (v) extraDice.push(v);
    }
  });
  extraDice.forEach(d => parts.push(d));

  if (danoBonus !== 0 || parts.length === 0) {
    parts.push(danoBonus >= 0 && parts.length > 0 ? `+${danoBonus}` : formatMod(danoBonus));
  }

  return parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
}

function calcPMTotal(atk) {
  let total = parseInt(atk.custoPM) || 0;
  if (atk.bonusExtras) atk.bonusExtras.forEach(b => { total += (parseInt(b.pm) || 0); });
  if (atk.danoExtras) atk.danoExtras.forEach(b => { total += (parseInt(b.pm) || 0); });
  return total;
}

function renderAtaquesMini() {
  const container = document.getElementById('ataquesMiniLista');
  if (!container) return;
  const ataques = ficha.ataques || [];
  if (ataques.length === 0) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="ataques-mini-title">Ataques</div>';
  ataques.forEach((atk, idx) => {
    const nome = atk.nome || 'Sem nome';
    const teste = calcTesteAtaque(atk);
    const dano = buildDanoResumo(atk);
    const pm = calcPMTotal(atk);
    html += `<div class="atk-mini-row">
      <span class="atk-mini-nome" title="${escapeHtml(nome)}">${escapeHtml(nome)}</span>
      <span class="atk-mini-badge atk-mini-teste" title="Teste de Ataque">+${teste}</span>
      <span class="atk-mini-badge atk-mini-dano" title="Dano">${escapeHtml(dano)}</span>
      ${pm > 0 ? `<span class="atk-mini-badge atk-mini-pm" title="Custo PM">${pm} PM</span>` : ''}
      <button class="atk-mini-usar" data-atk-mini-usar="${idx}" title="Usar (gastar PM)">&#9889;</button>
    </div>`;
  });
  container.innerHTML = html;
}

function renderMagiasMini() {
  const container = document.getElementById('magiasMiniLista');
  if (!container) return;
  const magias = ficha.magias || [];
  if (magias.length === 0) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="ataques-mini-title">Magias</div>';
  magias.forEach((mag, idx) => {
    const nome = mag.nome || 'Sem nome';
    const pm = parseInt(mag.custoPM) || 0;
    html += `<div class="atk-mini-row">
      <span class="atk-mini-nome" title="${escapeHtml(nome)}">${escapeHtml(nome)}</span>
      ${pm > 0 ? `<span class="atk-mini-badge atk-mini-pm" title="Custo PM">${pm} PM</span>` : ''}
      <button class="atk-mini-usar" data-magia-mini-conjurar="${idx}" title="Conjurar">&#10024;</button>
    </div>`;
  });
  container.innerHTML = html;
}

function buildBonusListHtml(items, prefix, idx, allowText) {
  let html = '';
  items.forEach((b, bi) => {
    const valorType = allowText ? 'text' : 'number';
    const valorVal = allowText ? escapeHtml(String(b.valor ?? '')) : (b.valor || 0);
    html += `
      <div class="atk-bonus-row">
        <input type="text" class="atk-bonus-nome" value="${escapeHtml(b.nome)}" data-${prefix}-bonus-nome="${idx}-${bi}" placeholder="Origem">
        <input type="${valorType}" class="atk-bonus-valor" value="${valorVal}" data-${prefix}-bonus-valor="${idx}-${bi}" placeholder="${allowText ? '1d6 ou 2' : '0'}">
        <input type="number" class="atk-bonus-pm" value="${b.pm || 0}" data-${prefix}-bonus-pm="${idx}-${bi}" title="Custo PM" placeholder="PM">
        <button class="btn-remove-sm" data-${prefix}-bonus-remove="${idx}-${bi}" title="Remover">&times;</button>
      </div>`;
  });
  return html;
}

function updateAtaqueDisplayInline(idx) {
  const atk = ficha.ataques[idx];
  if (!atk) return;
  const cards = document.querySelectorAll('.ataque-card');
  const card = cards[idx];
  if (!card) return;

  const danoResumo = buildDanoResumo(atk);
  const danoTotalEl = card.querySelector('.atk-dano-total');
  if (danoTotalEl) danoTotalEl.textContent = danoResumo;

  const testeTotal = calcTesteAtaque(atk);
  const testeTotalEl = card.querySelector('.atk-teste-total:not(.atk-dano-total)');
  if (testeTotalEl) testeTotalEl.textContent = formatMod(testeTotal);

  const pmTotal = calcPMTotal(atk);
  const badgeWrap = card.querySelector('.atk-pm-badge-wrap');
  if (pmTotal > 0) {
    if (badgeWrap) {
      badgeWrap.querySelector('.atk-pm-badge').textContent = `${pmTotal} PM`;
    } else {
      const topRow = card.querySelector('.ataque-top-row');
      const div = document.createElement('div');
      div.className = 'atk-pm-badge-wrap';
      div.innerHTML = `<span class="atk-pm-badge">${pmTotal} PM</span>`;
      topRow.appendChild(div);
    }
  } else if (badgeWrap) {
    badgeWrap.remove();
  }
}

function renderAtaques() {
  const container = document.getElementById('ataquesLista');
  container.innerHTML = '';

  const attrOpts = Object.keys(ATRIBUTOS_NOME).map(k =>
    `<option value="${k}">${ATRIBUTOS_NOME[k]}</option>`
  ).join('');

  ficha.ataques.forEach((atk, idx) => {
    if (!atk.alcanceTipo) atk.alcanceTipo = 'melee';
    if (!atk.bonusExtras) atk.bonusExtras = [];
    if (!atk.danoAtributo) atk.danoAtributo = 'for';
    if (!atk.danoExtras) atk.danoExtras = [];

    const periciaId = atk.alcanceTipo === 'ranged' ? 'pontaria' : 'luta';
    const periciaNome = atk.alcanceTipo === 'ranged' ? 'Pontaria' : 'Luta';
    const periciaVal = calcTotalPericia(ficha, periciaId);
    const testeTotal = calcTesteAtaque(atk);

    const danoAttrVal = getAtributoEfetivo(ficha, atk.danoAtributo);
    const danoDados = atk.dano || '';
    const danoResumo = buildDanoResumo(atk);

    const testeBonusHtml = buildBonusListHtml(atk.bonusExtras, 'atk', idx, false);
    const danoBonusHtml = buildBonusListHtml(atk.danoExtras, 'dmg', idx, true);
    const pmTotal = calcPMTotal(atk);

    let activeBuffsTesteHtml = '';
    let activeBuffsDanoHtml = '';
    if (ficha.buffs) {
      ficha.buffs.forEach(b => {
        if (!b.ativo) return;
        if (b.tipo === 'teste_ataque') {
          const bv = isNaN(b.valor) ? escapeHtml(String(b.valor)) : formatMod(parseInt(b.valor) || 0);
          activeBuffsTesteHtml += `<div class="atk-bonus-row atk-buff-row"><span class="atk-buff-nome">${escapeHtml(b.nome || 'Buff')}</span><span class="atk-buff-valor">${bv}</span></div>`;
        } else if (b.tipo === 'pericia' && b.periciaId === periciaId) {
          const bv = isNaN(b.valor) ? escapeHtml(String(b.valor)) : formatMod(parseInt(b.valor) || 0);
          activeBuffsTesteHtml += `<div class="atk-bonus-row atk-buff-row"><span class="atk-buff-nome">${escapeHtml(b.nome || 'Buff')} (${periciaNome})</span><span class="atk-buff-valor">${bv}</span></div>`;
        } else if (b.tipo === 'dano_extra' || b.tipo === 'dano_fixo') {
          const bv = isNaN(b.valor) ? escapeHtml(String(b.valor)) : formatMod(parseInt(b.valor) || 0);
          activeBuffsDanoHtml += `<div class="atk-bonus-row atk-buff-row"><span class="atk-buff-nome">${escapeHtml(b.nome || 'Buff')}</span><span class="atk-buff-valor">${bv}</span></div>`;
        } else if (b.tipo === 'atributo') {
          const bv = formatMod(parseInt(b.valor) || 0);
          const attrNome = ATRIBUTOS_NOME[b.atributoId] || b.atributoId;
          if (b.atributoId === atk.danoAtributo) {
            activeBuffsDanoHtml += `<div class="atk-bonus-row atk-buff-row"><span class="atk-buff-nome">${escapeHtml(b.nome || 'Buff')} (${attrNome})</span><span class="atk-buff-valor">${bv}</span></div>`;
          }
          const periciaAttr = PERICIAS_CONFIG.find(p => p.id === periciaId);
          const perAttrUsado = (ficha.pericias[periciaId] && ficha.pericias[periciaId].atributo) || (periciaAttr && periciaAttr.atributo);
          if (b.atributoId === perAttrUsado) {
            activeBuffsTesteHtml += `<div class="atk-bonus-row atk-buff-row"><span class="atk-buff-nome">${escapeHtml(b.nome || 'Buff')} (${attrNome})</span><span class="atk-buff-valor">${bv}</span></div>`;
          }
        }
      });
    }

    const div = document.createElement('div');
    div.className = 'ataque-card';
    div.innerHTML = `
      <button class="btn-remove" data-ataque-remove="${idx}" title="Remover">&times;</button>
      <button class="btn-duplicate" data-ataque-duplicate="${idx}" title="Duplicar">&#x2398;</button>
      <button class="btn-usar-ataque" data-ataque-usar="${idx}" title="Usar (gastar PM)">&#9889;</button>
      <div class="ataque-top-row">
        <div class="campo-info atk-nome-field">
          <label>Nome</label>
          <input type="text" value="${escapeHtml(atk.nome)}" data-ataque="${idx}" data-ataque-field="nome" placeholder="Nome do ataque">
        </div>
        <div class="campo-info">
          <label>Alcance</label>
          <select data-ataque="${idx}" data-ataque-tipo-sel class="atk-tipo-select">
            <option value="melee" ${atk.alcanceTipo === 'melee' ? 'selected' : ''}>Corpo a corpo</option>
            <option value="ranged" ${atk.alcanceTipo === 'ranged' ? 'selected' : ''}>À distância</option>
          </select>
        </div>
        <div class="campo-info">
          <label>Crítico</label>
          <input type="text" value="${escapeHtml(atk.critico)}" data-ataque="${idx}" data-ataque-field="critico" placeholder="19/x2">
        </div>
        <div class="campo-info">
          <label>Tipo Dano</label>
          <input type="text" value="${escapeHtml(atk.tipo)}" data-ataque="${idx}" data-ataque-field="tipo" placeholder="Corte">
        </div>
        <div class="campo-info atk-custo-pm-field">
          <label>Custo PM</label>
          <input type="number" value="${atk.custoPM || 0}" data-ataque="${idx}" data-ataque-field="custoPM" min="0" placeholder="0">
        </div>
        ${pmTotal > 0 ? `<div class="atk-pm-badge-wrap"><span class="atk-pm-badge">${pmTotal} PM</span></div>` : ''}
      </div>
      <div class="atk-sections-row">
        <div class="atk-teste-section">
          <div class="atk-teste-header">
            <label>Teste de Ataque</label>
            <span class="atk-teste-total">${formatMod(testeTotal)}</span>
          </div>
          <div class="atk-bonus-list">
            <div class="atk-bonus-row atk-bonus-base">
              <span class="atk-bonus-nome-fixed">${periciaNome}</span>
              <span class="atk-bonus-valor-fixed">${formatMod(periciaVal)}</span>
            </div>
            ${testeBonusHtml}
            ${activeBuffsTesteHtml}
          </div>
          <button class="btn-add-bonus" data-atk-add-bonus="${idx}">+ Bônus</button>
        </div>
        <div class="atk-teste-section atk-dano-section">
          <div class="atk-teste-header">
            <label>Dano</label>
            <span class="atk-teste-total atk-dano-total">${danoResumo}</span>
          </div>
          <div class="atk-bonus-list">
            <div class="atk-bonus-row atk-bonus-base">
              <span class="atk-bonus-nome-fixed">Dados</span>
              <input type="text" class="atk-dano-dados" value="${escapeHtml(danoDados)}" data-ataque="${idx}" data-ataque-field="dano" placeholder="2d8">
            </div>
            <div class="atk-bonus-row atk-bonus-base">
              <span class="atk-bonus-nome-fixed">Atributo</span>
              <select class="atk-dano-attr-sel" data-atk-dano-attr="${idx}">${attrOpts}</select>
              <span class="atk-bonus-valor-fixed">${formatMod(danoAttrVal)}</span>
            </div>
            ${danoBonusHtml}
            ${activeBuffsDanoHtml}
          </div>
          <button class="btn-add-bonus" data-dmg-add-bonus="${idx}">+ Bônus</button>
        </div>
      </div>
    `;

    div.querySelector(`[data-atk-dano-attr="${idx}"]`).value = atk.danoAtributo;
    container.appendChild(div);
  });

  document.getElementById('resMagiaDisplay').textContent = calcResistenciaMagia(ficha);
  renderAtaquesMini();
}

// ==================== PERÍCIAS ====================
function renderPericias() {
  const container = document.getElementById('periciaLista');
  container.innerHTML = '';

  const metadeNivel = Math.floor(getNivelTotal(ficha) / 2);
  document.getElementById('metadeNivelDisplay').textContent = metadeNivel;

  const attrOptions = Object.keys(ATRIBUTOS_NOME).map(k =>
    `<option value="${k}">${ATRIBUTOS_NOME[k]}</option>`
  ).join('');

  PERICIAS_CONFIG.forEach(cfg => {
    const per = ficha.pericias[cfg.id] || { treinado: false, outros: 0 };
    const total = calcTotalPericia(ficha, cfg.id);
    const atributoAtual = per.atributo || cfg.atributo;
    const isCustomAttr = per.atributo && per.atributo !== cfg.atributo;

    const row = document.createElement('div');
    row.className = 'pericia-row' + (cfg.treinado ? ' somente-treinado' : '') + (per.treinado ? ' treinado-ativo' : '');

    let customLabelHtml = '';
    if (cfg.customLabel) {
      customLabelHtml = ` (<input type="text" class="pericia-label-custom" value="${escapeHtml(per.label || '')}" data-pericia-label="${cfg.id}" placeholder="tipo">)`;
    }

    const totalStr = formatMod(total);

    row.innerHTML = `
      <input type="checkbox" class="pericia-check" data-pericia-check="${cfg.id}" ${per.treinado ? 'checked' : ''} title="Treinado">
      <span class="pericia-nome">${cfg.nome}${customLabelHtml}</span>
      <select class="pericia-attr-select${isCustomAttr ? ' pericia-attr-custom' : ''}" data-pericia-attr="${cfg.id}" title="Atributo usado">${attrOptions}</select>
      <input type="number" class="pericia-outros" value="${per.outros || 0}" data-pericia-outros="${cfg.id}" title="Outros bônus" placeholder="0">
      <span class="pericia-total">${totalStr}</span>
    `;

    row.querySelector(`[data-pericia-attr="${cfg.id}"]`).value = atributoAtual;
    container.appendChild(row);
  });
}

// ==================== HABILIDADES ====================
function renderHabilidades() {
  const container = document.getElementById('habilidadesLista');
  container.innerHTML = '';

  ficha.habilidades.forEach((hab, idx) => {
    const div = document.createElement('div');
    div.className = 'habilidade-card';
    div.innerHTML = `
      <button class="btn-remove" data-hab-remove="${idx}" title="Remover">&times;</button>
      <div class="habilidade-header">
        <input type="text" value="${escapeHtml(hab.nome)}" data-hab="${idx}" data-hab-field="nome" placeholder="Nome da Habilidade">
        <input type="text" class="habilidade-origem" value="${escapeHtml(hab.origem || '')}" data-hab="${idx}" data-hab-field="origem" placeholder="Origem">
        <input type="text" class="habilidade-tipo" value="${escapeHtml(hab.tipo)}" data-hab="${idx}" data-hab-field="tipo" placeholder="Tipo">
        <input type="text" class="habilidade-pm" value="${escapeHtml(hab.custoPM)}" data-hab="${idx}" data-hab-field="custoPM" placeholder="PM">
      </div>
      <textarea class="habilidade-desc" rows="2" data-hab="${idx}" data-hab-field="descricao" placeholder="Descrição...">${escapeHtml(hab.descricao)}</textarea>
    `;
    container.appendChild(div);
  });
}

// ==================== MAGIAS ====================
function renderMagias() {
  const container = document.getElementById('magiasLista');
  container.innerHTML = '';

  document.getElementById('atributoChaveMagia').value = ficha.atributoChaveMagia || 'int';
  document.getElementById('testeResistenciaMagia').textContent = calcResistenciaMagia(ficha);

  ficha.magias.forEach((mag, idx) => {
    if (!mag.aprimoramentos) mag.aprimoramentos = [];
    const div = document.createElement('div');
    div.className = 'magia-card';

    let aprHtml = '';
    mag.aprimoramentos.forEach((apr, ai) => {
      aprHtml += `<div class="magia-apr-row">
        <input type="text" class="magia-apr-desc" placeholder="Descrição" value="${escapeHtml(apr.descricao)}" data-apr-magia="${idx}" data-apr-idx="${ai}" data-apr-field="descricao">
        <input type="text" class="magia-apr-pm" placeholder="PM" value="${escapeHtml(apr.custoPM)}" data-apr-magia="${idx}" data-apr-idx="${ai}" data-apr-field="custoPM">
        <button class="btn-remove-sm" data-apr-remove-magia="${idx}" data-apr-remove-idx="${ai}" title="Remover">✕</button>
      </div>`;
    });

    div.innerHTML = `
      <button class="btn-remove" data-magia-remove="${idx}" title="Remover">&times;</button>
      <button class="btn-conjurar-magia" data-magia-conjurar="${idx}" title="Conjurar">&#10024;</button>
      <div class="magia-grid">
        <div class="campo-info">
          <label>Magia</label>
          <input type="text" value="${escapeHtml(mag.nome)}" data-magia="${idx}" data-magia-field="nome">
        </div>
        <div class="campo-info">
          <label>Escola</label>
          <input type="text" value="${escapeHtml(mag.escola)}" data-magia="${idx}" data-magia-field="escola">
        </div>
        <div class="campo-info">
          <label>Execução</label>
          <input type="text" value="${escapeHtml(mag.execucao)}" data-magia="${idx}" data-magia-field="execucao">
        </div>
        <div class="campo-info">
          <label>Alcance</label>
          <input type="text" value="${escapeHtml(mag.alcance)}" data-magia="${idx}" data-magia-field="alcance">
        </div>
        <div class="campo-info">
          <label>Área</label>
          <input type="text" value="${escapeHtml(mag.area || '')}" data-magia="${idx}" data-magia-field="area">
        </div>
        <div class="campo-info">
          <label>Duração</label>
          <input type="text" value="${escapeHtml(mag.duracao)}" data-magia="${idx}" data-magia-field="duracao">
        </div>
        <div class="campo-info">
          <label>Resistência</label>
          <input type="text" value="${escapeHtml(mag.resistencia)}" data-magia="${idx}" data-magia-field="resistencia">
        </div>
        <div class="campo-info magia-pm-field">
          <label>Custo PM</label>
          <input type="text" value="${escapeHtml(mag.custoPM || '')}" data-magia="${idx}" data-magia-field="custoPM" placeholder="—">
        </div>
        <div class="campo-info magia-efeito">
          <label>Efeito</label>
          <textarea data-magia="${idx}" data-magia-field="efeito" rows="2">${escapeHtml(mag.efeito)}</textarea>
        </div>
      </div>
      <div class="magia-aprimoramentos">
        <div class="magia-apr-header">
          <span class="magia-apr-title">Aprimoramentos</span>
        </div>
        ${aprHtml}
        <button class="btn-add-apr" data-apr-add="${idx}">+ Aprimoramento</button>
      </div>
    `;
    container.appendChild(div);
  });
  renderMagiasMini();
}

function abrirModalConjurar(magiaIdx) {
  const mag = ficha.magias[magiaIdx];
  if (!mag) return;
  if (!mag.aprimoramentos) mag.aprimoramentos = [];

  const overlay = document.getElementById('modalConjurar');
  const custoBase = parseInt(mag.custoPM) || 0;
  const nivelMax = getNivelTotal(ficha);

  let aprListHtml = '';
  if (mag.aprimoramentos.length > 0) {
    mag.aprimoramentos.forEach((apr, ai) => {
      const pmVal = parseInt(apr.custoPM) || 0;
      const desc = escapeHtml(apr.descricao || `Aprimoramento ${ai + 1}`);
      aprListHtml += `<label class="modal-apr-item">
        <input type="checkbox" data-modal-apr="${ai}" value="${pmVal}">
        <span class="modal-apr-desc">${desc}</span>
        <span class="modal-apr-pm-badge">+${pmVal} PM</span>
      </label>`;
    });
  } else {
    aprListHtml = '<p class="modal-apr-empty">Nenhum aprimoramento cadastrado.</p>';
  }

  overlay.innerHTML = `<div class="modal-conjurar">
    <div class="modal-conjurar-header">
      <h3 class="modal-conjurar-title">&#10024; ${escapeHtml(mag.nome || 'Magia')}</h3>
      <button class="modal-conjurar-close" id="btnModalCancelar" title="Fechar">&times;</button>
    </div>
    <div class="modal-conjurar-body">
      <div class="modal-conjurar-base">
        <span class="modal-base-label">Custo Base</span>
        <span class="modal-base-val">${custoBase} PM</span>
      </div>
      ${mag.aprimoramentos.length > 0 ? '<div class="modal-apr-list-header">Aprimoramentos</div>' : ''}
      <div class="modal-apr-list">${aprListHtml}</div>
      <div class="modal-conjurar-total-row">
        <span class="modal-total-label">Custo Total</span>
        <span class="modal-total-val" id="modalCustoTotal">${custoBase} PM</span>
      </div>
      <div class="modal-conjurar-warn hidden" id="modalWarnNivel">Custo excede o nível do personagem (${nivelMax})</div>
      <div class="modal-conjurar-info">
        <span>PM atual: <strong id="modalPmAtual">${ficha.pm.atual}</strong></span>
        <span>Nível: <strong>${nivelMax}</strong></span>
      </div>
    </div>
    <div class="modal-conjurar-actions">
      <button class="modal-btn-cancelar" id="btnModalCancelar2">Cancelar</button>
      <button class="modal-btn-conjurar" id="btnModalConfirmar">&#10024; Conjurar</button>
    </div>
  </div>`;

  overlay.classList.remove('hidden');

  function recalcTotal() {
    let total = custoBase;
    overlay.querySelectorAll('[data-modal-apr]').forEach(cb => {
      if (cb.checked) total += parseInt(cb.value) || 0;
    });
    document.getElementById('modalCustoTotal').textContent = total + ' PM';
    const warn = document.getElementById('modalWarnNivel');
    if (total > nivelMax) warn.classList.remove('hidden');
    else warn.classList.add('hidden');
    return total;
  }

  overlay.querySelectorAll('[data-modal-apr]').forEach(cb => {
    cb.addEventListener('change', recalcTotal);
  });

  const fecharModal = () => overlay.classList.add('hidden');

  document.getElementById('btnModalCancelar').addEventListener('click', fecharModal);
  document.getElementById('btnModalCancelar2').addEventListener('click', fecharModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) fecharModal();
  });

  document.getElementById('btnModalConfirmar').addEventListener('click', () => {
    const custoTotal = recalcTotal();
    if (custoTotal > 0) {
      ficha.pm.atual = Math.max(0, ficha.pm.atual - custoTotal);
      renderVidaMana();
    }
    const aprSelecionados = [];
    overlay.querySelectorAll('[data-modal-apr]').forEach(cb => {
      if (cb.checked) {
        const ai = parseInt(cb.dataset.modalApr);
        const apr = mag.aprimoramentos[ai];
        if (apr) aprSelecionados.push({ desc: apr.descricao || 'Aprimoramento', pm: parseInt(apr.custoPM) || 0 });
      }
    });
    addLog({ tipo: 'magia', nome: mag.nome || 'Magia', pmGasto: custoTotal, detalhes: { custoPMBase: custoBase, aprimoramentos: aprSelecionados, custoTotal } });
    fecharModal();
    triggerAttackAnim({ alcanceTipo: 'magic', nome: mag.nome || 'Magia' }, custoTotal);
  });
}

// ==================== INVENTÁRIO ====================
function renderInventario() {
  const container = document.getElementById('inventarioLista');
  container.innerHTML = '';

  ficha.inventario.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'inventario-item';
    div.innerHTML = `
      <input type="text" value="${escapeHtml(item.nome)}" data-inv="${idx}" data-inv-field="nome" placeholder="Nome do item">
      <input type="number" value="${item.quantidade || 1}" data-inv="${idx}" data-inv-field="quantidade" min="0" title="Qtd">
      <input type="number" value="${item.carga || 0}" data-inv="${idx}" data-inv-field="carga" min="0" step="0.5" title="Carga">
      <button class="btn-remove" data-inv-remove="${idx}" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  });

  renderCargaStats();
}

function renderCargaStats() {
  const limite = calcLimiteCarga(ficha);
  document.getElementById('limiteCargaDisplay').textContent = limite;
  document.getElementById('cargaUsadaDisplay').textContent = calcCargaUsada(ficha);
  document.getElementById('cargaMaxDisplay').textContent = limite * 2;
}

const EQUIP_ICONS = ['🛡️', '⚔️', '🧥', '💍'];
function renderEquipados() {
  const container = document.getElementById('equipadosLista');
  container.innerHTML = '';
  ficha.equipados.forEach((slot, idx) => {
    const div = document.createElement('div');
    div.className = 'equipado-slot' + (slot.nome ? ' preenchido' : '');
    div.innerHTML = `
      <span class="equipado-slot-icon">${EQUIP_ICONS[idx] || '🛡️'}</span>
      <input type="text" value="${escapeHtml(slot.nome)}" data-equip="${idx}" placeholder="Slot ${idx + 1} vazio">
    `;
    container.appendChild(div);
  });
}

function renderMoedas() {
  document.querySelector('[data-moeda="tc"]').value = ficha.moedas?.tc || 0;
  document.querySelector('[data-moeda="tp"]').value = ficha.moedas?.tp || 0;
  document.querySelector('[data-moeda="to"]').value = ficha.moedas?.to || 0;
}

// ==================== PROGRESSÃO ====================
function renderProgressao() {
  const container = document.getElementById('progressaoLista');
  container.innerHTML = '';

  ficha.progressao.forEach((prog, idx) => {
    const div = document.createElement('div');
    div.className = 'progressao-item';
    div.innerHTML = `
      <span class="progressao-nivel">${idx + 1}.</span>
      <input type="text" class="progressao-desc" value="${escapeHtml(prog)}" data-prog="${idx}" placeholder="Poderes, classes, distinções etc.">
      <button class="btn-remove" data-prog-remove="${idx}" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  });
}

// ==================== CALCULADOS ====================
function renderCalculados() {
  document.getElementById('nivelTotalDisplay').textContent = getNivelTotal(ficha);
  document.getElementById('defesaTotalDisplay').textContent = calcDefesaTotal(ficha);
  document.getElementById('resMagiaDisplay').textContent = calcResistenciaMagia(ficha);
  document.getElementById('testeResistenciaMagia').textContent = calcResistenciaMagia(ficha);
  renderCargaStats();
  renderAtaques();
}

// ==================== UTILS ====================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==================== ATTACK ANIMATION SOUNDS ====================
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playSwordSound() {
  const ctx = getAudioCtx();
  const bufSize = ctx.sampleRate * 0.08;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 2000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  src.connect(hp).connect(gain).connect(ctx.destination);
  src.start();

  const osc = ctx.createOscillator();
  osc.frequency.value = 800;
  osc.type = 'square';
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.15, ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(g2).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.06);
}

function playArrowSound() {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.25);

  const bufSize = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.3;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 2;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.2, ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  src.connect(bp).connect(g2).connect(ctx.destination);
  src.start();
}

function playMagicSound() {
  const ctx = getAudioCtx();
  [400, 600, 800].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
  });
}

function playNotifSound() {
  const ctx = getAudioCtx();
  [800, 1000].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.1);
  });
}

function playWindSound() {
  const ctx = getAudioCtx();
  const bufSize = ctx.sampleRate * 0.4;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 5;
  bp.frequency.setValueAtTime(500, ctx.currentTime);
  bp.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2);
  bp.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  src.connect(bp).connect(gain).connect(ctx.destination);
  src.start(); src.stop(ctx.currentTime + 0.4);
}

// ==================== ATTACK ANIMATIONS ====================
function playPersonagemAnim(tipo, pmCusto, nomeAtaque) {
  const overlay = document.getElementById('atkAnimOverlay');
  let emoji, animClass, soundFn;
  if (tipo === 'ranged') {
    emoji = '🏹'; animClass = 'anim-arrow'; soundFn = playArrowSound;
  } else if (pmCusto > 0) {
    emoji = '✨'; animClass = 'anim-magic'; soundFn = playMagicSound;
  } else {
    emoji = '⚔️'; animClass = 'anim-slash'; soundFn = playSwordSound;
  }
  overlay.innerHTML = `<div class="atk-anim-char ${animClass}">${emoji}</div>` +
    (pmCusto > 0 ? `<div class="atk-anim-label">${escapeHtml(nomeAtaque)} &mdash; ${pmCusto} PM</div>` : `<div class="atk-anim-label">${escapeHtml(nomeAtaque)}</div>`);
  soundFn();
  setTimeout(() => { overlay.innerHTML = ''; }, 1200);
}

function playToastAnim(pmCusto, nomeAtaque) {
  const toast = document.createElement('div');
  toast.className = 'atk-toast';
  toast.innerHTML = `${escapeHtml(nomeAtaque)} usado!` +
    (pmCusto > 0 ? `<span class="toast-pm">-${pmCusto} PM</span>` : '');
  document.body.appendChild(toast);
  playNotifSound();
  setTimeout(() => { toast.remove(); }, 2600);
}

function playFloatingAnim(pmCusto) {
  const el = document.createElement('div');
  el.className = 'atk-floating';
  el.textContent = pmCusto > 0 ? `-${pmCusto} PM` : 'Hit!';
  document.body.appendChild(el);

  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6'];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'atk-particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.background = colors[i % colors.length];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }

  playWindSound();
  setTimeout(() => { el.remove(); }, 1300);
}

function triggerAttackAnim(atk, pmCusto) {
  const style = ficha.animacaoAtaque || 'personagem';
  const nome = atk.nome || 'Ataque';
  if (style === 'personagem') playPersonagemAnim(atk.alcanceTipo, pmCusto, nome);
  else if (style === 'toast') playToastAnim(pmCusto, nome);
  else if (style === 'floating') playFloatingAnim(pmCusto);
}

// ==================== LOGS ====================
const LOG_ICONS = {
  ataque: '&#9876;',
  magia: '&#10024;',
  buff_on: '&#9650;',
  buff_off: '&#9660;'
};

function addLog(entry) {
  if (!ficha.logs) ficha.logs = [];
  entry.timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  ficha.logs.unshift(entry);
  if (ficha.logs.length > 100) ficha.logs.length = 100;
  renderLogs();
  scheduleSave();
}

function renderLogs() {
  const container = document.getElementById('logsLista');
  if (!container) return;
  const logs = ficha.logs || [];
  if (logs.length === 0) {
    container.innerHTML = '<div class="log-empty">Nenhuma ação registrada</div>';
    return;
  }
  let html = '';
  logs.forEach(log => {
    const icon = LOG_ICONS[log.tipo] || '&#8226;';
    let detalhesHtml = '';
    if (log.detalhes) {
      const d = log.detalhes;
      const parts = [];
      if (d.teste !== undefined) parts.push(`Teste: +${d.teste}`);
      if (d.dano) parts.push(`Dano: ${escapeHtml(d.dano)}`);
      if (d.custoTipo) parts.push(d.custoTipo);
      if (d.tipoBuff) parts.push(`Tipo: ${escapeHtml(d.tipoBuff)}`);
      if (d.alvo) parts.push(`Alvo: ${escapeHtml(d.alvo)}`);
      if (d.valor !== undefined) parts.push(`Valor: ${escapeHtml(String(d.valor))}`);
      if (d.custoPMBase !== undefined) parts.push(`PM base: ${d.custoPMBase}`);
      if (d.aprimoramentos && d.aprimoramentos.length > 0) {
        d.aprimoramentos.forEach(a => parts.push(`+ ${escapeHtml(a.desc)} (${a.pm} PM)`));
      }
      if (d.custoTotal !== undefined && d.custoPMBase !== undefined) parts.push(`Total: ${d.custoTotal} PM`);
      if (parts.length > 0) detalhesHtml = `<div class="log-entry-detalhes">${parts.join(' &middot; ')}</div>`;
    }
    html += `<div class="log-entry">
      <div class="log-entry-header">
        <span class="log-entry-icon log-tipo-${log.tipo}">${icon}</span>
        <span class="log-entry-nome">${escapeHtml(log.nome || '')}</span>
        ${log.pmGasto > 0 ? `<span class="log-entry-pm">-${log.pmGasto} PM</span>` : ''}
        <span class="log-entry-time">${log.timestamp || ''}</span>
      </div>
      ${detalhesHtml}
    </div>`;
  });
  container.innerHTML = html;
}

// ==================== EVENT DELEGATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  connectAppWs();
  const fichas = await apiFetchFichas();
  if (fichas.length === 0) {
    ficha = criarFichaVazia('Novo Personagem');
    fichaOriginalNome = ficha.nome;
    await apiSaveFicha(ficha.nome, ficha);
  }
  const urlParams = new URLSearchParams(window.location.search);
  const charFromUrl = urlParams.get('char');
  const initialChar = (charFromUrl && fichas.includes(charFromUrl)) ? charFromUrl : (fichas[0] || ficha.nome);
  await refreshSelect(initialChar);
  await loadFicha(initialChar);

  // Select personagem
  document.getElementById('selectPersonagem').addEventListener('change', e => {
    loadFicha(e.target.value);
  });

  document.getElementById('btnNovo').addEventListener('click', novoPersonagem);
  document.getElementById('btnExcluir').addEventListener('click', excluirPersonagem);

  document.getElementById('selectAnimacao').addEventListener('change', e => {
    ficha.animacaoAtaque = e.target.value;
    scheduleSave();
  });

  // Section visibility panel
  document.getElementById('btnSecVis').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('secVisPanel').classList.toggle('hidden');
  });
  document.getElementById('secVisPanel').addEventListener('click', e => {
    e.stopPropagation();
  });
  document.addEventListener('click', () => {
    document.getElementById('secVisPanel').classList.add('hidden');
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.secvis) {
      if (!ficha.secoesOcultas) ficha.secoesOcultas = {};
      ficha.secoesOcultas[e.target.dataset.secvis] = !e.target.checked;
      aplicarSecVisibility();
      scheduleSave();
    }
  });

  // Nome do personagem
  document.getElementById('campoNome').addEventListener('input', e => {
    ficha.nome = e.target.value;
    scheduleSave();
  });

  // Avatar
  document.getElementById('avatarWrapper').addEventListener('click', () => {
    document.getElementById('avatarInput').click();
  });
  document.getElementById('avatarInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !ficha.nome) return;
    const form = new FormData();
    form.append('avatar', file);
    try {
      const resp = await fetch(`/api/avatar/${encodeURIComponent(ficha.nome)}`, { method: 'POST', body: form });
      const result = await resp.json();
      if (result.url) {
        ficha.avatar = result.url + '?t=' + Date.now();
        document.getElementById('avatarImg').src = ficha.avatar;
        document.getElementById('avatarImg').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
        scheduleSave();
      }
    } catch (err) {
      console.error('Erro ao enviar avatar:', err);
    }
    e.target.value = '';
  });

  // Classes
  document.getElementById('btnAddClasse').addEventListener('click', () => {
    migrateClasses();
    ficha.classes.push({ nome: '', nivel: 1 });
    renderClasses();
    renderPericias();
    renderCalculados();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.classeNome !== undefined) {
      const idx = parseInt(e.target.dataset.classeNome);
      ficha.classes[idx].nome = e.target.value;
      if (idx === 0) {
        const icone = document.getElementById('classeIcone');
        if (icone) {
          const nome = e.target.value.trim();
          if (nome) {
            icone.src = `/assets/classes/${nome.toLowerCase()}.png`;
            icone.style.display = '';
            icone.onerror = () => { icone.style.display = 'none'; };
          } else {
            icone.style.display = 'none';
          }
        }
      }
      scheduleSave();
    }
    if (e.target.dataset.classeNivel !== undefined) {
      const idx = parseInt(e.target.dataset.classeNivel);
      ficha.classes[idx].nivel = parseInt(e.target.value) || 1;
      document.getElementById('nivelTotalDisplay').textContent = getNivelTotal(ficha);
      renderPericias();
      renderCalculados();
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.classeRemove !== undefined) {
      const idx = parseInt(e.target.dataset.classeRemove);
      if (ficha.classes.length > 1) {
        ficha.classes.splice(idx, 1);
        renderClasses();
        renderPericias();
        renderCalculados();
        scheduleSave();
      }
    }
  });

  // Campos simples
  document.addEventListener('input', e => {
    const field = e.target.dataset.field;
    if (field) {
      if (e.target.type === 'number') ficha[field] = parseInt(e.target.value) || 0;
      else ficha[field] = e.target.value;
      if (field === 'atributoChaveMagia') {
        ficha.atributoChaveMagia = e.target.value;
        renderCalculados();
      }
      scheduleSave();
    }
  });

  document.addEventListener('change', e => {
    const field = e.target.dataset.field;
    if (field && e.target.tagName === 'SELECT') {
      ficha[field] = e.target.value;
      if (field === 'atributoChaveMagia') renderCalculados();
      scheduleSave();
    }
  });

  // Editar atributos (lápis)
  document.addEventListener('click', e => {
    const editAttr = e.target.dataset.editAttr;
    if (editAttr) startEditAtributo(editAttr);
  });

  // Editar PV/PM (lápis)
  document.addEventListener('click', e => {
    const editVm = e.target.dataset.editVm;
    if (editVm) startEditVM(editVm);
  });

  // PV/PM inc/dec
  document.addEventListener('click', e => {
    if (e.target.dataset.vmInc) incVM(e.target.dataset.vmInc);
    if (e.target.dataset.vmDec) decVM(e.target.dataset.vmDec);
  });

  document.getElementById('btnResetVidaMana').addEventListener('click', resetVidaMana);

  document.getElementById('pvTempInput').addEventListener('input', e => {
    ficha.pvTemporario = Math.max(0, parseInt(e.target.value) || 0);
    renderVidaMana();
    scheduleSave();
  });
  document.getElementById('pmTempInput').addEventListener('input', e => {
    ficha.pmTemporario = Math.max(0, parseInt(e.target.value) || 0);
    renderVidaMana();
    scheduleSave();
  });

  // Collapse/expand sections
  document.addEventListener('click', e => {
    const h2 = e.target.closest('.ficha-section[id] > h2');
    if (!h2) return;
    const section = h2.closest('.ficha-section[id]');
    if (!section) return;
    section.classList.toggle('collapsed');
    if (!ficha.secoesFechadas) ficha.secoesFechadas = {};
    ficha.secoesFechadas[section.id] = section.classList.contains('collapsed');
    scheduleSave();
  });

  // Defesa
  document.getElementById('btnAddDefesa').addEventListener('click', addDefesaItem);
  document.addEventListener('input', e => {
    if (e.target.dataset.defesaNome !== undefined) {
      const idx = parseInt(e.target.dataset.defesaNome);
      ficha.defesa.itens[idx].nome = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.defesaValor !== undefined) {
      const idx = parseInt(e.target.dataset.defesaValor);
      ficha.defesa.itens[idx].valor = parseInt(e.target.value) || 0;
      document.getElementById('defesaTotalDisplay').textContent = calcDefesaTotal(ficha);
      scheduleSave();
    }
    if (e.target.dataset.defesaPen !== undefined) {
      const idx = parseInt(e.target.dataset.defesaPen);
      ficha.defesa.itens[idx].penalidade = parseInt(e.target.value) || 0;
      renderPericias();
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.defesaRemove !== undefined) {
      ficha.defesa.itens.splice(parseInt(e.target.dataset.defesaRemove), 1);
      renderDefesa();
      renderPericias();
      scheduleSave();
    }
  });

  // Ataques
  document.getElementById('btnAddAtaque').addEventListener('click', () => {
    ficha.ataques.push({ nome: '', alcanceTipo: 'melee', dano: '', critico: '', tipo: '', custoPM: 0, bonusExtras: [], danoAtributo: 'for', danoExtras: [] });
    renderAtaques();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.ataqueField) {
      const idx = parseInt(e.target.dataset.ataque);
      const field = e.target.dataset.ataqueField;
      if (field === 'custoPM') {
        ficha.ataques[idx].custoPM = parseInt(e.target.value) || 0;
      } else {
        ficha.ataques[idx][field] = e.target.value;
      }
      updateAtaqueDisplayInline(idx);
      scheduleSave();
    }
    // Teste de ataque bônus
    if (e.target.dataset.atkBonusNome !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.atkBonusNome.split('-').map(Number);
      ficha.ataques[atkIdx].bonusExtras[bonusIdx].nome = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.atkBonusValor !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.atkBonusValor.split('-').map(Number);
      ficha.ataques[atkIdx].bonusExtras[bonusIdx].valor = parseInt(e.target.value) || 0;
      updateAtaqueDisplayInline(atkIdx);
      scheduleSave();
    }
    if (e.target.dataset.atkBonusPm !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.atkBonusPm.split('-').map(Number);
      ficha.ataques[atkIdx].bonusExtras[bonusIdx].pm = parseInt(e.target.value) || 0;
      updateAtaqueDisplayInline(atkIdx);
      scheduleSave();
    }
    // Dano bônus
    if (e.target.dataset.dmgBonusNome !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.dmgBonusNome.split('-').map(Number);
      ficha.ataques[atkIdx].danoExtras[bonusIdx].nome = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.dmgBonusValor !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.dmgBonusValor.split('-').map(Number);
      ficha.ataques[atkIdx].danoExtras[bonusIdx].valor = e.target.value;
      updateAtaqueDisplayInline(atkIdx);
      scheduleSave();
    }
    if (e.target.dataset.dmgBonusPm !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.dmgBonusPm.split('-').map(Number);
      ficha.ataques[atkIdx].danoExtras[bonusIdx].pm = parseInt(e.target.value) || 0;
      updateAtaqueDisplayInline(atkIdx);
      scheduleSave();
    }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.ataqueTipoSel !== undefined) {
      const idx = parseInt(e.target.dataset.ataque);
      ficha.ataques[idx].alcanceTipo = e.target.value;
      renderAtaques();
      scheduleSave();
    }
    if (e.target.dataset.atkDanoAttr !== undefined) {
      const idx = parseInt(e.target.dataset.atkDanoAttr);
      ficha.ataques[idx].danoAtributo = e.target.value;
      renderAtaques();
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.ataqueRemove !== undefined) {
      ficha.ataques.splice(parseInt(e.target.dataset.ataqueRemove), 1);
      renderAtaques();
      scheduleSave();
    }
    if (e.target.dataset.ataqueDuplicate !== undefined) {
      const srcIdx = parseInt(e.target.dataset.ataqueDuplicate);
      const clone = JSON.parse(JSON.stringify(ficha.ataques[srcIdx]));
      clone.nome = (clone.nome || 'Ataque') + ' (cópia)';
      ficha.ataques.splice(srcIdx + 1, 0, clone);
      renderAtaques();
      scheduleSave();
    }
    if (e.target.dataset.ataqueUsar !== undefined) {
      const idx = parseInt(e.target.dataset.ataqueUsar);
      const atk = ficha.ataques[idx];
      const pmCusto = calcPMTotal(atk);
      if (pmCusto > 0) {
        ficha.pm.atual = Math.max(0, ficha.pm.atual - pmCusto);
        renderVidaMana();
      }
      addLog({ tipo: 'ataque', nome: atk.nome || 'Ataque', pmGasto: pmCusto, detalhes: { teste: calcTesteAtaque(atk), dano: buildDanoResumo(atk), custoTipo: atk.alcanceTipo === 'ranged' ? 'A Distância' : 'Corpo a Corpo' } });
      triggerAttackAnim(atk, pmCusto);
    }
    if (e.target.dataset.atkMiniUsar !== undefined) {
      const idx = parseInt(e.target.dataset.atkMiniUsar);
      const atk = ficha.ataques[idx];
      const pmCusto = calcPMTotal(atk);
      if (pmCusto > 0) {
        ficha.pm.atual = Math.max(0, ficha.pm.atual - pmCusto);
        renderVidaMana();
      }
      addLog({ tipo: 'ataque', nome: atk.nome || 'Ataque', pmGasto: pmCusto, detalhes: { teste: calcTesteAtaque(atk), dano: buildDanoResumo(atk), custoTipo: atk.alcanceTipo === 'ranged' ? 'A Distância' : 'Corpo a Corpo' } });
      triggerAttackAnim(atk, pmCusto);
    }
    // Teste bônus add/remove
    if (e.target.dataset.atkAddBonus !== undefined) {
      const idx = parseInt(e.target.dataset.atkAddBonus);
      if (!ficha.ataques[idx].bonusExtras) ficha.ataques[idx].bonusExtras = [];
      ficha.ataques[idx].bonusExtras.push({ nome: '', valor: 0 });
      renderAtaques();
      scheduleSave();
    }
    if (e.target.dataset.atkBonusRemove !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.atkBonusRemove.split('-').map(Number);
      ficha.ataques[atkIdx].bonusExtras.splice(bonusIdx, 1);
      renderAtaques();
      scheduleSave();
    }
    // Dano bônus add/remove
    if (e.target.dataset.dmgAddBonus !== undefined) {
      const idx = parseInt(e.target.dataset.dmgAddBonus);
      if (!ficha.ataques[idx].danoExtras) ficha.ataques[idx].danoExtras = [];
      ficha.ataques[idx].danoExtras.push({ nome: '', valor: 0 });
      renderAtaques();
      scheduleSave();
    }
    if (e.target.dataset.dmgBonusRemove !== undefined) {
      const [atkIdx, bonusIdx] = e.target.dataset.dmgBonusRemove.split('-').map(Number);
      ficha.ataques[atkIdx].danoExtras.splice(bonusIdx, 1);
      renderAtaques();
      scheduleSave();
    }
  });

  // Perícias
  document.addEventListener('change', e => {
    if (e.target.dataset.periciaCheck) {
      const id = e.target.dataset.periciaCheck;
      if (!ficha.pericias[id]) ficha.pericias[id] = { treinado: false, outros: 0 };
      ficha.pericias[id].treinado = e.target.checked;
      renderPericias();
      scheduleSave();
    }
    if (e.target.dataset.periciaAttr) {
      const id = e.target.dataset.periciaAttr;
      const cfg = PERICIAS_CONFIG.find(p => p.id === id);
      if (!ficha.pericias[id]) ficha.pericias[id] = { treinado: false, outros: 0 };
      if (e.target.value === cfg.atributo) {
        delete ficha.pericias[id].atributo;
      } else {
        ficha.pericias[id].atributo = e.target.value;
      }
      renderPericias();
      scheduleSave();
    }
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.periciaOutros) {
      const id = e.target.dataset.periciaOutros;
      if (!ficha.pericias[id]) ficha.pericias[id] = { treinado: false, outros: 0 };
      ficha.pericias[id].outros = parseInt(e.target.value) || 0;
      renderPericias();
      scheduleSave();
    }
    if (e.target.dataset.periciaLabel !== undefined) {
      const id = e.target.dataset.periciaLabel;
      if (!ficha.pericias[id]) ficha.pericias[id] = { treinado: false, outros: 0 };
      ficha.pericias[id].label = e.target.value;
      scheduleSave();
    }
  });

  // Habilidades
  document.getElementById('btnAddHabilidade').addEventListener('click', () => {
    ficha.habilidades.push({ nome: '', descricao: '', tipo: '', custoPM: '', origem: '' });
    renderHabilidades();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.habField) {
      const idx = parseInt(e.target.dataset.hab);
      ficha.habilidades[idx][e.target.dataset.habField] = e.target.value;
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.habRemove !== undefined) {
      ficha.habilidades.splice(parseInt(e.target.dataset.habRemove), 1);
      renderHabilidades();
      scheduleSave();
    }
  });

  // Magias
  document.getElementById('btnAddMagia').addEventListener('click', () => {
    ficha.magias.push({ nome: '', escola: '', execucao: '', alcance: '', area: '', duracao: '', resistencia: '', efeito: '', custoPM: '', aprimoramentos: [] });
    renderMagias();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.magiaField) {
      const idx = parseInt(e.target.dataset.magia);
      const field = e.target.dataset.magiaField;
      ficha.magias[idx][field] = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.aprField) {
      const mi = parseInt(e.target.dataset.aprMagia);
      const ai = parseInt(e.target.dataset.aprIdx);
      const field = e.target.dataset.aprField;
      if (ficha.magias[mi] && ficha.magias[mi].aprimoramentos[ai]) {
        ficha.magias[mi].aprimoramentos[ai][field] = e.target.value;
        scheduleSave();
      }
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.magiaRemove !== undefined) {
      ficha.magias.splice(parseInt(e.target.dataset.magiaRemove), 1);
      renderMagias();
      scheduleSave();
    }
    if (e.target.dataset.aprAdd !== undefined) {
      const mi = parseInt(e.target.dataset.aprAdd);
      if (!ficha.magias[mi].aprimoramentos) ficha.magias[mi].aprimoramentos = [];
      ficha.magias[mi].aprimoramentos.push({ descricao: '', custoPM: '' });
      renderMagias();
      scheduleSave();
    }
    if (e.target.dataset.aprRemoveMagia !== undefined) {
      const mi = parseInt(e.target.dataset.aprRemoveMagia);
      const ai = parseInt(e.target.dataset.aprRemoveIdx);
      ficha.magias[mi].aprimoramentos.splice(ai, 1);
      renderMagias();
      scheduleSave();
    }
    if (e.target.dataset.magiaConjurar !== undefined) {
      abrirModalConjurar(parseInt(e.target.dataset.magiaConjurar));
    }
    if (e.target.dataset.magiaMiniConjurar !== undefined) {
      abrirModalConjurar(parseInt(e.target.dataset.magiaMiniConjurar));
    }
  });

  // Inventário
  document.getElementById('btnAddItem').addEventListener('click', () => {
    ficha.inventario.push({ nome: '', quantidade: 1, carga: 0 });
    renderInventario();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.invField) {
      const idx = parseInt(e.target.dataset.inv);
      const field = e.target.dataset.invField;
      if (field === 'nome') ficha.inventario[idx][field] = e.target.value;
      else ficha.inventario[idx][field] = parseFloat(e.target.value) || 0;
      renderCargaStats();
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.invRemove !== undefined) {
      ficha.inventario.splice(parseInt(e.target.dataset.invRemove), 1);
      renderInventario();
      scheduleSave();
    }
  });

  // Equipados
  document.addEventListener('input', e => {
    if (e.target.dataset.equip !== undefined) {
      const idx = parseInt(e.target.dataset.equip);
      ficha.equipados[idx].nome = e.target.value;
      e.target.closest('.equipado-slot').classList.toggle('preenchido', !!e.target.value);
      scheduleSave();
    }
  });

  // Moedas
  document.addEventListener('input', e => {
    if (e.target.dataset.moeda) {
      if (!ficha.moedas) ficha.moedas = { tc: 0, tp: 0, to: 0 };
      ficha.moedas[e.target.dataset.moeda] = parseInt(e.target.value) || 0;
      scheduleSave();
    }
  });

  // Buffs
  document.getElementById('btnAddBuff').addEventListener('click', () => {
    ficha.buffs.push({ nome: '', tipo: 'teste_ataque', valor: 0, pm: 0, ativo: false });
    renderBuffs();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.buffNome !== undefined) {
      const idx = parseInt(e.target.dataset.buffNome);
      ficha.buffs[idx].nome = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.buffValor !== undefined) {
      const idx = parseInt(e.target.dataset.buffValor);
      ficha.buffs[idx].valor = e.target.value;
      scheduleSave();
    }
    if (e.target.dataset.buffPm !== undefined) {
      const idx = parseInt(e.target.dataset.buffPm);
      ficha.buffs[idx].pm = parseInt(e.target.value) || 0;
      scheduleSave();
    }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.buffTipo !== undefined) {
      const idx = parseInt(e.target.dataset.buffTipo);
      const oldTipo = ficha.buffs[idx].tipo;
      ficha.buffs[idx].tipo = e.target.value;
      if (e.target.value === 'pericia' && !ficha.buffs[idx].periciaId) {
        ficha.buffs[idx].periciaId = PERICIAS_CONFIG[0].id;
      }
      if (e.target.value === 'atributo' && !ficha.buffs[idx].atributoId) {
        ficha.buffs[idx].atributoId = 'for';
      }
      if (oldTipo === 'pericia' && e.target.value !== 'pericia') {
        delete ficha.buffs[idx].periciaId;
      }
      if (oldTipo === 'atributo' && e.target.value !== 'atributo') {
        delete ficha.buffs[idx].atributoId;
      }
      renderBuffs();
      scheduleSave();
    }
    if (e.target.dataset.buffPericia !== undefined) {
      const idx = parseInt(e.target.dataset.buffPericia);
      ficha.buffs[idx].periciaId = e.target.value;
      renderPericias();
      scheduleSave();
    }
    if (e.target.dataset.buffAtributo !== undefined) {
      const idx = parseInt(e.target.dataset.buffAtributo);
      ficha.buffs[idx].atributoId = e.target.value;
      if (ficha.buffs[idx].ativo) {
        renderAtributos();
        renderPericias();
        renderAtaques();
        renderCalculados();
      }
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.buffToggle !== undefined) {
      toggleBuff(parseInt(e.target.dataset.buffToggle));
    }
    if (e.target.dataset.buffRemove !== undefined) {
      const idx = parseInt(e.target.dataset.buffRemove);
      const buff = ficha.buffs[idx];
      if (buff.ativo) {
        if (buff.tipo === 'vida') ficha.pvTemporario = Math.max(0, (ficha.pvTemporario || 0) - (parseInt(buff.valor) || 0));
        if (buff.tipo === 'mana') ficha.pmTemporario = Math.max(0, (ficha.pmTemporario || 0) - (parseInt(buff.valor) || 0));
      }
      ficha.buffs.splice(idx, 1);
      renderBuffs();
      renderAtributos();
      renderVidaMana();
      renderAtaques();
      renderPericias();
      scheduleSave();
    }
  });

  // Progressão
  document.getElementById('btnAddProgressao').addEventListener('click', () => {
    ficha.progressao.push('');
    renderProgressao();
    scheduleSave();
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.prog !== undefined) {
      const idx = parseInt(e.target.dataset.prog);
      ficha.progressao[idx] = e.target.value;
      scheduleSave();
    }
  });
  document.addEventListener('click', e => {
    if (e.target.dataset.progRemove !== undefined) {
      ficha.progressao.splice(parseInt(e.target.dataset.progRemove), 1);
      renderProgressao();
      scheduleSave();
    }
  });

  // Drawers
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerProg = document.getElementById('drawerProgressao');
  const drawerAnot = document.getElementById('drawerAnotacoes');
  const drawerLogs = document.getElementById('drawerLogs');
  const drawerPericias = document.getElementById('drawerPericias');

  const closeAllDrawers = () => {
    drawerProg.classList.remove('open');
    drawerAnot.classList.remove('open');
    drawerLogs.classList.remove('open');
    drawerPericias.classList.remove('open');
    drawerOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  };

  document.getElementById('btnDrawerToggle').addEventListener('click', () => {
    closeAllDrawers();
    drawerProg.classList.add('open');
    drawerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btnDrawerClose').addEventListener('click', closeAllDrawers);

  document.getElementById('btnDrawerAnotacoesToggle').addEventListener('click', () => {
    closeAllDrawers();
    drawerAnot.classList.add('open');
    drawerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btnDrawerAnotacoesClose').addEventListener('click', closeAllDrawers);

  document.getElementById('btnDrawerLogsToggle').addEventListener('click', () => {
    closeAllDrawers();
    drawerLogs.classList.add('open');
    drawerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btnDrawerLogsClose').addEventListener('click', closeAllDrawers);

  document.getElementById('btnDrawerPericiasToggle').addEventListener('click', () => {
    closeAllDrawers();
    drawerPericias.classList.add('open');
    drawerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('btnDrawerPericiasClose').addEventListener('click', closeAllDrawers);

  document.getElementById('navPericias').addEventListener('click', (e) => {
    e.preventDefault();
    closeAllDrawers();
    drawerPericias.classList.add('open');
    drawerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('btnLimparLogs').addEventListener('click', () => {
    ficha.logs = [];
    renderLogs();
    scheduleSave();
  });

  drawerOverlay.addEventListener('click', closeAllDrawers);

  // Section nav highlight
  const navLinks = document.querySelectorAll('.section-nav a');
  const sectionIds = Array.from(navLinks).map(a => a.getAttribute('href').slice(1));
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`.section-nav a[href="#${entry.target.id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('nav-active'));
        link.classList.add('nav-active');
      }
    });
  }, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  });

});
