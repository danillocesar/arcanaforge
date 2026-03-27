export interface ConfigToggle {
  key: string;
  label: string;
}

export interface ConfigCategory {
  id: string;
  title: string;
  toggles: ConfigToggle[];
}

export const NARUTO_CONFIG_CATEGORIES: ConfigCategory[] = [
  {
    id: 'aptidoesNaoRestritas',
    title: 'Aptidões Não Restritas',
    toggles: [
      { key: 'acuidade',          label: 'Acuidade' },
      { key: 'combateDefensivo',  label: 'Combate Defensivo' },
      { key: 'diligente',         label: 'Diligente' },
      { key: 'quimico',           label: 'Químico' },
      { key: 'velocista',         label: 'Velocista' },
      { key: 'shunjutsu1',        label: 'Shunjutsu Nível 1' },
      { key: 'shunjutsu3',        label: 'Shunjutsu Nível 3' },
      { key: 'burroDeCarga',      label: 'Burro de Carga' },
    ],
  },
  {
    id: 'aptidoesRestritas',
    title: 'Aptidões e Condições Restritas',
    toggles: [
      { key: 'anatomiaGemea',       label: 'Anatomia Gêmea' },
      { key: 'armaduraOssea',       label: 'Armadura Óssea (Kaguya)' },
      { key: 'byakugouNoIn',        label: 'Byakugou no In' },
      { key: 'chakraExpandido',      label: 'Chakra Expandido' },
      { key: 'cloneReserva',        label: 'Clone Reserva (Zetsu)' },
      { key: 'controlePerfeito1',   label: 'Controle Perfeito Nível 1' },
      { key: 'controlePerfeito2',   label: 'Controle Perfeito Nível 2' },
      { key: 'corpulencia',         label: 'Corpulência (Akimichi)' },
    ],
  },
  {
    id: 'condicoesSimples',
    title: 'Condições Simples',
    toggles: [
      { key: 'acelerado',              label: 'Acelerado' },
      { key: 'furtividadePerceptiva',   label: 'Furtividade Perceptiva' },
      { key: 'instintoBatalha',        label: 'Instinto de Batalha' },
      { key: 'mantoBijuu',             label: 'Manto Bijuu' },
      { key: 'modoBijuu',              label: 'Modo Bijuu' },
      { key: 'formaBijuu',             label: 'Forma Bijuu' },
      { key: 'predadorAquatico',       label: 'Predador Aquático' },
      { key: 'resiliencia',            label: 'Resiliência (Akimichi)' },
      { key: 'resistenciaInsaciavel',  label: 'Resistência Insaciável' },
      { key: 'rinnegan',               label: 'Rinnegan' },
      { key: 'receptaculoHitokugutsu', label: 'Receptáculo Hitokugutsu' },
      { key: 'sharinganEsq',           label: 'Sharingan (Esq. Perceptiva)' },
      { key: 'shykakyuNoJutsu',        label: 'Shykakyu no Jutsu' },
      { key: 'tesouro6Caminhos',       label: 'Tesouro dos 6 Caminhos' },
      { key: 'vooKujaku',              label: 'Voo (Kujaku Myoho)' },
      { key: 'senjutsuAtivo',          label: 'Senjutsu Ativo' },
    ],
  },
  {
    id: 'recursosExtras',
    title: 'Recursos Extras',
    toggles: [
      { key: 'bonecoJashin',           label: 'Boneco de Jashin' },
      { key: 'kikaichuu',              label: 'Kikaichū (Aburame)' },
      { key: 'pontosKamiArte',         label: 'Pontos Kami Arte' },
      { key: 'pontosKamiEspirito',     label: 'Pontos Kami Espírito' },
      { key: 'pontosVisaoMangekyo',    label: 'Pontos de Visão Mangekyo' },
      { key: 'pontosSaudeKujaku',      label: 'Pontos de Saúde Kujaku' },
      { key: 'pontosSuika',            label: 'Pontos Suika (Hozuki)' },
      { key: 'coracoesJiongu',         label: 'Corações do Jiongu' },
    ],
  },
  {
    id: 'regrasExtras',
    title: 'Regras Extras',
    toggles: [
      { key: 'tresPtsPoder',           label: '3 Pts de Poder por Nível' },
      { key: 'regrasSociais',          label: 'Regras Sociais (Yin e Yang)' },
    ],
  },
  {
    id: 'alteracoesPoderes',
    title: 'Alterações em Poderes',
    toggles: [
      { key: 'bastaoYagura',           label: 'Bastão de Yagura (Suiton)' },
      { key: 'dominioMecanico',        label: 'Domínio Mecânico' },
      { key: 'dominioSimples',         label: 'Domínio Simples' },
      { key: 'elementoNaturalSuiton',  label: 'Elemento Natural: Suiton' },
      { key: 'elementoNaturalTerra',   label: 'Elemento Natural: Terra' },
      { key: 'marcaFerro',             label: 'Marca de Ferro (Satetsu)' },
      { key: 'ouroPegajoso',           label: 'Ouro Pegajoso (Kumo Ninpou)' },
      { key: 'pesoOuro',               label: 'Peso do Ouro (Sakin)' },
      { key: 'tubosAr',                label: 'Tubos de Ar (Ototon)' },
    ],
  },
];
