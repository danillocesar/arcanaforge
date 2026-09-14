export interface OfficialDeity {
  name: string;
  domains: string[];
  restrictions: string;
  title: string;
}

/** Catálogo das divindades oficiais do livro básico de Tormenta 20 (tsrd.fandom.com/pt-br). */
export const OFFICIAL_DEITIES: OfficialDeity[] = [
  {
    name: 'Aharadak',
    domains: ['Tormenta'],
    restrictions:
      'Quase todos os cultistas da Tormenta são maníacos insanos, compelidos a praticar os atos mais abomináveis. No entanto, talvez devido à própria natureza alienígena e incompreensível deste deus, uns poucos devotos conseguem se resguardar. Conseguem preservar sua preciosa humanidade, abstendo-se de cometer crimes ou profanações. Ainda assim, o devoto da Tormenta deve pagar um preço. No início de qualquer cena de ação, role 1d6. Com um resultado ímpar, você fica fascinado na primeira rodada, perdido em devaneios sobre a futilidade da vida.',
    title: 'Deus da Tormenta',
  },
  {
    name: 'Allihanna',
    domains: ['Natureza'],
    restrictions:
      'Devotos da Natureza não podem usar armaduras e escudos feitos de metal. Assim, você só pode usar armadura acolchoada, armadura de couro, gibão de peles e escudo leve.\n\nDevotos da Natureza não podem descansar em nenhuma comunidade maior que uma aldeia (não perdem seus poderes, mas também não recuperam pontos de vida ou mana). Por isso, sempre preferem o relento a um quarto de estalagem.',
    title: 'Deusa da Natureza',
  },
  {
    name: 'Arsenal',
    domains: ['Guerra'],
    restrictions:
      'Um devoto da Guerra é proibido de ser derrotado em qualquer tipo de combate ou disputa (como um teste oposto para ver quem é mais forte). Caso seu grupo seja derrotado, isso também constitui uma violação das obrigações.',
    title: 'Deus da Guerra',
  },
  {
    name: 'Azgher',
    domains: ['Sol'],
    restrictions:
      'O devoto do Sol deve manter o rosto sempre coberto (com uma máscara, capuz ou trapos). Sua face pode ser revelada apenas ao sumo-sacerdote, ou em seu funeral. Devotos do Sol também devem doar para a igreja do Sol 20% de qualquer tesouro obtido. Essa doação deve ser feita em ouro, seja na forma de moedas ou itens.',
    title: 'Deus do Sol',
  },
  {
    name: 'Hyninn',
    domains: ['Trapaça'],
    restrictions:
      'Um devoto do Deus da Trapaça não recusa participação em um golpe, trapaça ou artimanha (o que muitas vezes inclui missões para roubar... hã, resgatar tesouros), exceto quando prejudica seus próprios companheiros. O devoto também deve fazer um ato furtivo, ousado ou proibido por dia (ou por sessão de jogo, o que demorar mais), como oferenda ao deus. Roubar uma bolsa, enganar um miliciano, invadir o quarto de um nobre... Em termos de jogo, uma ação exigindo um teste de Enganação ou Ladinagem com CD mínima 15 + metade do seu nível.',
    title: 'Deus da Trapaça',
  },
  {
    name: 'Kallyadranoch',
    domains: ['Dragões'],
    restrictions:
      'Para subir de nível, além de acumular XP suficiente, o devoto do Dragão deve realizar uma oferenda em tesouro. O valor é igual à metade da diferença do dinheiro inicial do nível que vai alcançar para o nível atual (por exemplo, T$ 200 para subir para o 4° nível). Sabe-se, também, de devotos malignos que sacrificam vítimas ao Dragão (não permitido para personagens jogadores).',
    title: 'Deus dos Dragões',
  },
  {
    name: 'Khalmyr',
    domains: ['Justiça'],
    restrictions:
      'Devotos da Justiça são proibidos de recusar um pedido sincero de ajuda. Também devem sempre cumprir as ordens de devotos superiores na hierarquia da igreja (qualquer outro devoto da Justiça de nível maior) e só podem usar itens mágicos criados por devotos do mesmo deus.',
    title: 'Deus da Justiça',
  },
  {
    name: 'Lena',
    domains: ['Vida'],
    restrictions:
      'Devotos da Vida não podem causar dano letal a criaturas vivas (habilidades que aumentem o dano letal causado por seus aliados também são proibidas). Podem causar dano não letal e prejudicar seus inimigos (em termos de jogo, impondo condições), desde que não causem dano letal. Para um devoto da Vida, é preferível perder a própria vida a tirá-la de outros. Apenas mulheres podem ser devotas da Vida. Uma clériga precisa dar à luz pelo menos uma vez antes de receber seus poderes divinos. A fecundação é um mistério bem guardado pelas sacerdotisas; conta-se que a própria deusa vem semear suas discípulas. Paladinos da Vida podem ser homens (são os únicos devotos masculinos permitidos) ou mulheres.',
    title: 'Deusa da Vida',
  },
  {
    name: 'Lin-Wu',
    domains: ['Honra'],
    restrictions:
      'Antigas proibições quanto a devotos estrangeiros ou do gênero feminino não mais se aplicam. No entanto, devotos da Honra ainda devem demonstrar comportamento honrado, jamais recorrendo a mentiras e subterfúgios. Em termos de jogo, são proibidos de tentar qualquer ação que exigiria um teste de Enganação, Furtividade ou Ladinagem.',
    title: 'Deus da Honra',
  },
  {
    name: 'Marah',
    domains: ['Paz'],
    restrictions:
      'Devotos da Paz não podem causar dano e impor condições a criaturas, exceto fascinado e pasmo (habilidades que aumentem o dano causado por seus aliados também são proibidas). Em combate, só podem recorrer a ações como proteger ou curar — ou então fugir, render-se ou aceitar a morte. Um devoto da Paz jamais vai causar violência, nem mesmo para se salvar.',
    title: 'Deusa da Paz',
  },
  {
    name: 'Megalokk',
    domains: ['Monstros'],
    restrictions:
      'Devotos do Monstro devem entregar-se à ferocidade, descontrole e impaciência. Você é proibido de tentar ações que exigem calma ou foco, como preparar uma ação, escolher 10 ou 20 em um teste ou lançar uma magia sustentada. O devoto também é obrigado a rejeitar os modos civilizados. Você é proibido de tentar qualquer teste de perícia baseada em Inteligência ou Carisma (exceto Intimidação).',
    title: 'Deus dos Monstros',
  },
  {
    name: 'Nimb',
    domains: ['Caos'],
    restrictions:
      'Por serem incapazes de seguir regras, estes devotos não têm “obrigações” verdadeiras (portanto, nunca perdem seus poderes concedidos). No entanto, sofrem certas restrições que não podem escolher ignorar.\n\nDevotos do Caos são loucos (ou agem como se fossem), não conseguindo convencer ninguém de coisa alguma. Você sofre –5 em testes de perícias baseadas em Carisma. Além disso, sempre que você entra em combate, role 1d6. Com um resultado 1, você fica confuso até o fim da cena.',
    title: 'Deus do Caos',
  },
  {
    name: 'Oceano',
    domains: ['Oceano'],
    restrictions:
      'As únicas armas permitidas para devotos do Oceano são a azagaia, a lança, o tridente e a rede. Podem usar apenas armaduras de couro. O devoto também não pode se manter afastado do oceano por mais de uma semana.',
    title: 'Deus do Oceano',
  },
  {
    name: 'Sszzaas',
    domains: ['Traição'],
    restrictions:
      'O devoto deve fazer um ato de traição, intriga ou corrupção por dia (ou por sessão de jogo) como oferenda a Enganação. Pouco importa se o alvo é aliado ou inimigo — de fato, uns poucos enganadores usam seus métodos torpes para ajudar colegas aventureiros em suas missões, às vezes sem que eles próprios saibam.\n\nSugerir a alguém que foi traído pelo cônjuge, influenciar um miliciano a aceitar suborno, instruir um mercador a roubar nos preços, levar alguém a ser culpado de um crime que não cometeu, forjar uma falsificação que incrimina um inocente, enganar um guerreiro para que mate um oponente rendido e inofensivo... em termos de jogo, uma ação exigindo um teste de Enganação com CD mínima 15.',
    title: 'Deus da Traição',
  },
  {
    name: 'Tanna-Toh',
    domains: ['Conhecimento'],
    restrictions:
      'Devotos do Conhecimento jamais podem recusar uma missão que envolva a busca por um novo conhecimento ou informação; investigar rumores sobre um livro perdido, procurar uma aldeia lendária, pesquisar os hábitos de uma criatura desconhecida...\n\nAlém disso, o devoto sempre deve dizer a verdade, e nunca pode se recusar a responder uma pergunta, pouco importando as consequências. É totalmente proibido para ele esconder qualquer conhecimento.',
    title: 'Deusa do Conhecimento',
  },
  {
    name: 'Tenebra',
    domains: ['Noite'],
    restrictions:
      'A Noite proíbe que seus devotos sejam tocados pelo Sol, o odiado rival. O devoto deve se cobrir inteiramente durante o dia, sem expor ao sol nenhum pedaço de pele.',
    title: 'Deusa da Noite',
  },
  {
    name: 'Thwor',
    domains: ['Goblinóides'],
    restrictions:
      'Não importando sua raça, o devoto do Deus dos Goblinóides deve ser considerado duyshidakk — ou seja, aceito como membro do povo goblinoide. Também deve se esforçar para que o modo de vida duyshidakk tome o continente. Deve sempre procurar fazer alianças com goblinoides e só lutar contra eles em último caso.',
    title: 'Deus dos Goblinóides',
  },
  {
    name: 'Thyatis',
    domains: ['Ressurreição'],
    restrictions:
      'Devotos da Fênix são proibidos de matar seres inteligentes (Int 3 ou mais). Podem atacar e causar dano, mas jamais levar à morte. Por esse motivo, devotos da Fênix preferem armas e ataques que apenas incapacitam seus oponentes ou causam dano não letal.',
    title: 'Deus da Ressurreição',
  },
  {
    name: 'Valkaria',
    domains: ['Ambição'],
    restrictions:
      'A Deusa da Ambição odeia o conformismo. Seus devotos são proibidos de fixar moradia em um mesmo lugar, não podendo permanecer mais de 2d10+10 dias na mesma cidade (ou vila, aldeia, povoado...) ou 1d4+2 meses no mesmo reino. Devotos da Ambição também são proibidos de casar-se ou formar qualquer união estável.',
    title: 'Deusa da Ambição',
  },
  {
    name: 'Wynna',
    domains: ['Magia'],
    restrictions:
      'Ainda que a magia jamais possa ser negada para quem a busca, devotos da Magia devem praticar a bondade e a generosidade de sua deusa, jamais recusando um pedido de ajuda. Além disso, devotos da Magia são proibidos de matar seres mágicos (elfos, qareen, sílfides e outros a critério do mestre) e conjuradores arcanos.',
    title: 'Deusa da Magia',
  },
];
