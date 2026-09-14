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
    "Dragão Brasil": {"Disparo Gélido", "Detonação Congelante", "Gêiser Cáustico"},
}
# Nome do site → nome do nosso catálogo (a migração por nome das fichas depende disso).
NAME_ALIASES = {
    "Lendas & Histórias": "Lendas e Histórias",
    "Geiser Cáustico": "Gêiser Cáustico",
    "Proteção Contra Magia": "Proteção contra Magia",
}
# (nome do nosso catálogo, campo) → valor. Erros de digitação do site no bloco da magia,
# conferidos no HTML bruto (o <dd> de Alcance traz um pedaço do campo seguinte colado).
FIELD_FIXES: dict[tuple[str, str], str] = {
    ("Área Escorregadia", "range"): "curto",          # site: "curtoAlvo ou"
    ("Explosão Caleidoscópica", "range"): "curto",    # site: "curto Área: esfera com 6m de raio"
}

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


# Marcador temporário de <br>: não é espaço, então sobrevive ao _clean (que colapsa as quebras
# de linha "duras" do HTML) e depois vira o separador pedido.
_BR = "\x00"


def _paragraphs(raw: str, sep: str) -> str:
    parts = [_clean(part) for part in raw.split(_BR)]
    return sep.join(p for p in parts if p)


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


# "+2 PM:" ou, em algumas magias (ex.: Luz), "+2 PM (Apenas Divinos):" — o qualificador vai
# para o início da descrição, entre parênteses, como o catálogo já fazia.
_ENH_RE = re.compile(r"^\+\s*(\d+)\s*PM\s*(?:\((?P<qualifier>[^()]+)\))?\s*:?$", re.IGNORECASE)


def parse_detail(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    # O site usa <br> dentro do <p> para listas de opções ("Fogo. …", "• Curar…"): na
    # descrição vira parágrafo (convenção do catálogo); em aprimoramento/truque, espaço.
    for br in soup.find_all("br"):
        br.replace_with(_BR)
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
            text = _paragraphs(p.get_text(" "), "\n\n")
            if text:
                description_parts.append(text)
            continue
        head = _clean(label.get_text(" ")).rstrip(":")
        # Corpo = tudo que vem depois do <b> dentro do <p>. Não fatiar por comprimento de
        # string: o <b> tem espaços/quebras ao redor.
        body = _paragraphs(
            "".join(str(s) if isinstance(s, str) else s.get_text(" ") for s in label.next_siblings),
            " ",
        )
        if head.lower() == "truque":
            truque = body
            continue
        em = _ENH_RE.match(head + ":") or _ENH_RE.match(head)
        if not em:
            raise ValueError(f"aprimoramento inesperado em {name!r}: {head!r}")
        qualifier = _clean(em.group("qualifier") or "")
        if qualifier:
            body = f"({qualifier}) {body}"
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


# ---------- normalização para as convenções do nosso catálogo ----------

def slugify(name: str) -> str:
    base = unicodedata.normalize("NFD", name)
    base = "".join(ch for ch in base if unicodedata.category(ch) != "Mn")
    base = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    return base


NO_RESISTANCE = {"", "nenhuma", "nenhum", "-", "—"}
BLOCK_FIELDS = ("castingTime", "range", "area", "duration", "resistance")


def _norm_block(value: str) -> str:
    """Campo do bloco (execução, alcance, alvo, duração, resistência): o site ora fecha com
    ponto ("Vontade parcial."), ora não; o catálogo nunca fecha."""
    return re.sub(r"[.;]+$", "", _clean(value)).strip()


def to_official(parsed: dict) -> dict:
    name = NAME_ALIASES.get(parsed["name"], parsed["name"])
    description = parsed["description"]
    if parsed.get("truque"):
        description = f"{description}\n\nTruque: {parsed['truque']}"
    block = {f: _norm_block(parsed[f]) for f in BLOCK_FIELDS}
    for (fix_name, field), value in FIELD_FIXES.items():
        if fix_name == name:
            block[field] = value
    if block["resistance"].lower() in NO_RESISTANCE:
        block["resistance"] = ""
    return {
        "id": slugify(name),
        "publication": parsed["publication"],
        "name": name,
        "school": parsed["school"],
        "spellType": parsed["spellType"],
        "spellLevel": parsed["spellLevel"],
        **block,
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


# ---------- download de tudo + CLI ----------

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
            f"\"nenhuma\"; Truque como último parágrafo da descrição; \"Lendas e Histórias\" (site usa &);\n"
            f"\"Gêiser Cáustico\" (site grafa sem acento); campos do bloco sem ponto final; alcance de\n"
            f"Área Escorregadia e Explosão Caleidoscópica corrigido para \"curto\" (erro de digitação no site)."
        )
        SPELLS_TS.write_text(render_spells_ts(theirs, source_note=note), encoding="utf-8")
        print(f"gravado: {SPELLS_TS} ({len(theirs)} magias)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
