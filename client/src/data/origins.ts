import type { PowerCategory } from './powers';

export interface OriginBenefit {
  kind: 'pericia' | 'poder';
  name: string;
  /** Só presente no poder exclusivo da origem — não está no catálogo geral de poderes. */
  description?: string;
  /** Só presente em benefícios genéricos ("Um poder de combate" etc.) — restringe a categoria
   * mostrada no catálogo de poderes ao escolher. Ausente = jogador escolhe de qualquer categoria. */
  powerCategory?: PowerCategory;
}

export interface OfficialOrigin {
  name: string;
  /** Pool combinado de candidatos (perícias + poderes) — o jogador escolhe 2 no total
   * (exceção: Amnésico, que tem regra própria e não segue esse padrão). */
  benefits: OriginBenefit[];
  /** Itens iniciais concedidos pela origem, como texto (não vira item de inventário automaticamente). */
  startingItems: string;
}

/** Catálogo das origens oficiais do livro básico de Tormenta 20 (tsrd.fandom.com/pt-br/wiki/Origens_T20). */
export const OFFICIAL_ORIGINS: OfficialOrigin[] = [
  {
    name: 'Acólito',
    benefits: [
      { kind: 'pericia', name: 'Cura' },
      { kind: 'pericia', name: 'Religião' },
      { kind: 'pericia', name: 'Vontade' },
      {
        kind: 'poder',
        name: 'Membro da Igreja',
        description: 'Você consegue hospedagem e informação em qualquer templo de sua divindade, para você e seus aliados.',
      },
      { kind: 'poder', name: 'Vontade de Ferro' },
    ],
    startingItems: 'Símbolo sagrado de sua divindade, traje de sacerdote.',
  },
  {
    name: 'Amigo dos animais',
    benefits: [
      { kind: 'pericia', name: 'Adestramento' },
      { kind: 'pericia', name: 'Cavalgar' },
      {
        kind: 'poder',
        name: 'Amigo Especial',
        description:
          'Você recebe +5 em testes de Adestramento com animais comuns. Além disso, possui um animal de estimação que o auxilia e o acompanha em suas aventuras. Em termos de jogo, é um aliado que fornece +2 em uma perícia a sua escolha (exceto Luta ou Pontaria e aprovada pelo mestre) e não conta em seu limite de aliados.',
      },
    ],
    startingItems: 'Cão de guarda, cavalo, pônei ou trobo (escolha um).',
  },
  {
    name: 'Amnésico',
    benefits: [
      { kind: 'pericia', name: 'Escolhida pelo mestre' },
      { kind: 'poder', name: 'Escolhido pelo mestre' },
      {
        kind: 'poder',
        name: 'Lembranças Graduais',
        description:
          'Durante suas aventuras, em determinados momentos a critério do mestre, você pode fazer um teste de Sabedoria (CD 10) para reconhecer pessoas, criaturas ou lugares que tenha encontrado antes de perder a memória.',
      },
    ],
    startingItems: 'Um ou mais itens (somando até T$ 100), que podem ser uma pista misteriosa da sua vida antiga.',
  },
  {
    name: 'Aristocrata',
    benefits: [
      { kind: 'pericia', name: 'Diplomacia' },
      { kind: 'pericia', name: 'Enganação' },
      { kind: 'pericia', name: 'Nobreza' },
      { kind: 'poder', name: 'Comandar' },
      {
        kind: 'poder',
        name: 'Sangue Azul',
        description:
          'Você tem alguma influência política, suficiente para ser tratado com mais leniência pela guarda, conseguir uma audiência com o nobre local etc.',
      },
    ],
    startingItems: 'Joia de família no valor de T$ 100, traje da corte.',
  },
  {
    name: 'Artesão',
    benefits: [
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      { kind: 'pericia', name: 'Vontade' },
      {
        kind: 'poder',
        name: 'Frutos do Trabalho',
        description: 'Quando passa em um teste de Ofício para Sustento, você recebe o dobro do dinheiro.',
      },
      { kind: 'poder', name: 'Sortudo' },
    ],
    startingItems: 'Kit de Ofício aprimorado (+2 em testes de Ofício).',
  },
  {
    name: 'Artista',
    benefits: [
      { kind: 'pericia', name: 'Atuação' },
      { kind: 'pericia', name: 'Enganação' },
      { kind: 'poder', name: 'Atraente' },
      {
        kind: 'poder',
        name: 'Dom Artístico',
        description: 'Quando usa a perícia Atuação para fazer uma apresentação e passa no teste, você ganha o dobro de tibares.',
      },
      { kind: 'poder', name: 'Sortudo' },
      { kind: 'poder', name: 'Torcida' },
    ],
    startingItems: 'Kit de disfarces ou instrumento musical.',
  },
  {
    name: 'Assistente de laboratório',
    benefits: [
      { kind: 'pericia', name: 'Ofício (alquimia)' },
      { kind: 'pericia', name: 'Misticismo' },
      {
        kind: 'poder',
        name: 'Esse Cheiro...',
        description: 'Você recebe +2 em Fortitude e passa automaticamente em testes de Ofício (alquimia) para identificar itens alquímicos.',
      },
      { kind: 'poder', name: 'Venefício' },
      { kind: 'poder', name: 'Um poder da Tormenta (Oh, aqueles experimentos!)', powerCategory: 'Tormenta' },
    ],
    startingItems: 'Um kit de Ofício (alquimia).',
  },
  {
    name: 'Batedor',
    benefits: [
      { kind: 'pericia', name: 'Furtividade' },
      { kind: 'pericia', name: 'Percepção' },
      { kind: 'pericia', name: 'Sobrevivência' },
      {
        kind: 'poder',
        name: 'À Prova de Tudo',
        description: 'Você não sofre penalidade em deslocamento e Sobrevivência por clima ruim e por terreno difícil natural.',
      },
      { kind: 'poder', name: 'Estilo de Disparo' },
      { kind: 'poder', name: 'Sentidos Aguçados' },
    ],
    startingItems: 'Barraca, uma arma simples ou marcial de ataque à distância.',
  },
  {
    name: 'Capanga',
    benefits: [
      { kind: 'pericia', name: 'Luta' },
      { kind: 'pericia', name: 'Intimidação' },
      {
        kind: 'poder',
        name: 'Confissão',
        description: 'Você pode usar Intimidação para obter informação sem custo (veja Investigação).',
      },
      { kind: 'poder', name: 'Um poder de combate', powerCategory: 'Combate' },
    ],
    startingItems: 'Tatuagem ou outro adereço de sua gangue aprimorado (+2 em Intimidação), uma arma simples corpo a corpo.',
  },
  {
    name: 'Charlatão',
    benefits: [
      { kind: 'pericia', name: 'Enganação' },
      { kind: 'pericia', name: 'Jogatina' },
      {
        kind: 'poder',
        name: 'Alpinista Social',
        description: 'Você pode substituir testes de Diplomacia por testes de Enganação.',
      },
      { kind: 'poder', name: 'Aparência Inofensiva' },
      { kind: 'poder', name: 'Sortudo' },
    ],
    startingItems: 'Joia falsificada (valor aparente de T$ 100, sem valor real), kit de disfarces (esse é de verdade).',
  },
  {
    name: 'Circense',
    benefits: [
      { kind: 'pericia', name: 'Acrobacia' },
      { kind: 'pericia', name: 'Atuação' },
      { kind: 'pericia', name: 'Reflexos' },
      { kind: 'poder', name: 'Acrobático' },
      { kind: 'poder', name: 'Torcida' },
      {
        kind: 'poder',
        name: 'Truque de Mágica',
        description:
          'Você pode lançar Explosão de Chamas, Hipnotismo e Transmutar Objetos, mas apenas com o aprimoramento Truque. Esta não é uma habilidade mágica — os efeitos provêm de truques e prestidigitação.',
      },
    ],
    startingItems: 'Traje de artista, três bolas coloridas para malabarismo, um baralho.',
  },
  {
    name: 'Criminoso',
    benefits: [
      { kind: 'pericia', name: 'Enganação' },
      { kind: 'pericia', name: 'Furtividade' },
      { kind: 'pericia', name: 'Ladinagem' },
      {
        kind: 'poder',
        name: 'Punguista',
        description: 'Você pode fazer um teste de Ladinagem para Sustento, como a perícia Ofício.',
      },
      { kind: 'poder', name: 'Venefício' },
    ],
    startingItems: 'Kit de ladrão ou kit de disfarces.',
  },
  {
    name: 'Curandeiro',
    benefits: [
      { kind: 'pericia', name: 'Cura' },
      { kind: 'pericia', name: 'Vontade' },
      { kind: 'poder', name: 'Medicina' },
      {
        kind: 'poder',
        name: 'Médico de Campo',
        description: 'Quando você faz primeiros socorros em um personagem com 0 ou menos PV, ele recupera 1d6 PV.',
      },
      { kind: 'poder', name: 'Venefício' },
    ],
    startingItems: 'Bálsamo restaurador, kit de medicamentos.',
  },
  {
    name: 'Eremita',
    benefits: [
      { kind: 'pericia', name: 'Misticismo' },
      { kind: 'pericia', name: 'Religião' },
      { kind: 'pericia', name: 'Sobrevivência' },
      {
        kind: 'poder',
        name: 'Busca Interior',
        description:
          'Quando você e seus companheiros estão diante de um mistério, incapazes de prosseguir, você pode gastar 1 PM para meditar sozinho durante algum tempo e receber uma dica do mestre.',
      },
      { kind: 'poder', name: 'Lobo Solitário' },
    ],
    startingItems: 'Barraca, kit de medicamentos.',
  },
  {
    name: 'Escravo',
    benefits: [
      { kind: 'pericia', name: 'Atletismo' },
      { kind: 'pericia', name: 'Fortitude' },
      { kind: 'pericia', name: 'Furtividade' },
      {
        kind: 'poder',
        name: 'Desejo de Liberdade',
        description:
          'Ninguém voltará a torná-lo um escravo! Você recebe +5 em testes contra efeitos que possam aprisioná-lo, como a manobra agarrar ou a magia Imobilizar.',
      },
      { kind: 'pericia', name: 'Vontade' },
    ],
    startingItems: 'Algemas, uma ferramenta pesada (mesmas estatísticas de uma maça).',
  },
  {
    name: 'Estudioso',
    benefits: [
      { kind: 'pericia', name: 'Conhecimento' },
      { kind: 'pericia', name: 'Guerra' },
      { kind: 'pericia', name: 'Misticismo' },
      { kind: 'poder', name: 'Aparência Inofensiva' },
      {
        kind: 'poder',
        name: 'Palpite Fundamentado',
        description: 'Você pode gastar 2 PM para substituir um teste de qualquer perícia originalmente baseada em Inteligência ou Sabedoria por um teste de Conhecimento.',
      },
    ],
    startingItems: 'Um livro aprimorado (+2 em Conhecimento, Guerra ou Misticismo), outros três livros comuns a sua escolha.',
  },
  {
    name: 'Fazendeiro',
    benefits: [
      { kind: 'pericia', name: 'Adestramento' },
      { kind: 'pericia', name: 'Cavalgar' },
      { kind: 'pericia', name: 'Ofício (fazendeiro)' },
      { kind: 'pericia', name: 'Sobrevivência' },
      {
        kind: 'poder',
        name: 'Água no Feijão',
        description: 'Você gasta apenas metade da matéria-prima para testes de Ofício (cozinheiro).',
      },
      { kind: 'poder', name: 'Ginete' },
    ],
    startingItems: 'Uma ferramenta agrícola (mesmas estatísticas de uma lança), 10 rações de viagem, um animal não combativo (como uma galinha, porco ou ovelha).',
  },
  {
    name: 'Forasteiro',
    benefits: [
      { kind: 'pericia', name: 'Cavalgar' },
      { kind: 'pericia', name: 'Pilotagem' },
      { kind: 'pericia', name: 'Sobrevivência' },
      {
        kind: 'poder',
        name: 'Cultura Exótica',
        description: 'Por sua diferente visão de mundo, você encontra soluções inesperadas. Você pode gastar 1 PM para fazer um teste de perícia somente treinada, mesmo sem ser treinado na perícia.',
      },
      { kind: 'poder', name: 'Lobo Solitário' },
    ],
    startingItems: 'Um diário de viagens, um traje de viajante estrangeiro, um instrumento musical exótico.',
  },
  {
    name: 'Gladiador',
    benefits: [
      { kind: 'pericia', name: 'Atuação' },
      { kind: 'pericia', name: 'Luta' },
      { kind: 'poder', name: 'Atraente' },
      {
        kind: 'poder',
        name: 'Pão e Circo',
        description: 'Por seu treino em combates de exibição, você sabe “bater sem machucar”. Pode escolher causar dano não letal sem sofrer a penalidade de –5.',
      },
      { kind: 'poder', name: 'Torcida' },
      { kind: 'poder', name: 'Um poder de combate', powerCategory: 'Combate' },
    ],
    startingItems: 'Uma arma marcial ou exótica, um item sem valor recebido de um admirador.',
  },
  {
    name: 'Guarda',
    benefits: [
      { kind: 'pericia', name: 'Investigação' },
      { kind: 'pericia', name: 'Luta' },
      { kind: 'pericia', name: 'Percepção' },
      { kind: 'poder', name: 'Investigador' },
      {
        kind: 'poder',
        name: 'Detetive',
        description: 'Você pode substituir testes de Percepção e Intuição por testes de Investigação.',
      },
      { kind: 'poder', name: 'Um poder de combate', powerCategory: 'Combate' },
    ],
    startingItems: 'Apito, insígnia da milícia, uma arma marcial.',
  },
  {
    name: 'Herdeiro',
    benefits: [
      { kind: 'pericia', name: 'Misticismo' },
      { kind: 'pericia', name: 'Nobreza' },
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      { kind: 'poder', name: 'Sortudo' },
      { kind: 'poder', name: 'Comandar' },
      {
        kind: 'poder',
        name: 'Herança',
        description: 'Você herdou um item de preço de até T$ 1.000. Você pode escolher este poder duas vezes, para um item de até T$ 2.000.',
      },
      { kind: 'poder', name: 'Sangue Azul' },
    ],
    startingItems:
      'Um símbolo de sua herança, como um anel de sinete ou manto cerimonial. Enquanto estiver com esse item, você pode ser reconhecido por sua descendência, o que pode ser bom... ou não!',
  },
  {
    name: 'Herói camponês',
    benefits: [
      { kind: 'pericia', name: 'Adestramento' },
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      {
        kind: 'poder',
        name: 'Amigo dos Plebeus',
        description: 'Você consegue hospedagem gratuita, para você e seus aliados, em famílias ou comunidades plebeias.',
      },
      {
        kind: 'poder',
        name: 'Coração Heroico (T20 revisão 2022)',
        description: 'Você recebe +3 pontos de mana. Quando atinge um novo patamar (no 5º, 11º e 17º níveis), recebe +3 PM.',
      },
      { kind: 'poder', name: 'Sortudo' },
      { kind: 'poder', name: 'Surto Heroico' },
      { kind: 'poder', name: 'Torcida' },
    ],
    startingItems: 'Um kit de Ofício ou uma arma simples, traje de plebeu.',
  },
  {
    name: 'Marujo',
    benefits: [
      { kind: 'pericia', name: 'Atletismo' },
      { kind: 'pericia', name: 'Jogatina' },
      { kind: 'pericia', name: 'Ofício (marinheiro)' },
      { kind: 'pericia', name: 'Pilotagem' },
      { kind: 'poder', name: 'Acrobático' },
      {
        kind: 'poder',
        name: 'Passagem de Navio',
        description: 'Você consegue transporte marítimo para você e seus companheiros, sem custos, desde que todos paguem com trabalho (passar em pelo menos um teste de perícia adequado durante a viagem).',
      },
    ],
    startingItems: 'T$ 2d6 (seu último salário), corda.',
  },
  {
    name: 'Mateiro',
    benefits: [
      { kind: 'pericia', name: 'Atletismo' },
      { kind: 'pericia', name: 'Furtividade' },
      { kind: 'pericia', name: 'Sobrevivência' },
      { kind: 'poder', name: 'Lobo Solitário' },
      { kind: 'poder', name: 'Sentidos Aguçados' },
      {
        kind: 'poder',
        name: 'Vendedor de Carcaças',
        description:
          'T20 base: Você pode fazer um teste de Sobrevivência para Sustento, como a perícia Ofício.\n\nT20 rev 2022: Você pode extrair recursos de criaturas em um minuto, em vez de uma hora, e recebe +5 no teste.',
      },
    ],
    startingItems: 'Uma barraca, um arco curto, 20 flechas.',
  },
  {
    name: 'Membro de guilda',
    benefits: [
      { kind: 'pericia', name: 'Diplomacia' },
      { kind: 'pericia', name: 'Enganação' },
      { kind: 'pericia', name: 'Misticismo' },
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      { kind: 'poder', name: 'Foco em Perícia' },
      {
        kind: 'poder',
        name: 'Rede de Contatos',
        description: 'Graças à influência de sua guilda, você pode usar Diplomacia para obter informação sem custo (veja Investigação).',
      },
    ],
    startingItems: 'Kit de ladrão ou kit de ofício.',
  },
  {
    name: 'Mercador',
    benefits: [
      { kind: 'pericia', name: 'Diplomacia' },
      { kind: 'pericia', name: 'Intuição' },
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      {
        kind: 'poder',
        name: 'Negociação',
        description: 'Você pode vender itens 10% mais caro (não cumulativo com barganha).',
      },
      { kind: 'poder', name: 'Proficiência' },
      { kind: 'poder', name: 'Sortudo' },
    ],
    startingItems: 'Uma carroça, um trobo, mercadorias para vender no valor de T$ 100.',
  },
  {
    name: 'Minerador',
    benefits: [
      { kind: 'pericia', name: 'Atletismo' },
      { kind: 'pericia', name: 'Fortitude' },
      { kind: 'pericia', name: 'Ofício (minerador)' },
      { kind: 'poder', name: 'Ataque Poderoso' },
      {
        kind: 'poder',
        name: 'Escavador',
        description: 'Você se torna proficiente em picareta e não sofre penalidade em deslocamento por terreno difícil em masmorras e subterrâneos.',
      },
      { kind: 'poder', name: 'Sentidos Aguçados' },
    ],
    startingItems: 'Gemas preciosas no valor de T$ 100, picareta.',
  },
  {
    name: 'Nômade',
    benefits: [
      { kind: 'pericia', name: 'Cavalgar' },
      { kind: 'pericia', name: 'Pilotagem' },
      { kind: 'pericia', name: 'Sobrevivência' },
      { kind: 'poder', name: 'Lobo Solitário' },
      {
        kind: 'poder',
        name: 'Mochileiro',
        description: 'Você não sofre a penalidade de armadura e a redução de deslocamento por transportar carga pesada.',
      },
      { kind: 'poder', name: 'Sentidos Aguçados' },
    ],
    startingItems: 'Bordão, bússola.',
  },
  {
    name: 'Pivete',
    benefits: [
      { kind: 'pericia', name: 'Furtividade' },
      { kind: 'pericia', name: 'Iniciativa' },
      { kind: 'pericia', name: 'Ladinagem' },
      { kind: 'poder', name: 'Acrobático' },
      { kind: 'poder', name: 'Aparência Inofensiva' },
      {
        kind: 'poder',
        name: 'Quebra-galho',
        description: 'Em cidades ou metrópoles, você pode comprar qualquer item não superior ou mágico por metade do custo normal. Esses itens não podem ser vendidos (são velhos, sujos, furtados...).',
      },
    ],
    startingItems: 'Kit de ladrão, traje de plebeu, um animal urbano (como um cão, gato, rato ou pombo).',
  },
  {
    name: 'Refugiado',
    benefits: [
      { kind: 'pericia', name: 'Fortitude' },
      { kind: 'pericia', name: 'Reflexos' },
      { kind: 'pericia', name: 'Vontade' },
      {
        kind: 'poder',
        name: 'Estoico',
        description: 'Sua recuperação de pontos de vida e pontos de mana com descanso aumenta em uma categoria: normal em condições ruins, confortável em condições normais e assim por diante.',
      },
      { kind: 'poder', name: 'Vontade de Ferro' },
    ],
    startingItems: 'Um item estrangeiro de até T$ 100.',
  },
  {
    name: 'Seguidor',
    benefits: [
      { kind: 'pericia', name: 'Adestramento' },
      { kind: 'pericia', name: 'Ofício (qualquer)' },
      {
        kind: 'poder',
        name: 'Antigo Mestre',
        description: 'Você ainda mantém contato com o herói que costumava servir. A critério do mestre, em uma emergência, você pode receber alguma ajuda — ou então uma bela bronca por esperar que heróis poderosos resolvam o seu problema!',
      },
      { kind: 'poder', name: 'Proficiência' },
      { kind: 'poder', name: 'Surto Heroico' },
    ],
    startingItems: 'Um item recebido de seu mestre no valor de até T$ 100.',
  },
  {
    name: 'Selvagem',
    benefits: [
      { kind: 'pericia', name: 'Percepção' },
      { kind: 'pericia', name: 'Reflexos' },
      { kind: 'pericia', name: 'Sobrevivência' },
      { kind: 'poder', name: 'Lobo Solitário' },
      {
        kind: 'poder',
        name: 'Vida Rústica',
        description: 'Você come coisas que fariam um avestruz vomitar e também consegue descansar nos lugares mais desconfortáveis (mesmo dormindo ao relento, sua recuperação de PV e PM nunca é inferior a seu próprio nível).',
      },
      { kind: 'poder', name: 'Vitalidade' },
    ],
    startingItems: 'Uma arma simples, um pequeno animal de estimação como um pássaro ou esquilo.',
  },
  {
    name: 'Soldado',
    benefits: [
      { kind: 'pericia', name: 'Fortitude' },
      { kind: 'pericia', name: 'Guerra' },
      { kind: 'pericia', name: 'Luta' },
      { kind: 'pericia', name: 'Pontaria' },
      {
        kind: 'poder',
        name: 'Influência Militar',
        description: 'Você fez amigos nas forças armadas. Onde houver acampamentos ou bases militares, você pode conseguir hospedagem e informações para você e seus aliados.',
      },
      { kind: 'poder', name: 'Um poder de combate', powerCategory: 'Combate' },
    ],
    startingItems: 'Uma arma marcial, um uniforme militar, uma insígnia de seu exército.',
  },
  {
    name: 'Taverneiro',
    benefits: [
      { kind: 'pericia', name: 'Diplomacia' },
      { kind: 'pericia', name: 'Jogatina' },
      { kind: 'pericia', name: 'Ofício (culinária)' },
      {
        kind: 'poder',
        name: 'Gororoba',
        description: 'Você prepara comidas em uma categoria de tempo menor (uma hora para comidas de até T$ 10, um dia para comidas de até T$ 100 etc.). Você ainda pode sofrer uma penalidade de –5 no teste de Ofício para diminuir o tempo em mais uma categoria (uma hora baixa para dez minutos).',
      },
      { kind: 'poder', name: 'Proficiência' },
      { kind: 'poder', name: 'Vitalidade' },
    ],
    startingItems: 'Rolo de macarrão ou martelo de carne (mesmas estatísticas de uma clava), uma panela, um avental, uma caneca e um pano sujo.',
  },
  {
    name: 'Trabalhador',
    benefits: [
      { kind: 'pericia', name: 'Atletismo' },
      { kind: 'pericia', name: 'Fortitude' },
      { kind: 'poder', name: 'Atlético' },
      {
        kind: 'poder',
        name: 'Esforçado',
        description: 'Você não teme trabalho duro, nem prazos apertados. Você recebe um bônus de +2 em todos os testes de perícias estendidos.',
      },
    ],
    startingItems: 'Uma ferramenta pesada (mesmas estatísticas de uma maça ou lança, a sua escolha).',
  },
];
