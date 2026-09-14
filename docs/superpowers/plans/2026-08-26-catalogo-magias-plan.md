# Catálogo de magias (Grimório T20) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reimportar as 202 magias de `client/src/data/spells.ts` a partir do Grimório T20 (edição "Jogo do Ano" + suplementos dos 5 extras), via script reprodutível com relatório de diff, e fazer a atualização chegar às magias já copiadas nas fichas.

**Architecture:** Um script Python em `tools/` baixa (com cache local e intervalo) a lista filtrada por publicação e cada página `/<id>/`, parseia para a forma `OfficialSpell`, normaliza para as convenções do nosso catálogo e (a) emite um relatório de diff campo a campo contra o `spells.ts` atual, (b) com `--write` regenera o `spells.ts` inteiro. Depois, no cliente, cada `Spell` da ficha passa a guardar `catalogId` e é hidratada do catálogo na leitura, preservando os campos que o jogador editou.

**Tech Stack:** Python 3.12 (`requests`, `beautifulsoup4` já instalados; `pytest 9`), TypeScript/React (Vite, vitest) no cliente.

**Spec:** `docs/backlog-ficha-2026-08-26.md` — épico **E2** (H2.1, H2.2, H2.3).

## Global Constraints

- Fonte: `https://eduardomarques.pythonanywhere.com/` — lista `GET /?book_magazine=<publicação>`, detalhe `GET /<id>/`. Sem API/export. **Intervalo ≥ 1 s entre requisições; todo HTML baixado vai para `tools/cache/grimorio/` (ignorado no git) e nunca é baixado duas vezes.**
- User-Agent identificado: `arcanaforge-import/1.0 (+https://github.com/danillo/arcanaforge)`.
- Publicações a importar: `Edição Jogo do Ano` (197), `Ameaças de Arton` e `Dragão Brasil` (só as 5 magias que já estão no nosso catálogo: Conjurar Mortos-Vivos, Açoite Flamejante, Disparo Gélido, Detonação Congelante, Geiser Cáustico).
- Convenções do nosso catálogo que o site não segue e o script deve normalizar: `Resistência: nenhuma` → `''`; "Truque" → **último parágrafo da `description`, prefixado `Truque: `** (separado por linha em branco); nome do site `Lendas & Histórias` → `Lendas e Histórias`; `"Divina - 1º círculo"` → `spellType: 'Divina'`, `spellLevel: 1`.
- Nomes das 202 magias **não mudam** (a migração por nome de H2.3 depende disso). Total do arquivo continua 202.
- `OfficialSpell` ganha dois campos novos: `id: string` (slug estável) e `publication: string`. Nenhum outro contrato muda; `SpellPicker` e `spellToFormValues` continuam funcionando.
- Cliente: TypeScript `strict`, `noUnusedLocals`. Testes com vitest (`npm --prefix client run test`). Tipagem: `npx --prefix client tsc -b client` (ou `npm --prefix client run build`).
- Commits pequenos, um por tarefa, em português no padrão do repo (`feat(magias): …`, `chore(tools): …`).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `tools/import_grimorio_t20.py` (novo) | download+cache, parse, normalização, diff, geração do `spells.ts` |
| `tools/tests/test_import_grimorio_t20.py` (novo) | testes do parser/normalizador/gerador com fixtures HTML |
| `tools/tests/fixtures/grimorio/{3,221,list-small}.html` (novo) | fixtures: magia com Truque (JdA), magia de suplemento, lista curta |
| `tools/cache/grimorio/` (novo, ignorado) | HTML baixado |
| `.gitignore` | `tools/cache/` |
| `docs/catalogo-magias-diff-2026-08-26.md` (novo) | relatório do diff antes da regeneração |
| `client/src/data/spells.ts` | regenerado (interface + cabeçalho + 202 entradas com `id` e `publication`) |
| `client/src/data/spells.test.ts` (novo) | invariantes do catálogo: 202 entradas, ids únicos, contagens por círculo |
| `client/src/types/character.ts` | `Spell.catalogId?`, `Spell.overrides?` |
| `client/src/utils/spellCatalog.ts` (novo) + `.test.ts` | `hydrateSpell`, `migrateSpellCatalogIds`, `spellOverrides` |
| `client/src/components/sheet/SheetForm/entityForms.ts` | `spellToFormValues` grava `catalogId`; `magiaConfig.apply` recalcula `overrides` |
| `client/src/contexts/CharacterContext.tsx` | roda a hidratação em `loadCharacter`/`setCharacterDirect` |

---

### Task 1: Script — download com cache, parser da lista e do detalhe

**Files:**
- Create: `tools/import_grimorio_t20.py`
- Create: `tools/tests/__init__.py` (vazio), `tools/tests/test_import_grimorio_t20.py`
- Create: `tools/tests/fixtures/grimorio/3.html`, `tools/tests/fixtures/grimorio/221.html`, `tools/tests/fixtures/grimorio/list-small.html`
- Modify: `.gitignore` (adicionar `tools/cache/`)

**Interfaces:**
- Produces:
  - `fetch_html(url: str, cache_path: Path, *, session, delay: float = 1.0) -> str`
  - `parse_list(html: str) -> list[tuple[int, str]]` — `[(id, nome)]` na ordem da página
  - `parse_detail(html: str) -> dict` com chaves: `name, school, spellType, spellLevel (int), castingTime, range, area, duration, resistance, publication, description (str, só os parágrafos sem <b class="enhc">, unidos por "\n\n"), truque (str|None), enhancements (list[{"mpCost": int, "description": str}])`

- [ ] **Step 1: Baixar as fixtures (uma vez, com curl) e ignorar o cache**

```bash
mkdir -p tools/tests/fixtures/grimorio tools/cache/grimorio
curl -sS -A "arcanaforge-import/1.0" -o tools/tests/fixtures/grimorio/3.html   "https://eduardomarques.pythonanywhere.com/3/"
sleep 1
curl -sS -A "arcanaforge-import/1.0" -o tools/tests/fixtures/grimorio/221.html "https://eduardomarques.pythonanywhere.com/221/"
printf '\n# HTML baixado do Grimório T20 pelo tools/import_grimorio_t20.py\ntools/cache/\n' >> .gitignore
```

Criar `tools/tests/fixtures/grimorio/list-small.html` à mão com três âncoras no mesmo formato da lista real (o nome fica dentro de tags aninhadas, por isso o parser remove tags):

