// ==================== API ====================
async function apiFetchFichas() {
  const res = await fetch('/api/fichas');
  return res.json();
}

async function apiLoadFicha(nome) {
  const res = await fetch(`/api/fichas/${encodeURIComponent(nome)}`);
  if (!res.ok) return null;
  return res.json();
}

async function apiSaveFicha(nome, data) {
  await fetch(`/api/fichas/${encodeURIComponent(nome)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

async function apiDeleteFicha(nome) {
  await fetch(`/api/fichas/${encodeURIComponent(nome)}`, { method: 'DELETE' });
}

async function apiRenomear(nomeAntigo, nomeNovo) {
  await fetch(`/api/fichas/${encodeURIComponent(nomeAntigo)}/renomear/${encodeURIComponent(nomeNovo)}`, {
    method: 'POST'
  });
}

async function apiLoadCombate() {
  const res = await fetch('/api/combate');
  return res.json();
}

async function apiSaveCombate(data) {
  await fetch('/api/combate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
