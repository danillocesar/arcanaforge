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
        # Corpo = tudo que vem depois do <b> dentro do <p>. Não fatiar por comprimento de
        # string: o <b> tem espaços/quebras ao redor.
        body = _clean(
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