```html
<div class="list">
  <a class="spell" href="/3/"><span class="n">Abençoar Alimentos</span></a>
  <a class="spell" href="/108/"><span class="n">Lendas &amp; Histórias</span></a>
  <a class="spell" href="/221/">
     <span class="n">Açoite Flamejante</span>
  </a>
  <a href="/about/">Sobre</a>
</div>
```

- [ ] **Step 2: Escrever os testes do parser (falham: módulo não existe)**

`tools/tests/test_import_grimorio_t20.py`:

```python
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import import_grimorio_t20 as imp  # noqa: E402

FIX = Path(__file__).parent / "fixtures" / "grimorio"


def read(name: str) -> str:
    return (FIX / name).read_text(encoding="utf-8")


def test_parse_list_returns_numeric_ids_and_clean_names():
    assert imp.parse_list(read("list-small.html")) == [
        (3, "Abençoar Alimentos"),
        (108, "Lendas & Histórias"),
        (221, "Açoite Flamejante"),
    ]


def test_parse_detail_jda_spell_with_truque():
    d = imp.parse_detail(read("3.html"))
    assert d["name"] == "Abençoar Alimentos"
    assert d["school"] == "Transmutação"
    assert d["spellType"] == "Divina"
    assert d["spellLevel"] == 1
    assert d["castingTime"] == "padrão"
    assert d["range"] == "curto"
    assert d["area"] == "alimento para 1 criatura"
    assert d["duration"] == "cena"
    assert d["resistance"] == "nenhuma"
    assert d["publication"] == "Edição Jogo do Ano"
    assert d["description"].startswith("Você purifica e abençoa")
    assert "Truque" not in d["description"]
    assert d["truque"].startswith("o alimento é purificado")
    assert d["enhancements"] == [
        {"mpCost": 1, "description": "aumenta o número de alvos em +1."},
        {
            "mpCost": 1,
            "description": (
                "muda a duração para permanente, o alvo para 1 frasco com água e adiciona "
                "componente material (pó de prata no valor de T$ 5). Em vez do normal, cria um "
                "frasco de água benta."
            ),
        },
    ]


def test_parse_detail_supplement_spell_without_truque():
    d = imp.parse_detail(read("221.html"))
    assert d["name"] == "Açoite Flamejante"
    assert d["publication"] == "Ameaças de Arton"
    assert d["spellType"] == "Arcana"
    assert d["truque"] is None
    assert [e["mpCost"] for e in d["enhancements"]] == [2, 2, 5]
```

- [ ] **Step 3: Rodar para ver falhar**

Run: `python -m pytest tools/tests -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'import_grimorio_t20'`

- [ ] **Step 4: Implementar download+cache e parsers**

`tools/import_grimorio_t20.py` (primeira metade — o resto vem na Task 2):

```python
"""Importa o catálogo de magias do Grimório T20 para client/src/data/spells.ts.

Uso:
  python tools/import_grimorio_t20.py            # baixa (com cache), gera o diff em stdout
  python tools/import_grimorio_t20.py --report docs/catalogo-magias-diff-2026-08-26.md
  python tools/import_grimorio_t20.py --write    # regenera client/src/data/spells.ts

Fonte: https://eduardomarques.pythonanywhere.com/ (projeto de fã; "Tormenta 20 pertence a
Jambo Editora"). Uso responsável: 1 requisição por segundo, tudo cacheado em
tools/cache/grimorio/ — rodar de novo não baixa nada que já esteja lá.
"""
from __future__ import annotations

import argparse
import re
import sys
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE = "https://eduardomarques.pythonanywhere.com"
USER_AGENT = "arcanaforge-import/1.0 (+https://github.com/danillo/arcanaforge)"
ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "tools" / "cache" / "grimorio"
SPELLS_TS = ROOT / "client" / "src" / "data" / "spells.ts"

JDA = "Edição Jogo do Ano"
# Magias fora do básico que o nosso catálogo já tem: só estas entram das outras publicações.
EXTRA_SPELLS = {
    "Ameaças de Arton": {"Conjurar Mortos-Vivos", "Açoite Flamejante"},
    "Dragão Brasil": {"Disparo Gélido", "Detonação Congelante", "Geiser Cáustico"},
}
# Nome do site → nome do nosso catálogo (a migração por nome das fichas depende disso).
NAME_ALIASES = {"Lendas & Histórias": "Lendas e Histórias"}

_last_request = 0.0


def fetch_html(url: str, cache_path: Path, *, session: requests.Session | None = None, delay: float = 1.0) -> str:
    """GET com cache em disco e intervalo mínimo entre requisições reais."""
    global _last_request
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8")
    wait = delay - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    sess = session or requests.Session()
    resp = sess.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    _last_request = time.monotonic()
    resp.raise_for_status()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(resp.text, encoding="utf-8")
    return resp.text


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def parse_list(html: str) -> list[tuple[int, str]]:
    soup = BeautifulSoup(html, "html.parser")
    out: list[tuple[int, str]] = []
    for a in soup.find_all("a", href=True):
        m = re.fullmatch(r"/(\d+)/", a["href"])
        if not m:
            continue
        name = _clean(a.get_text(" "))
        if name:
            out.append((int(m.group(1)), name))
    return out


_ENH_RE = re.compile(r"^\+\s*(\d+)\s*PM\s*:?$", re.IGNORECASE)


def parse_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    name = _clean(soup.find("h1").get_text(" "))
    school = _clean(soup.find("h2").get_text(" "))
    type_circle = _clean(soup.find("h5").get_text(" "))
    m = re.match(r"^(Arcana|Divina|Universal)\s*-\s*(\d)º\s*círculo$", type_circle, re.IGNORECASE)
    if not m:
        raise ValueError(f"h5 inesperado em {name!r}: {type_circle!r}")
    spell_type, level = m.group(1).capitalize(), int(m.group(2))

    fields: dict[str, str] = {}
    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        fields[_clean(dt.get_text(" ")).rstrip(":")] = _clean(dd.get_text(" ")) if dd else ""

    description_parts: list[str] = []
    truque: str | None = None
    enhancements: list[dict] = []
    for p in soup.find_all("p"):
        label = p.find("b", class_="enhc")
        if label is None:
            text = _clean(p.get_text(" "))
            if text:
                description_parts.append(text)
            continue
        head = _clean(label.get_text(" ")).rstrip(":")
        body = _clean(p.get_text(" ")[len(label.get_text(" ")):]) if False else _clean(
            "".join(str(s) if isinstance(s, str) else s.get_text(" ") for s in label.next_siblings)
        )
        if head.lower() == "truque":
            truque = body
            continue
        em = _ENH_RE.match(head + ":") or _ENH_RE.match(head)
        if not em:
            raise ValueError(f"aprimoramento inesperado em {name!r}: {head!r}")
        enhancements.append({"mpCost": int(em.group(1)), "description": body})

    return {
        "name": name,
        "school": school,
        "spellType": spell_type,
        "spellLevel": level,
        "castingTime": fields.get("Execução", ""),
        "range": fields.get("Alcance", ""),
        "area": fields.get("Alvo/Área/Efeito", ""),
        "duration": fields.get("Duração", ""),
        "resistance": fields.get("Resistência", ""),
        "publication": fields.get("Publicação", ""),
        "description": "\n\n".join(description_parts),
        "truque": truque,
        "enhancements": enhancements,
    }
```

