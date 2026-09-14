from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


TOPICS = {
    "character_creation": ["Construção de Personagem", "Atributos básicos", "Raça", "Origem", "Classe"],
    "resources": ["Pontos de Vida", "Pontos de Mana", "Defesa", "Deslocamento"],
    "skills": ["Perícias", "Testes de Perícia", "Treinado"],
    "actions": ["Tipos de Ações", "Ação Padrão", "Ação de Movimento", "Ação Completa", "Ação Livre", "Reação"],
    "magic": ["Regras de Magias", "Execução", "Alcance", "Área", "Duração", "Resistência"],
    "equipment": ["Equipamento", "Carga", "Moedas", "Itens"],
    "conditions": ["Lista de Condições", "Condições"],
}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        raise SystemExit("usage: summarize_tormenta_book_topics.py <book_pdf>")

    reader = PdfReader(str(Path(sys.argv[1])))
    pages = [normalize(page.extract_text() or "") for page in reader.pages]
    result: dict[str, list[dict]] = {}

    for topic, terms in TOPICS.items():
      matches = []
      for page_index, text in enumerate(pages):
          lower = text.lower()
          found = [term for term in terms if term.lower() in lower]
          if not found:
              continue
          snippets = []
          for term in found[:3]:
              pos = lower.find(term.lower())
              start = max(0, pos - 90)
              end = min(len(text), pos + 280)
              snippets.append({"term": term, "context": text[start:end]})
          matches.append({"page": page_index + 1, "terms": found[:6], "snippets": snippets})
          if len(matches) >= 8:
              break
      result[topic] = matches

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
