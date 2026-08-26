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