Observação de implementação: a expressão `body` acima deve ficar só com a segunda forma (juntar `label.next_siblings`); remova o `if False` ao escrever — ele está aí apenas para deixar explícito que **não** se deve fatiar por comprimento de string (o `<b>` tem espaços/quebras ao redor).

- [ ] **Step 5: Rodar os testes**

Run: `python -m pytest tools/tests -q`
Expected: 3 passed

- [ ] **Step 6: Commit**

```bash
git add tools/import_grimorio_t20.py tools/tests .gitignore
git commit -m "chore(tools): parser do Grimório T20 (lista + detalhe) com cache e fixtures"
```

---

### Task 2: Normalização, leitura do `spells.ts` atual, diff e gerador

**Files:**
- Modify: `tools/import_grimorio_t20.py`
- Modify: `tools/tests/test_import_grimorio_t20.py`

**Interfaces:**
- Consumes: `parse_detail` (Task 1)
- Produces:
  - `slugify(name: str) -> str` — `"Lágrimas de Wynna"` → `"lagrimas-de-wynna"`
  - `to_official(parsed: dict) -> dict` — aplica as convenções (resistência vazia, Truque na descrição, alias de nome) e adiciona `id`
  - `parse_spells_ts(text: str) -> list[dict]` — lê o formato regular do nosso arquivo
  - `diff_catalogs(ours: list[dict], theirs: list[dict]) -> DiffReport` com `.identical`, `.text_only`, `.mechanic` (listas de `(name, [(field, ours, theirs)])`) e `.render_markdown() -> str`
  - `render_spells_ts(spells: list[dict], *, source_note: str) -> str`
  - `main(argv) -> int`

- [ ] **Step 1: Testes de normalização, parser do TS, diff e gerador (falham)**

Acrescentar ao arquivo de testes:

```python
def test_slugify_strips_accents_and_punctuation():
    assert imp.slugify("Lágrimas de Wynna") == "lagrimas-de-wynna"
    assert imp.slugify("Lendas e Histórias") == "lendas-e-historias"
    assert imp.slugify("Círculo da Justiça (menor)") == "circulo-da-justica-menor"


def test_to_official_applies_catalog_conventions():
    d = imp.parse_detail(read("3.html"))
    o = imp.to_official(d)
    assert o["resistance"] == ""                      # "nenhuma" → vazio
    assert o["description"].endswith("Truque: o alimento é purificado (não causa nenhum efeito nocivo se estava estragado ou envenenado), mas não fornece bônus ao ser consumido.")
    assert "\n\nTruque: " in o["description"]
    assert o["id"] == "abencoar-alimentos"
    assert o["publication"] == "Edição Jogo do Ano"
    assert "truque" not in o


def test_to_official_renames_by_alias():
    d = imp.parse_detail(read("3.html")) | {"name": "Lendas & Histórias"}
    assert imp.to_official(d)["name"] == "Lendas e Histórias"


SAMPLE_TS = """
export const OFFICIAL_SPELLS: OfficialSpell[] = [
  {
    id: 'arma-magica',
    publication: 'Edição Jogo do Ano',
    name: 'Arma Mágica',
    school: 'Transmutação',
    spellType: 'Universal',
    spellLevel: 1,
    castingTime: 'padrão',
    range: 'toque',
    area: '1 arma',
    duration: 'cena',
    resistance: '',
    description: `A arma é considerada mágica.

Truque: nada.`,
    enhancements: [
      { mpCost: 2, description: `aumenta o bônus em +1.` },
    ],
  },
];
"""


def test_parse_spells_ts_reads_the_generated_format():
    spells = imp.parse_spells_ts(SAMPLE_TS)
    assert len(spells) == 1
    s = spells[0]
    assert s["name"] == "Arma Mágica" and s["spellLevel"] == 1 and s["area"] == "1 arma"
    assert s["description"] == "A arma é considerada mágica.\n\nTruque: nada."
    assert s["enhancements"] == [{"mpCost": 2, "description": "aumenta o bônus em +1."}]


def test_render_then_parse_roundtrip():
    spells = imp.parse_spells_ts(SAMPLE_TS)
    text = imp.render_spells_ts(spells, source_note="teste")
    assert imp.parse_spells_ts(text) == spells
    assert "export interface OfficialSpell" in text
    assert "export const OFFICIAL_SPELLS: OfficialSpell[] = [" in text


def test_diff_classifies_text_vs_mechanic():
    ours = imp.parse_spells_ts(SAMPLE_TS)
    theirs = [dict(ours[0], area="1 arma empunhada", description="A arma é considerada mágica e brilha.\n\nTruque: nada.")]
    rep = imp.diff_catalogs(ours, theirs)
    assert rep.identical == []
    assert [n for n, _ in rep.mechanic] == ["Arma Mágica"]
    fields = [f for _, changes in rep.mechanic for f, _, _ in changes]
    assert "area" in fields and "description" in fields
    md = rep.render_markdown()
    assert "Arma Mágica" in md and "1 arma empunhada" in md
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `python -m pytest tools/tests -q`
Expected: FAIL — `AttributeError: module 'import_grimorio_t20' has no attribute 'slugify'` (e seguintes)

- [ ] **Step 3: Implementar normalização, parser do TS, diff e gerador**

Acrescentar ao script:

```python
def slugify(name: str) -> str:
    base = unicodedata.normalize("NFD", name)
    base = "".join(ch for ch in base if unicodedata.category(ch) != "Mn")
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    return base


