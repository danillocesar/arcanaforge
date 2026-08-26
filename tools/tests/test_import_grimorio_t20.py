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


def test_parse_detail_enhancement_with_qualifier_goes_to_description_prefix():
    # Mesmo esqueleto das páginas reais; "Luz" tem "+0 PM (Apenas Arcanos):" no <b>.
    html = """
    <h2>Evocação</h2><h5>Universal - 1º círculo</h5>
    <dl><dt>Execução:</dt><dd>padrão</dd><dt>Publicação:</dt><dd>Edição Jogo do Ano</dd></dl>
    <h1><div>Luz</div></h1>
    <p>O alvo emite luz.</p>
    <p><b class="enhc">+1 PM:</b> aumenta a área.</p>
    <p><b class="enhc">+0 PM (Apenas Arcanos):</b>
       muda o alvo para 1 criatura.</p>
    """
    d = imp.parse_detail(html)
    assert d["enhancements"] == [
        {"mpCost": 1, "description": "aumenta a área."},
        {"mpCost": 0, "description": "(Apenas Arcanos) muda o alvo para 1 criatura."},
    ]


def test_parse_detail_br_is_paragraph_in_description_and_space_in_enhancement():
    html = """
    <h2>Evocação</h2><h5>Arcana - 5º círculo</h5>
    <dl><dt>Execução:</dt><dd>padrão</dd><dt>Publicação:</dt><dd>Edição Jogo do Ano</dd></dl>
    <h1><div>Muralha Elemental</div></h1>
    <p>Uma muralha se eleva
da terra.<br>Fogo. Cortina de chamas.<br/>
       Gelo. Muro de gelo.</p>
    <p><b class="enhc">+2 PM:</b> conjura soterrados.<br>Soterrado: como esqueletos.</p>
    """
    d = imp.parse_detail(html)
    assert d["description"] == "Uma muralha se eleva da terra.\n\nFogo. Cortina de chamas.\n\nGelo. Muro de gelo."
    assert d["enhancements"] == [{"mpCost": 2, "description": "conjura soterrados. Soterrado: como esqueletos."}]


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
    # o site grafa sem acento; o nome do nosso catálogo (e o slug) não mudam
    o = imp.to_official(imp.parse_detail(read("3.html")) | {"name": "Geiser Cáustico"})
    assert (o["name"], o["id"]) == ("Gêiser Cáustico", "geiser-caustico")


def test_to_official_strips_trailing_punctuation_from_block_fields():
    d = imp.parse_detail(read("3.html")) | {
        "resistance": "Vontade parcial.",
        "duration": "1 dia.",
        "range": "curto;",
        "area": "esfera com 6m de raio",
    }
    o = imp.to_official(d)
    assert (o["resistance"], o["duration"], o["range"], o["area"]) == (
        "Vontade parcial", "1 dia", "curto", "esfera com 6m de raio",
    )
    # a descrição continua com o ponto final
    assert o["description"].endswith("consumido.")


def test_to_official_applies_field_fixes_for_site_typos():
    d = imp.parse_detail(read("3.html")) | {"name": "Área Escorregadia", "range": "curtoAlvo ou"}
    assert imp.to_official(d)["range"] == "curto"
    d = imp.parse_detail(read("3.html")) | {"name": "Explosão Caleidoscópica", "range": "curto Área: esfera com 6m de raio"}
    assert imp.to_official(d)["range"] == "curto"


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
