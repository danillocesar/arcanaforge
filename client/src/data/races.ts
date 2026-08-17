export interface OfficialRacePower {
  name: string;
  description: string;
}

export interface OfficialRace {
  name: string;
  attributeModifiers: string;
  powers: OfficialRacePower[];
}

/** Catálogo das raças oficiais do livro básico de Tormenta 20 (tsrd.fandom.com/pt-br/wiki/Raças_T20). */
export const OFFICIAL_RACES: OfficialRace[] = [
  {
    name: 'Humano',
    attributeModifiers: '+2 em Três Atributos Diferentes (+1 em Três Atributos Diferentes)',
    powers: [
      {
        name: 'Versátil',
        description:
          'Você se torna treinado em duas perícias a sua escolha (não precisam ser da sua classe). Você pode trocar uma dessas perícias por um poder geral a sua escolha.',
      },
    ],
  },
  {
    name: 'Anão',
    attributeModifiers: 'Constituição +4, Sabedoria +2, Destreza –2 (Constituição +2, Sabedoria +1, Destreza –1)',
    powers: [
      {
        name: 'Conhecimento das Rochas',
        description:
          'Você recebe visão no escuro e +2 em testes de Percepção e Sobrevivência realizados no subterrâneo.',
      },
      {
        name: 'Devagar e Sempre',
        description:
          'Seu deslocamento é 6m (em vez de 9m). Porém, seu deslocamento nunca é reduzido por uso de armadura ou excesso de carga.',
      },
      {
        name: 'Duro como Pedra',
        description: 'Você recebe +3 pontos de vida no 1º nível e +1 por nível seguinte.',
      },
      {
        name: 'Tradição de Heredrimm',
        description:
          'Você é perito nas armas tradicionais anãs, seja por ter treinado com elas, seja por usá-las como ferramentas de ofício. Para você, todos os machados, martelos, marretas e picaretas são armas simples. Você recebe +2 em ataques com essas armas.',
      },
    ],
  },
  {
    name: 'Dahllan',
    attributeModifiers: 'Sabedoria +4, Destreza +2, Inteligência –2 (Sabedoria +2, Destreza +1, Inteligência –1)',
    powers: [
      {
        name: 'Amiga das Plantas',
        description:
          'Você pode lançar a magia Controlar Plantas (atributo-chave Sabedoria). Caso aprenda novamente essa magia, seu custo diminui em –1 PM.',
      },
      {
        name: 'Armadura de Allihanna',
        description:
          'Você pode gastar uma ação de movimento e 1 PM para transformar sua pele em casca de árvore, recebendo +2 na Defesa até o fim da cena.',
      },
      {
        name: 'Empatia Selvagem',
        description:
          'Você pode se comunicar com animais através de linguagem corporal e vocalizações. Você pode usar Adestramento para mudar atitude e pedir favores de animais(Veja Diplomacia em Pericias). Caso receba esta habilidade novamente, recebe +2 em testes de Adestramento.',
      },
    ],
  },
  {
    name: 'Elfo',
    attributeModifiers: 'Inteligência +4, Destreza +2, Constituição –2 (Inteligência +2, Destreza +1, Constituição –1)',
    powers: [
      {
        name: 'Graça de Glórienn',
        description: 'Seu deslocamento é 12m (em vez de 9m).',
      },
      {
        name: 'Herança Feérica',
        description: 'Você recebe +1 ponto de mana por nível.',
      },
      {
        name: 'Sentidos Élficos',
        description: 'Você recebe visão na penumbra e +2 em Misticismo e Percepção.',
      },
    ],
  },
  {
    name: 'Goblin',
    attributeModifiers: 'Destreza +4, Inteligência +2, Carisma –2 (Destreza +2, Inteligência +1, Carisma –1)',
    powers: [
      {
        name: 'Engenhoso',
        description:
          'Você não sofre penalidades em testes de perícia por não usar kits (como kit de ladrão ou kit de ofício). Se usar o kit, recebe +2 no teste de perícia.',
      },
      {
        name: 'Espelunqueiro',
        description: 'Você recebe visão no escuro e deslocamento de escalada igual ao seu deslocamento terrestre.',
      },
      {
        name: 'Peste Esguia',
        description: 'Seu tamanho é Pequeno, mas seu deslocamento se mantém 9m. Apesar de pequenos, goblins são rápidos.',
      },
      {
        name: 'Rato das Ruas',
        description: 'Você recebe +2 em Fortitude e sua recuperação de PV e PM nunca é inferior ao seu nível.',
      },
    ],
  },
  {
    name: 'Lefou',
    attributeModifiers:
      '+2 em Três Atributos Diferentes (exceto Carisma), Carisma –2 (+1 em Três Atributos Diferentes (exceto Carisma), Carisma –1)',
    powers: [
      {
        name: 'Cria da Tormenta',
        description:
          'Você é uma criatura do tipo monstro e recebe +5 em testes de resistência contra efeitos causados por lefeu e pela Tormenta.',
      },
      {
        name: 'Deformidade',
        description:
          'Todo lefou possui defeitos físicos que, embora desagradáveis, conferem certas vantagens. Você recebe +2 em duas perícias a sua escolha. Você pode trocar um desses bônus por um poder da Tormenta a sua escolha (esse poder não causa perda de Carisma).',
      },
    ],
  },
  {
    name: 'Minotauro',
    attributeModifiers: 'Força +4, Constituição +2, Sabedoria –2 (Força +2, Constituição +1, Sabedoria –1)',
    powers: [
      {
        name: 'Chifres',
        description:
          'Você possui um ataque natural de chifres (dano 1d6, crítico x2, perfuração). Quando usa a ação ataque, pode gastar 1 PM para fazer um ataque corpo a corpo extra com os chifres.',
      },
      {
        name: 'Couro Rígido',
        description: 'Sua pele é dura como a de um touro. Você recebe +1 na Defesa.',
      },
      {
        name: 'Faro',
        description:
          'Seu focinho fornece um senso de olfato apurado. Você não fica desprevenido e sofre apenas camuflagem (em vez de camuflagem total) contra inimigos que não possa ver.',
      },
      {
        name: 'Medo de Altura',
        description:
          'Se estiver adjacente a uma queda de 3m ou mais de altura (como um buraco ou penhasco) você fica abalado.',
      },
    ],
  },
  {
    name: 'Qareen',
    attributeModifiers: 'Carisma +4, Inteligência +2, Sabedoria –2 (Carisma +2, Inteligência +1, Sabedoria –1)',
    powers: [
      {
        name: 'Desejos',
        description:
          'Se lançar uma magia atendendo a um desejo (ou seja, lançar uma magia que alguém tenha pedido desde seu último turno), o custo da magia é reduzido em –1 PM (mínimo 1 PM). Fazer um desejo ao qareen é uma ação livre.',
      },
      {
        name: 'Resistência Elemental',
        description:
          'Conforme sua ascendência, você recebe resistência a dano 10 a um tipo de dano: frio (qareen da água), trovão (qareen do ar), fogo (qareen do fogo), ácido (qareen da terra), eletricidade (qareen da luz) e trevas (qareen das trevas).',
      },
      {
        name: 'Tatuagem Mística',
        description:
          'Você pode lançar uma magia de 1º círculo a sua escolha (atributo-chave Carisma). Caso aprenda novamente essa magia, seu custo diminui em –1 PM.',
      },
    ],
  },
  {
    name: 'Golem',
    attributeModifiers: 'Força +4, Constituição +2, Carisma –2 (Força +2, Constituição +1, Carisma –1)',
    powers: [
      {
        name: 'Canalizar Reparos',
        description:
          'Como uma ação completa, você pode gastar pontos de mana para recuperar pontos de vida, à taxa de 5 PV por PM.',
      },
      {
        name: 'Chassi',
        description:
          'Seu corpo artificial é resistente,mas rígido. Você recebe +2 na Defesa, mas possui penalidade de armadura –2 e seu deslocamento é 6m. Você leva um dia para vestir ou remover uma armadura (pois precisa acoplar as peças dela a seu chassi).',
      },
      {
        name: 'Criatura Artificial',
        description:
          'Você é uma criatura do tipo construto. Recebe visão no escuro e imunidade a doenças, fadiga, sangramento e venenos. Além disso, não precisa respirar, se alimentar ou dormir. Por fim, não recupera pontos de vida por descanso e não se beneficia de magias de cura e itens ingeríveis (comidas, poções etc.). Você precisa ficar inerte por oito horas por dia para recarregar sua fonte de energia. Se fizer isso, recupera PM como se tivesse descansado em condições normais (golens não são afetados por condições boas ou ruins de descanso).',
      },
      {
        name: 'Espírito Elemental',
        description:
          'Escolha entre água (frio), ar (trovão), fogo (fogo) e terra (ácido). Você é imune a dano causado por essa energia. Além disso, se fosse sofrer dano mágico dessa energia, em vez disso cura PV em quantidade igual à metade do dano. Por exemplo, se um golem com espírito elemental do fogo é atingido por uma Bola de Fogo que causa 30 pontos de dano, em vez de sofrer esse dano, ele recupera 15 PV.',
      },
      {
        name: 'Sem Origem',
        description:
          'Como uma criatura artificial, você já foi construído “pronto”. Não teve uma infância, portanto, não tem direito a escolher uma origem e receber benefícios por ela.',
      },
    ],
  },
  {
    name: 'Hynne',
    attributeModifiers: 'Destreza +4, Carisma +2, Força –2 (Destreza +2, Carisma +1, Força –1)',
    powers: [
      {
        name: 'Arremessador',
        description: 'Seu dano com fundas e armas de arremesso aumenta em um passo.',
      },
      {
        name: 'Pequeno e Rechonchudo',
        description:
          'Seu tamanho é Pequeno e seu deslocamento é 6m. Você recebe +2 em Enganação e usa o modificador de Destreza para Atletismo (em vez de Força).',
      },
      {
        name: 'Sorte Salvadora',
        description: 'Você pode gastar 1 PM para rolar novamente um teste de resistência recém realizado.',
      },
    ],
  },
  {
    name: 'Kliren',
    attributeModifiers: 'Inteligência +4, Carisma +2, Força –2 (Inteligência +2, Carisma +1, Força –1)',
    powers: [
      {
        name: 'Híbrido',
        description:
          'Sua natureza multifacetada fez com que você aprendesse conhecimentos variados. Você se torna treinado em uma perícia a sua escolha (não precisa ser da sua classe).',
      },
      {
        name: 'Lógica Gnômica',
        description:
          'Quando faz um teste de atributo ou perícia, você pode gastar 2 PM para substituir o modificador de atributo utilizado por Inteligência. Por exemplo, ao fazer um teste de Atletismo você pode gastar 2 PM para usar seu modificador de Inteligência em vez do modificador de Força.',
      },
      {
        name: 'Ossos Frágeis',
        description:
          'Você sofre 1 ponto de dano adicional por dado de dano de esmagamento. Por exemplo, se for atingido por uma clava (dano 1d6), sofre 1d6+1 pontos de dano. Se cair de 3m de altura (dano 2d6), sofre 2d6+2 pontos de dano.',
      },
      {
        name: 'Vanguardista',
        description:
          'Você recebe +2 em testes de Ofício (um qualquer, a sua escolha). Além disso, você considera todas as armas de fogo como armas simples.',
      },
    ],
  },
  {
    name: 'Medusa',
    attributeModifiers: 'Destreza +4, Carisma +2 (Destreza +2, Carisma +1)',
    powers: [
      {
        name: 'Cria de Megalokk',
        description: 'Você é uma criatura do tipo monstro e recebe visão no escuro.',
      },
      {
        name: 'Natureza Venenosa',
        description:
          'Você recebe resistência a veneno 5 e pode gastar uma ação de movimento e 1 PM para envenenar uma arma que esteja empunhando. A arma causa 1d12 pontos de dano de veneno adicional. O veneno dura até acertar um ataque ou até o fim da cena (o que vier primeiro).',
      },
      {
        name: 'Olhar Atordoante',
        description:
          'Você pode gastar uma ação de movimento e 1 PM para forçar uma criatura em alcance curto a fazer um teste de Fortitude (CD Car). Se a criatura falhar, fica atordoada por uma rodada. Se passar, fica imune a esta habilidade por um dia.',
      },
    ],
  },
  {
    name: 'Osteon',
    attributeModifiers:
      '+2 em Três Atributos Diferentes (exceto Constituição), Constituição -2 (+1 em Três Atributos Diferentes (exceto Constituição), Constituição -1)',
    powers: [
      {
        name: 'Armadura Óssea',
        description: 'Você recebe resistência a corte, frio e perfuração 5.',
      },
      {
        name: 'Memória Póstuma',
        description:
          'Você se torna treinado em uma perícia (não precisa ser da sua classe) ou recebe um poder geral a sua escolha. Como alternativa, você pode ser um osteon de outra raça humanoide que não humano. Neste caso, você ganha uma habilidade dessa raça a sua escolha. Se a raça era de tamanho diferente de Médio, você também possui sua categoria de tamanho.',
      },
      {
        name: 'Natureza Esquelética',
        description:
          'Você é uma criatura do tipo morto-vivo. Recebe visão no escuro e imunidade a doenças, fadiga, sangramento e venenos. Além disso,não precisa respirar, se alimentar ou dormir. Por fim, magias e habilidades de cura causam dano em você, mas dano de trevas recupera seus PV, e você não se beneficia por itens ingeríveis (comidas, poções etc.).',
      },
      {
        name: 'Preço da Não Vida',
        description:
          'Você precisa passar 8 horas sob a luz de estrelas ou no subterrâneo. Se fizer isso, recupera PV e PM como se tivesse descansado em condições normais. Caso contrário, não recupera PV e PM e sofre os mesmos efeitos de fome.',
      },
    ],
  },
  {
    name: 'Sereia/Tritão',
    attributeModifiers: '+2 em Três Atributos Diferentes (+1 em Três Atributos Diferentes)',
    powers: [
      {
        name: 'Canção dos Mares',
        description:
          'Você pode lançar duas das magias a seguir: Amedrontar, Comando, Despedaçar, Enfeitiçar, Hipnotismo ou Sono (atributo-chave Carisma). Caso aprenda novamente uma dessas magias, seu custo diminui em –1 PM.',
      },
      {
        name: 'Mestre do Tridente',
        description:
          'Para você, o tridente é uma arma simples. Além disso, você recebe +2 em rolagens de dano com azagaias, lanças e tridentes.',
      },
      {
        name: 'Transformação Anfíbia',
        description:
          'Você pode respirar debaixo d’água e possui uma cauda que fornece deslocamento de natação 12m. Quando fora d’água, sua cauda desaparece e dá lugar a pernas (deslocamento 9m). Se permanecer mais de um dia sem contato com água, você não recupera PM com descanso até voltar para a água (ou, pelo menos, tomar um bom banho!).',
      },
    ],
  },
  {
    name: 'Sílfide',
    attributeModifiers: 'Carisma +4, Destreza +2, Força –4 (Carisma +2, Destreza +1, Força –2)',
    powers: [
      {
        name: 'Asas de Borboleta',
        description:
          'Seu tamanho é Minúsculo. Você pode flutuar a 1,5m do chão com deslocamento 9m. Isso permite que você ignore terreno difícil e o torna imune a dano por queda (a menos que esteja inconsciente). Você pode gastar 1 PM por rodada para voar com deslocamento de 12m.',
      },
      {
        name: 'Espírito da Natureza',
        description: 'Você é uma criatura do tipo espírito, recebe visão na penumbra e pode falar com animais livremente.',
      },
      {
        name: 'Magia das Fadas',
        description:
          'Você pode lançar duas das magias a seguir: Criar Ilusão, Enfeitiçar, Luz (como uma magia arcana) e Sono (atributo-chave Carisma). Caso aprenda novamente essa magia, seu custo diminui em –1 PM.',
      },
    ],
  },
  {
    name: 'Suraggel (Aggelus)',
    attributeModifiers: 'Sabedoria +4, Carisma +2 (Sabedoria +2, Carisma +1)',
    powers: [
      {
        name: 'Herança Divina',
        description: 'Você é uma criatura do tipo espírito e recebe visão no escuro.',
      },
      {
        name: 'Luz Sagrada (Aggelus)',
        description:
          'Você recebe +2 em Diplomacia e Intuição. Além disso, pode lançar Luz (como uma magia divina; atributo-chave Carisma). Caso aprenda novamente esta magia, o custo para lançá-la diminui em –1 PM.',
      },
    ],
  },
  {
    name: 'Suraggel (Sulfure)',
    attributeModifiers: 'Destreza +4, Inteligência +2 (Destreza +2, Inteligência +1)',
    powers: [
      {
        name: 'Herança Divina',
        description: 'Você é uma criatura do tipo espírito e recebe visão no escuro.',
      },
      {
        name: 'Sombras Profanas (Sulfure)',
        description:
          'Você recebe +2 em Enganação e Furtividade. Além disso, pode lançar a magia Escuridão (como uma magia divina, atributo-chave Inteligência). Caso aprenda novamente esta magia, o custo para lançá-la diminui em –1 PM.',
      },
    ],
  },
  {
    name: 'Trog',
    attributeModifiers: 'Constituição +4, Força +2, Inteligência –2 (Constituição +2, Força +1, Inteligência –1)',
    powers: [
      {
        name: 'Mau Cheiro',
        description:
          'Você pode gastar uma ação padrão e 2 PM para expelir um gás fétido. Todas as criaturas (exceto trogs) em alcance curto devem passar em um teste de Fortitude (CD Con) ou ficarão enjoadas durante 1d6 rodadas. Uma criatura que passe no teste de resistência fica imune a esta habilidade por um dia.',
      },
      {
        name: 'Mordida',
        description:
          'Você possui um ataque natural de mordida (dano 1d6, crítico x2, perfuração). Quando usa a ação ataque, pode gastar 1 PM para fazer um ataque corpo a corpo extra com a mordida.',
      },
      {
        name: 'Reptiliano',
        description:
          'Você é uma criatura do tipo monstro e recebe visão no escuro, +1 na Defesa e, se estiver sem armadura ou roupas pesadas, +5 em Furtividade.',
      },
      {
        name: 'Sangue Frio',
        description: 'Você sofre 1 ponto de dano adicional por cada dado de dano de frio.',
      },
    ],
  },
];