NO_RESISTANCE = {"", "nenhuma", "nenhum", "-", "—"}


def to_official(parsed: dict) -> dict:
    name = NAME_ALIASES.get(parsed["name"], parsed["name"])
    description = parsed["description"]
    if parsed.get("truque"):
        description = f"{description}\n\nTruque: {parsed['truque']}"
    resistance = parsed["resistance"].strip()
    if resistance.lower() in NO_RESISTANCE:
        resistance = ""
    return {
        "id": slugify(name),
        "publication": parsed["publication"],
        "name": name,
        "school": parsed["school"],
        "spellType": parsed["spellType"],
        "spellLevel": parsed["spellLevel"],
        "castingTime": parsed["castingTime"],
        "range": parsed["range"],
        "area": parsed["area"],
        "duration": parsed["duration"],
        "resistance": resistance,
        "description": description,
        "enhancements": [dict(e) for e in parsed["enhancements"]],
    }


# ---------- leitura do spells.ts (formato regular gerado por este script) ----------

_ENTRY_RE = re.compile(r"^  \{\n(.*?)\n  \},", re.S | re.M)
_STR_FIELD_RE = re.compile(r"^    (\w+): '((?:\\'|[^'])*)',$", re.M)
_INT_FIELD_RE = re.compile(r"^    (\w+): (\d+),$", re.M)
_DESC_RE = re.compile(r"^    description: `((?:\\`|[^`])*)`,$", re.M | re.S)
_ENH_RE_TS = re.compile(r"\{ mpCost: (\d+), description: `((?:\\`|[^`])*)` \}")


def _unescape_sq(s: str) -> str:
    return s.replace("\\'", "'").replace("\\\\", "\\")


def _unescape_bt(s: str) -> str:
    return s.replace("\\`", "`").replace("\\${", "${").replace("\\\\", "\\")


def parse_spells_ts(text: str) -> list[dict]:
    spells: list[dict] = []
    for m in _ENTRY_RE.finditer(text):
        body = m.group(1)
        entry: dict = {}
        for fm in _STR_FIELD_RE.finditer(body):
            entry[fm.group(1)] = _unescape_sq(fm.group(2))
        for im in _INT_FIELD_RE.finditer(body):
            entry[im.group(1)] = int(im.group(2))
        dm = _DESC_RE.search(body)
        entry["description"] = _unescape_bt(dm.group(1)) if dm else ""
        enh_block = body.split("enhancements: [", 1)[1] if "enhancements: [" in body else ""
        entry["enhancements"] = [
            {"mpCost": int(em.group(1)), "description": _unescape_bt(em.group(2))}
            for em in _ENH_RE_TS.finditer(enh_block)
        ]
        spells.append(entry)
    return spells


# ---------- diff ----------

MECHANIC_FIELDS = ("spellLevel", "spellType", "school", "castingTime", "range", "area", "duration", "resistance")
TEXT_FIELDS = ("description",)


@dataclass
class DiffReport:
    identical: list[str]
    text_only: list[tuple[str, list[tuple[str, str, str]]]]
    mechanic: list[tuple[str, list[tuple[str, str, str]]]]
    only_ours: list[str]
    only_theirs: list[str]

    def render_markdown(self) -> str:
        lines = ["# Diff do catálogo de magias — Grimório T20 × spells.ts", ""]
        lines.append(f"- Idênticas: **{len(self.identical)}**")
        lines.append(f"- Só redação (descrição/texto de aprimoramento): **{len(self.text_only)}**")
        lines.append(f"- Com diferença de mecânica (círculo, tipo, escola, execução, alcance, alvo, duração, resistência, custo/quantidade de aprimoramentos): **{len(self.mechanic)}**")
        if self.only_ours:
            lines.append(f"- Só no nosso catálogo: {', '.join(self.only_ours)}")
        if self.only_theirs:
            lines.append(f"- Só no site: {', '.join(self.only_theirs)}")
        for title, group in (("## Diferenças de mecânica", self.mechanic), ("## Só redação", self.text_only)):
            lines += ["", title, ""]
            for name, changes in group:
                lines.append(f"### {name}")
                for field, ours, theirs in changes:
                    lines.append(f"- **{field}**")
                    lines.append(f"  - nosso: {ours}")
                    lines.append(f"  - site: {theirs}")
                lines.append("")
        return "\n".join(lines)


def _enh_signature(enhs: list[dict]) -> str:
    return ";".join(f"+{e['mpCost']}" for e in enhs)


def diff_catalogs(ours: list[dict], theirs: list[dict]) -> DiffReport:
    ours_by = {s["name"]: s for s in ours}
    theirs_by = {s["name"]: s for s in theirs}
    rep = DiffReport([], [], [], sorted(set(ours_by) - set(theirs_by)), sorted(set(theirs_by) - set(ours_by)))
    for name in sorted(set(ours_by) & set(theirs_by)):
        a, b = ours_by[name], theirs_by[name]
        mech: list[tuple[str, str, str]] = []
        text: list[tuple[str, str, str]] = []
        for f in MECHANIC_FIELDS:
            if str(a.get(f, "")) != str(b.get(f, "")):
                mech.append((f, str(a.get(f, "")), str(b.get(f, ""))))
        if _enh_signature(a["enhancements"]) != _enh_signature(b["enhancements"]):
            mech.append(("enhancements(custos)", _enh_signature(a["enhancements"]), _enh_signature(b["enhancements"])))
        else:
            for i, (ea, eb) in enumerate(zip(a["enhancements"], b["enhancements"])):
                if ea["description"] != eb["description"]:
                    text.append((f"enhancements[{i}]", ea["description"], eb["description"]))
        for f in TEXT_FIELDS:
            if a.get(f, "") != b.get(f, ""):
                text.append((f, a.get(f, ""), b.get(f, "")))
        if mech:
            rep.mechanic.append((name, mech + text))
        elif text:
            rep.text_only.append((name, text))
        else:
            rep.identical.append(name)
    return rep


# ---------- geração do spells.ts ----------

def _sq(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def _bt(s: str) -> str:
    return "`" + s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${") + "`"


HEADER = """export interface SpellEnhancement {
  mpCost: number;
  description: string;
}

export interface OfficialSpell {
  /** Slug estável (nome sem acento, kebab-case) — a ficha referencia o catálogo por ele. */
  id: string;
  /** Publicação de origem no Grimório T20 (ex.: "Edição Jogo do Ano", "Ameaças de Arton"). */
  publication: string;
  name: string;
  school: string;
  spellType: 'Arcana' | 'Divina' | 'Universal';
  spellLevel: number;
  castingTime: string;
  range: string;
  area: string;
  duration: string;
  resistance: string;
  description: string;
  enhancements: SpellEnhancement[];
}
"""


def render_spells_ts(spells: list[dict], *, source_note: str) -> str:
    by_level: dict[int, int] = {}
    for s in spells:
        by_level[s["spellLevel"]] = by_level.get(s["spellLevel"], 0) + 1
    counts = ", ".join(f"{by_level.get(l, 0)} de {l}º" for l in range(1, 6))
    out = [HEADER, "/**", " * Catálogo de magias de Tormenta 20, por círculo.", " *",
           f" * {len(spells)} entradas: {counts}.", " *"]
    out += [f" * {line}" if line else " *" for line in source_note.splitlines()]
    out += [" *",
            ' * Regenerado por `python tools/import_grimorio_t20.py --write` — NÃO edite à mão;',
            " * ajuste o script (aliases, convenções) e rode de novo. Checagens rápidas:",
            ' * `grep -c "^  {"`, `grep -o "spellLevel: [0-9]" | sort | uniq -c` e',
            " * `grep -o \"^    name: '[^']*'\" | sort | uniq -d` (duplicatas).",
            " */",
            "export const OFFICIAL_SPELLS: OfficialSpell[] = ["]
    for s in sorted(spells, key=lambda x: (x["spellLevel"], slugify(x["name"]))):
        out.append("  {")
        out.append(f"    id: {_sq(s['id'])},")
        out.append(f"    publication: {_sq(s['publication'])},")
        out.append(f"    name: {_sq(s['name'])},")
        out.append(f"    school: {_sq(s['school'])},")
        out.append(f"    spellType: {_sq(s['spellType'])},")
        out.append(f"    spellLevel: {s['spellLevel']},")
        for f in ("castingTime", "range", "area", "duration", "resistance"):
            out.append(f"    {f}: {_sq(s[f])},")
        out.append(f"    description: {_bt(s['description'])},")
        out.append("    enhancements: [")
        for e in s["enhancements"]:
            out.append(f"      {{ mpCost: {e['mpCost']}, description: {_bt(e['description'])} }},")
        out.append("    ],")
        out.append("  },")
    out.append("];")
    return "\n".join(out) + "\n"
```

Atenção: `parse_spells_ts` só entende o formato **gerado**; o `spells.ts` atual segue esse mesmo layout (4 espaços, `name: '…'`, `description: \`…\``, aprimoramentos numa linha cada), então funciona para o diff inicial. Se algum campo do arquivo atual não bater (ex.: `id`/`publication` ausentes), o dict simplesmente não tem a chave — o diff só compara os campos de `MECHANIC_FIELDS`/`TEXT_FIELDS`.

- [ ] **Step 4: Implementar `main` (download de tudo, diff, `--report`, `--write`)**

```python
def collect(session: requests.Session | None = None) -> list[dict]:
    """Baixa a lista JdA + as publicações dos extras e devolve as 202 magias normalizadas."""
    wanted: dict[str, set[str] | None] = {JDA: None, **EXTRA_SPELLS}
    spells: list[dict] = []
    seen: set[str] = set()
    for publication, only in wanted.items():
        list_html = fetch_html(
            f"{BASE}/?book_magazine={requests.utils.quote(publication)}",
            CACHE_DIR / f"list-{slugify(publication)}.html",
            session=session,
        )
        for spell_id, site_name in parse_list(list_html):
            name = NAME_ALIASES.get(site_name, site_name)
            if only is not None and name not in only:
                continue
            if name in seen:
                continue
            detail = fetch_html(f"{BASE}/{spell_id}/", CACHE_DIR / f"{spell_id}.html", session=session)
            spells.append(to_official(parse_detail(detail)))
            seen.add(name)
    return spells


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--write", action="store_true", help="regenera client/src/data/spells.ts")
    ap.add_argument("--report", type=Path, help="grava o diff em markdown neste arquivo")
    args = ap.parse_args(argv)

    theirs = collect()
    ours = parse_spells_ts(SPELLS_TS.read_text(encoding="utf-8")) if SPELLS_TS.exists() else []
    report = diff_catalogs(ours, theirs)
    md = report.render_markdown()
    if args.report:
        args.report.write_text(md, encoding="utf-8")
        print(f"relatório: {args.report}")
    else:
        print(md)

    ids = [s["id"] for s in theirs]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        print(f"ERRO: ids duplicados: {dup}", file=sys.stderr)
        return 2

    if args.write:
        note = (
            f"Texto, aprimoramentos e campos de bloco importados do Grimório T20\n"
            f"(https://eduardomarques.pythonanywhere.com/) em {time.strftime('%d/%m/%Y')}:\n"
            f"filtro \"Edição Jogo do Ano\" ({sum(1 for s in theirs if s['publication'] == JDA)} magias) mais\n"
            f"{sum(1 for s in theirs if s['publication'] != JDA)} de suplemento já presentes no catálogo\n"
            f"(Ameaças de Arton, Dragão Brasil). Convenções locais: Resistência vazia em vez de\n"
            f"\"nenhuma\"; Truque como último parágrafo da descrição; \"Lendas e Histórias\" (site usa &)."
        )
        SPELLS_TS.write_text(render_spells_ts(theirs, source_note=note), encoding="utf-8")
        print(f"gravado: {SPELLS_TS} ({len(theirs)} magias)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 5: Rodar os testes**

Run: `python -m pytest tools/tests -q`
Expected: 9 passed

- [ ] **Step 6: Rodar o diff real (sem `--write`) e guardar o relatório**

Run: `python tools/import_grimorio_t20.py --report docs/catalogo-magias-diff-2026-08-26.md`
Expected: baixa ~205 páginas (≈ 4 min na primeira vez), imprime `relatório: docs/...`. Abrir o arquivo e conferir: `Só no nosso catálogo` e `Só no site` devem estar **vazios** (202 = 202). Se aparecer algum nome, é alias faltando em `NAME_ALIASES` — corrigir e rodar de novo (o cache evita novo download).

- [ ] **Step 7: Commit**

```bash
git add tools/import_grimorio_t20.py tools/tests docs/catalogo-magias-diff-2026-08-26.md
git commit -m "chore(tools): diff e gerador do catálogo de magias a partir do Grimório T20"
```

---

### Task 3: Regenerar `spells.ts` e travar invariantes com teste

**Files:**
- Modify: `client/src/data/spells.ts` (regenerado)
- Create: `client/src/data/spells.test.ts`

**Interfaces:**
- Produces: `OfficialSpell.id`, `OfficialSpell.publication` (Task 4 usa `id`)

- [ ] **Step 1: Escrever o teste de invariantes (falha: `id` não existe ainda)**

`client/src/data/spells.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { OFFICIAL_SPELLS } from './spells';

describe('OFFICIAL_SPELLS (catálogo)', () => {
  it('tem 202 magias: 197 da Edição Jogo do Ano + 5 de suplemento', () => {
    expect(OFFICIAL_SPELLS).toHaveLength(202);
    expect(OFFICIAL_SPELLS.filter((s) => s.publication === 'Edição Jogo do Ano')).toHaveLength(197);
  });

  it('tem ids únicos, em kebab-case sem acento', () => {
    const ids = OFFICIAL_SPELLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('não tem nomes duplicados e mantém os nomes usados pelas fichas', () => {
    const names = OFFICIAL_SPELLS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('Lendas e Histórias');
    expect(names).toContain('Heroísmo');
    expect(names).toContain('Conjurar Mortos-Vivos');
  });

  it('só usa os três tipos e círculos de 1 a 5', () => {
    OFFICIAL_SPELLS.forEach((s) => {
      expect(['Arcana', 'Divina', 'Universal']).toContain(s.spellType);
      expect(s.spellLevel).toBeGreaterThanOrEqual(1);
      expect(s.spellLevel).toBeLessThanOrEqual(5);
    });
  });

  it('nunca grava "nenhuma" em resistance (convenção: vazio)', () => {
    OFFICIAL_SPELLS.forEach((s) => expect(s.resistance.toLowerCase()).not.toBe('nenhuma'));
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm --prefix client run test -- spells`
Expected: FAIL — `Property 'publication' does not exist` / length assertions

- [ ] **Step 3: Regenerar o arquivo**

Run: `python tools/import_grimorio_t20.py --write`
Expected: `gravado: .../client/src/data/spells.ts (202 magias)`

Conferir contagens:

```bash
grep -c "^  {" client/src/data/spells.ts            # 202
grep -o "spellLevel: [0-9]" client/src/data/spells.ts | sort | uniq -c
grep -o "^    name: '[^']*'" client/src/data/spells.ts | sort | uniq -d   # vazio
```

- [ ] **Step 4: Rodar testes e tipagem do cliente**

Run: `npm --prefix client run test` e `npx --prefix client tsc -b client`
Expected: todos os testes verdes (inclusive `spells.test.ts`); `tsc` sem erros. Se `SpellPicker`/`entityForms` reclamarem de `OfficialSpell`, é porque ganharam campos obrigatórios novos em algum literal de teste — completar os literais com `id`/`publication`.

- [ ] **Step 5: Ler o relatório e registrar as mudanças de mecânica**

Abrir `docs/catalogo-magias-diff-2026-08-26.md`, seção "Diferenças de mecânica", e copiar os **nomes** das magias dessa seção para a mensagem de commit (é o que a mesa precisa saber). Não editar o `spells.ts` à mão.

- [ ] **Step 6: Commit**

```bash
git add client/src/data/spells.ts client/src/data/spells.test.ts
git commit -m "feat(magias): catálogo regenerado do Grimório T20 (Edição Jogo do Ano)

202 magias (197 JdA + 5 de suplemento), agora com id e publication.
Mudanças de mecânica em relação ao texto antigo (ver docs/catalogo-magias-diff-2026-08-26.md):
<lista de nomes da seção 'Diferenças de mecânica'>"
```

---

### Task 4: Ficha referencia o catálogo por id (hidratação + migração por nome)

**Files:**
- Modify: `client/src/types/character.ts` (`Spell`)
- Create: `client/src/utils/spellCatalog.ts`, `client/src/utils/spellCatalog.test.ts`
- Modify: `client/src/components/sheet/SheetForm/entityForms.ts` (`spellToFormValues`, `magiaConfig.apply`)
- Modify: `client/src/contexts/CharacterContext.tsx` (`loadCharacter`, `setCharacterDirect`)

**Interfaces:**
- Consumes: `OFFICIAL_SPELLS` com `id` (Task 3)
- Produces:
  - `Spell.catalogId?: string`, `Spell.overrides?: string[]`
  - `HYDRATED_FIELDS = ['school','spellType?','castingTime','range','area','duration','resistance','description','enhancements'] as const` — os campos que vêm do catálogo quando não editados (`mpCost`, `summary`, `buffs`, `attackModifiers`, `buffTargetScope` são sempre do jogador)
  - `hydrateSpell(spell: Spell, catalog?: OfficialSpell[]): Spell`
  - `hydrateSpells(spells: Spell[], catalog?: OfficialSpell[]): Spell[]` — também **migra** por nome (`normalizeSearch`) as magias sem `catalogId`, marcando como `overrides` os campos que já diferem do catálogo
  - `computeSpellOverrides(next: Spell, catalog: OfficialSpell): string[]`

- [ ] **Step 1: Escrever os testes (falham)**

`client/src/utils/spellCatalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Spell } from '../types/character';
import type { OfficialSpell } from '../data/spells';
import { hydrateSpell, hydrateSpells, computeSpellOverrides } from './spellCatalog';

const catalog: OfficialSpell[] = [
  {
    id: 'arma-magica', publication: 'Edição Jogo do Ano', name: 'Arma Mágica', school: 'Transmutação',
    spellType: 'Universal', spellLevel: 1, castingTime: 'padrão', range: 'toque', area: '1 arma empunhada',
    duration: 'cena', resistance: '', description: 'Texto novo do catálogo.',
    enhancements: [{ mpCost: 2, description: 'aumenta o bônus em +1.' }],
  },
  {
    id: 'silencio', publication: 'Edição Jogo do Ano', name: 'Silêncio', school: 'Ilusão', spellType: 'Arcana',
    spellLevel: 2, castingTime: 'padrão', range: 'curto', area: 'esfera de 6m', duration: 'cena',
    resistance: '', description: 'Silencia.', enhancements: [],
  },
];

function sheetSpell(overrides: Partial<Spell> = {}): Spell {
  return {
    name: 'Arma Mágica', school: 'Transmutação', castingTime: 'padrão', range: 'toque', area: '1 arma',
    duration: 'cena', resistance: '', mpCost: 1, spellLevel: 1, description: 'Texto antigo.',
    enhancements: [{ mpCost: 2, description: 'aumenta o bônus em +1.' }],
    ...overrides,
  };
}

describe('hydrateSpell', () => {
  it('sem catalogId devolve a magia intacta', () => {
    const sp = sheetSpell();
    expect(hydrateSpell(sp, catalog)).toBe(sp);
  });

  it('com catalogId, campos não editados vêm do catálogo e os editados prevalecem', () => {
    const sp = sheetSpell({ catalogId: 'arma-magica', overrides: ['area'], mpCost: 3, summary: 'meu resumo' });
    const out = hydrateSpell(sp, catalog);
    expect(out.description).toBe('Texto novo do catálogo.');   // não editado → catálogo
    expect(out.area).toBe('1 arma');                            // override → mantém
    expect(out.mpCost).toBe(3);                                 // sempre do jogador
    expect(out.summary).toBe('meu resumo');
  });

  it('preserva buffs/attackModifiers dos aprimoramentos ao trazer o texto novo', () => {
    const sp = sheetSpell({
      catalogId: 'arma-magica',
      enhancements: [{ mpCost: 2, description: 'texto antigo', buffs: [{ type: 'attack_roll', value: '1' }] }],
    });
    const out = hydrateSpell(sp, catalog);
    expect(out.enhancements[0].description).toBe('aumenta o bônus em +1.');
    expect(out.enhancements[0].buffs).toEqual([{ type: 'attack_roll', value: '1' }]);
  });

  it('id inexistente no catálogo não quebra: devolve a magia salva', () => {
    const sp = sheetSpell({ catalogId: 'nao-existe' });
    expect(hydrateSpell(sp, catalog)).toEqual(sp);
  });
});

describe('hydrateSpells (migração por nome)', () => {
  it('atribui catalogId por nome (sem acento/caixa) e marca como override o que já difere', () => {
    const [out] = hydrateSpells([sheetSpell({ name: 'arma magica', description: 'Texto antigo.' })], catalog);
    expect(out.catalogId).toBe('arma-magica');
    expect(out.name).toBe('Arma Mágica');
    // area '1 arma' ≠ '1 arma empunhada' e description diferem → viram overrides, mantidos
    expect(out.overrides).toEqual(expect.arrayContaining(['area', 'description']));
    expect(out.area).toBe('1 arma');
    expect(out.description).toBe('Texto antigo.');
  });

  it('não casa nomes parecidos ("Silêncio" ≠ "Silêncio Maior")', () => {
    const [out] = hydrateSpells([sheetSpell({ name: 'Silêncio Maior' })], catalog);
    expect(out.catalogId).toBeUndefined();
  });

  it('é idempotente', () => {
    const once = hydrateSpells([sheetSpell()], catalog);
    expect(hydrateSpells(once, catalog)).toEqual(once);
  });
});

describe('computeSpellOverrides', () => {
  it('lista só os campos hidratáveis que diferem do catálogo', () => {
    const next = sheetSpell({ catalogId: 'arma-magica', area: '1 arma', description: 'Texto novo do catálogo.' });
    expect(computeSpellOverrides(next, catalog[0])).toEqual(['area']);
  });

  it('aprimoramento com texto ou custo diferente conta como override de enhancements', () => {
    const next = sheetSpell({ catalogId: 'arma-magica', area: '1 arma empunhada', description: 'Texto novo do catálogo.',
      enhancements: [{ mpCost: 3, description: 'aumenta o bônus em +1.' }] });
    expect(computeSpellOverrides(next, catalog[0])).toEqual(['enhancements']);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npm --prefix client run test -- spellCatalog`
Expected: FAIL — módulo `./spellCatalog` não existe

- [ ] **Step 3: Tipos**

Em `client/src/types/character.ts`, na interface `Spell`, logo após `attackModifiers?: AttackModifier[];`:

```ts
  /** Slug do catálogo (`OfficialSpell.id`) de onde esta magia veio. Ausente = magia
   * personalizada; nada é hidratado. */
  catalogId?: string;
  /** Campos hidratáveis que o jogador editou à mão — prevalecem sobre o catálogo na
   * leitura (ver utils/spellCatalog.ts). */
  overrides?: string[];
```

- [ ] **Step 4: Implementar `utils/spellCatalog.ts`**

```ts
import type { Spell, Enhancement } from '../types/character';
import { OFFICIAL_SPELLS, type OfficialSpell } from '../data/spells';
import { normalizeSearch } from './formatters';

/** Campos que a hidratação traz do catálogo quando o jogador não os editou. `mpCost`,
 * `summary`, `buffs`, `attackModifiers` e `buffTargetScope` são sempre do jogador. */
export const HYDRATED_FIELDS = [
  'school', 'castingTime', 'range', 'area', 'duration', 'resistance', 'description', 'enhancements',
] as const;
export type HydratedField = (typeof HYDRATED_FIELDS)[number];

function enhancementsSignature(list: Array<{ mpCost: number; description: string }> | undefined): string {
  return (list ?? []).map((e) => `${Number(e.mpCost) || 0}|${(e.description ?? '').trim()}`).join(' ');
}

function fieldDiffers(field: HydratedField, spell: Spell, official: OfficialSpell): boolean {
  if (field === 'enhancements') {
    return enhancementsSignature(spell.enhancements) !== enhancementsSignature(official.enhancements);
  }
  return String(spell[field] ?? '').trim() !== String(official[field] ?? '').trim();
}

/** Campos hidratáveis em que a magia da ficha difere do catálogo — o que vira `overrides`. */
export function computeSpellOverrides(spell: Spell, official: OfficialSpell): string[] {
  return HYDRATED_FIELDS.filter((f) => fieldDiffers(f, spell, official));
}

/** Texto/custo dos aprimoramentos vêm do catálogo; `buffs`/`attackModifiers` que o jogador
 * configurou em cada linha ficam (casados por posição). */
function mergeEnhancements(mine: Enhancement[] | undefined, official: OfficialSpell['enhancements']): Enhancement[] {
  return official.map((o, i) => {
    const m = mine?.[i];
    return {
      mpCost: o.mpCost,
      description: o.description,
      ...(m?.buffs ? { buffs: m.buffs } : {}),
      ...(m?.attackModifiers ? { attackModifiers: m.attackModifiers } : {}),
    };
  });
}

export function hydrateSpell(spell: Spell, catalog: OfficialSpell[] = OFFICIAL_SPELLS): Spell {
  if (!spell.catalogId) return spell;
  const official = catalog.find((s) => s.id === spell.catalogId);
  if (!official) return spell;
  const overrides = new Set(spell.overrides ?? []);
  const next: Spell = { ...spell };
  for (const field of HYDRATED_FIELDS) {
    if (overrides.has(field)) continue;
    if (field === 'enhancements') next.enhancements = mergeEnhancements(spell.enhancements, official.enhancements);
    else next[field] = official[field];
  }
  return next;
}

function findByName(name: string, catalog: OfficialSpell[]): OfficialSpell | undefined {
  const key = normalizeSearch(name);
  if (!key) return undefined;
  return catalog.find((s) => normalizeSearch(s.name) === key);
}

/**
 * Migração de leitura + hidratação. Magia sem `catalogId` cujo nome casa exatamente
 * (sem acento/caixa) com o catálogo recebe o id e guarda como `overrides` o que já
 * diferia — assim o texto novo do catálogo entra, mas nada que o jogador tinha se perde.
 * Idempotente: na segunda passada todas já têm id e a hidratação é estável.
 */
export function hydrateSpells(spells: Spell[], catalog: OfficialSpell[] = OFFICIAL_SPELLS): Spell[] {
  return (spells ?? []).map((spell) => {
    if (spell.catalogId) return hydrateSpell(spell, catalog);
    const official = findByName(spell.name, catalog);
    if (!official) return spell;
    const migrated: Spell = {
      ...spell,
      name: official.name,
      catalogId: official.id,
      overrides: computeSpellOverrides(spell, official),
    };
    return hydrateSpell(migrated, catalog);
  });
}
```

Se `tsc` reclamar do `next[field] = official[field]` (união de tipos), trocar por um `switch` explícito por campo ou por `(next as Record<HydratedField, unknown>)[field] = official[field]`.

- [ ] **Step 5: `spellToFormValues` grava `catalogId`; `magiaConfig.apply` recalcula `overrides`**

Em `entityForms.ts`, `spellToFormValues` ganha `catalogId: spell.id,` e o `magiaConfig`:
- `empty()` ganha `catalogId: ''`;
- `fromEntry` ganha `catalogId: sp.catalogId ?? ''`;
- `apply` — depois de montar `entry`, se `s(v.catalogId)` não for vazio, achar `OFFICIAL_SPELLS.find((o) => o.id === catalogId)` e gravar `entry.catalogId = catalogId; entry.overrides = official ? computeSpellOverrides(entry, official) : base.overrides`. Importar `computeSpellOverrides` de `utils/spellCatalog` e `OFFICIAL_SPELLS` de `data/spells` (o `entityForms.ts` já importa o tipo `OfficialSpell` — o import de valor do catálogo aqui é aceitável porque o form de magia já depende dele para o picker; se o bundle inicial crescer demais, mover o cálculo de overrides para `hydrateSpells` na leitura e deixar `apply` só gravar `catalogId`).
- `spellFields` **não** ganha campo visível de `catalogId` — o valor viaja escondido no `FormValues` (campo ausente da lista de `fields` não é renderizado, mas é preservado no draft porque `initialValues` o inclui).

- [ ] **Step 6: Rodar na leitura**

Em `CharacterContext.tsx`, `loadCharacter` e `setCharacterDirect` já montam `{ ...data, buffs: normalizeBuffs(...), damageReductions: normalizeDamageReductions(...) }` — acrescentar `spells: hydrateSpells(data.spells)` (importar de `../utils/spellCatalog`). O import puxa `OFFICIAL_SPELLS` (~250 KB) para o bundle inicial; aceitável nesta rodada — registrar em comentário que a alternativa é `import()` dinâmico após o primeiro render.

- [ ] **Step 7: Rodar testes + tipagem**

Run: `npm --prefix client run test` e `npx --prefix client tsc -b client`
Expected: verdes.

- [ ] **Step 8: Commit**

```bash
git add client/src/types/character.ts client/src/utils/spellCatalog.ts client/src/utils/spellCatalog.test.ts client/src/components/sheet/SheetForm/entityForms.ts client/src/contexts/CharacterContext.tsx
git commit -m "feat(magias): ficha referencia o catálogo por catalogId e é hidratada na leitura

Magias já cadastradas são migradas por nome; campos editados pelo jogador viram overrides e prevalecem."
```

---

## Self-review

- **Cobertura da spec:** H2.1 → Tasks 1–2 (script, cache, normalização, diff, relatório em `docs/`, fixtures, docstring); H2.2 → Task 3 (regeneração, `publication`, nomes preservados, contagens, testes verdes, mecânica listada no commit); H2.3 → Task 4 (`catalogId`, hidratação, `overrides`, migração por nome com `normalizeSearch`, idempotência, testes incl. "Silêncio" × "Silêncio Maior", aprimoramentos do catálogo podendo carregar mecânica — o `mergeEnhancements` preserva `buffs`/`attackModifiers` por posição).
- **Questão aberta do backlog (Truque):** decidida como "dentro da descrição" (Global Constraints) — sem mudança de UI.
- **Placeholders:** nenhum; o único trecho a ajustar ao digitar é o `body` em `parse_detail` (nota explícita).
- **Consistência de nomes:** `slugify`/`to_official`/`parse_spells_ts`/`diff_catalogs`/`render_spells_ts`/`collect`/`main` (Python); `hydrateSpell`/`hydrateSpells`/`computeSpellOverrides`/`HYDRATED_FIELDS` (TS) — usados com os mesmos nomes em todas as tarefas.
