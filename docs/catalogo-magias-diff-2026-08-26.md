# Diff do catálogo de magias — Grimório T20 × spells.ts

- Idênticas: **15**
- Só redação (descrição/texto de aprimoramento): **94**
- Com diferença de mecânica (círculo, tipo, escola, execução, alcance, alvo, duração, resistência, custo/quantidade de aprimoramentos): **93**

## Diferenças de mecânica

### Acalmar Animal
- **castingTime**
  - nosso: ação padrão
  - site: padrão

### Alarme
- **area**
  - nosso: esfera de 9m de raio
  - site: esfera com 9m de raio
- **enhancements(custos)**
  - nosso: +2;+5;+5
  - site: +2;+5;+9

### Amarras Etéreas
- **resistance**
  - nosso: 
  - site: Reflexos anula
- **enhancements[1]**
  - nosso: aumenta o número de cordas em um alvo a sua escolha em +1.
  - site: aumenta o número de laços em um alvo a sua escolha em +1 (bônus máximo limitado pelo círculo máximo de magia que você pode lançar).
- **enhancements[2]**
  - nosso: em vez do normal, cada laço é destruído automaticamente com um único ataque bem-sucedido; porém, cada laço destruído libera um choque de energia que causa 1d6+1 pontos de dano de essência na criatura amarrada. Requer 3º círculo.
  - site: em vez do normal, cada laço é destruído automaticamente com um único ataque bem-sucedido porém, cada laço destruído libera um choque de energia que causa 1d8+1 pontos de dano de essência na criatura amarrada. Requer 3º círculo.
- **description**
  - nosso: Três laços de energia surgem do chão e se enroscam no alvo, deixando-o agarrado. A vítima pode tentar se livrar, gastando uma ação padrão para fazer um teste de Atletismo (CD igual à da magia). Se passar, destrói um laço, mais um laço adicional para cada 2 pontos pelos quais superou a CD. Os laços também podem ser atacados e destruídos: cada um tem Defesa 10, 10 PV, RD 5 e imunidade a dano mágico. Se todos os laços forem destruídos, a magia é dissipada. Por serem feitos de energia, os laços afetam criaturas incorpóreas.
  - site: Três laços de energia surgem e se enroscam no alvo, deixando-o agarrado. A vítima pode tentar se livrar, gastando uma ação padrão para fazer um teste de Atletismo. Se passar, destrói um laço, mais um laço adicional para cada 5 pontos pelos quais superou a CD. Os laços também podem ser atacados e destruídos: cada um tem Defesa 10, 10 PV, RD 5 e imunidade a dano mágico. Se todos os laços forem destruídos, a magia é dissipada. Por serem feitos de energia, os laços afetam criaturas incorpóreas.

### Anular a Luz
- **area**
  - nosso: esfera de 6m de raio
  - site: esfera com 6m de raio
- **enhancements[1]**
  - nosso: muda o círculo máximo de magias dissipadas para 4º.
  - site: muda as magias dissipadas para até 4º círculo. Requer 4º círculo.
- **enhancements[2]**
  - nosso: muda o círculo máximo de magias dissipadas para 5º.
  - site: muda as magias dissipadas para até 5º círculo. Requer 5º círculo.
- **description**
  - nosso: Esta magia cria uma onda de escuridão que causa diversos efeitos. Todas as magias de 3º círculo ou menor ativas na área são dissipadas se você passar num teste de Religião contra a CD de cada magia. Seus aliados na área são protegidos por uma aura sombria e recebem +4 na Defesa até o fim da cena. Inimigos na área ficam enjoados por 1d4 rodadas. Anular a Luz anula Dispersar as Trevas.
  - site: Esta magia cria uma onda de escuridão que causa diversos efeitos. Magias de até 3º círculo na área são dissipadas se você passar num teste de Religião contra a CD de cada uma. Seus aliados na área são protegidos por uma aura sombria e recebem +4 na Defesa até o fim da cena. Inimigos na área ficam enjoados por 1d4 rodadas (apenas uma vez por cena). Anular a Luz anula Dispersar as Trevas (este efeito tem duração instantânea).

### Arma Espiritual
- **enhancements(custos)**
  - nosso: +1;+2;+2;+2;+5
  - site: +1;+2;+2;+2;+2;+5
- **description**
  - nosso: Você invoca a arma preferida de sua divindade, que surge flutuando a seu lado. Uma vez por rodada, quando você sofre um ataque corpo a corpo, pode usar uma reação para que a arma cause automaticamente 2d6 pontos de dano do tipo da arma — por exemplo, uma espada longa causa dano de corte — no oponente que fez o ataque. Esta magia se dissipa se você morrer.
  - site: Você invoca a arma preferida de sua divindade (caso sua divindade possua uma), que surge flutuando a seu lado. Uma vez por rodada, quando você sofre um ataque corpo a corpo, pode usar uma reação para que a arma cause automaticamente 2d6 pontos de dano do tipo da arma — por exemplo, uma espada longa causa dano de corte — no oponente que fez o ataque. Esta se dissipa se você morrer.

### Arma Mágica
- **area**
  - nosso: 1 arma
  - site: 1 arma empunhada
- **description**
  - nosso: A arma é considerada mágica e fornece +1 nos testes de ataque e rolagens de dano (isso conta como um bônus de encanto). Caso você esteja empunhando a arma, pode usar seu atributo-chave em vez do atributo original nos testes de ataque (não cumulativo com efeitos que somam este atributo).
  - site: A arma é considerada mágica e fornece +1 nos testes de ataque e rolagens de dano (isso conta como um bônus de encanto). Caso você esteja empunhando a arma, pode usar seu atributo-chave de magias em vez do atributo original nos testes de ataque (não cumulativo com efeitos que somam este atributo).

### Assassino Fantasmagórico
- **resistance**
  - nosso: Vontade parcial, Fortitude parcial
  - site: Vontade anula, Fortitude parcial
- **description**
  - nosso: Usando os medos subconscientes do alvo, você cria uma imagem daquilo que ele mais teme. Apenas a própria vítima pode ver o Assassino Fantasmagórico com nitidez; outras criaturas presentes (incluindo o conjurador) enxergam apenas um espectro sombrio.

O espectro surge adjacente a você e flutua em direção à vítima com deslocamento total de voo 18m por turno. Ele é incorpóreo e imune a magias.

Se o espectro terminar seu turno em alcance curto da vítima, ela deve fazer um teste de Vontade. Se falhar, ficará abalada.

Se o espectro terminar seu turno adjacente à vítima, ela deve fazer um teste de Fortitude. Se passar, sofre 6d6 pontos de dano de trevas (este dano não pode reduzir o alvo a menos de 0 PV e não o deixa sangrando). Se falhar, sofre um colapso, ficando imediatamente com –1 PV e sangrando.

O espectro persegue o alvo implacavelmente. Ele só desaparece se deixar seu alvo inconsciente, se for dissipado ou ao término da cena.
  - site: Usando os medos subconscientes do alvo, você cria uma imagem daquilo que ele mais teme. Apenas a própria vítima pode ver o Assassino Fantasmagórico com nitidez outras criaturas presentes (incluindo o conjurador) enxergam apenas um espectro sombrio.

Quando você lança a magia, o espectro surge adjacente a você e a vítima faz um teste de Vontade. Se ela passar, percebe que o espectro é uma ilusão e a magia é dissipada. Se falhar, acredita na existência do espectro, que então flutua 18m por rodada em direção à vítima, sempre no fim do seu turno. Ele é incorpóreo e imune a magias (excetos que dissipam outras).

Se o espectro terminar seu turno adjacente à vítima, ela deve fazer um teste de Fortitude. Se passar, sofre 6d6 pontos de dano de trevas (este dano não pode reduzir o alvo a menos de 0 PV e não o deixa sangrando). Se falhar, sofre um colapso, ficando imediatamente com –1 PV e sangrando.

O espectro persegue o alvo implacavelmente. Ele desaparece se o alvo ficar inconsciente ou se afastar além de alcance longo dele, ou se for dissipado.

### Aura Divina
- **school**
  - nosso: Encantamento
  - site: Abjuração
- **area**
  - nosso: emanação de 9m de raio
  - site: esfera com 9m de raio
- **description**
  - nosso: Você se torna um condutor direto da energia de sua divindade, emanando uma aura brilhante da cor que escolher. Seus aliados na área recebem +5 na Defesa e em testes de resistência (você e aliados devotos da mesma divindade que você recebem +10) e ficam imunes a encantamento. Além disso, inimigos que entrem na área afetada devem fazer um teste de Vontade; em caso de falha, recebem uma condição a sua escolha entre esmorecido, debilitado ou lento até o fim da cena. O teste deve ser refeito cada vez que a criatura entrar novamente na área.
  - site: Você se torna um conduíte da energia de sua divindade, emanando uma aura brilhante. Você e aliados devotos da mesma divindade ficam imunes a encantamento e recebem +10 na Defesa e em testes de resistência. Aliados não devotos da mesma divindade recebem +5 na Defesa e em testes de resistência. Além disso, inimigos que entrem na área devem fazer um teste de Vontade em caso de falha, recebem uma condição a sua escolha entre esmorecido, debilitado ou lento até o fim da cena. O teste deve ser refeito cada vez que a criatura entrar novamente na área.

### Açoite Flamejante
- **spellType**
  - nosso: Divina
  - site: Arcana
- **school**
  - nosso: Encantamento
  - site: Convocação
- **castingTime**
  - nosso: ação padrão
  - site: padrão
- **range**
  - nosso: Pessoal
  - site: pessoal
- **area**
  - nosso: Você
  - site: açoite de chamas criado em sua mão (veja texto)
- **duration**
  - nosso: Sustentada
  - site: sustentada
- **resistance**
  - nosso: Reflexos (Veja Texto)
  - site: Reflexos reduz parcial
- **enhancements(custos)**
  - nosso: +1;+1;+2;+5
  - site: +2;+2;+5
- **description**
  - nosso: Uma língua de fogo puro, semelhante a um chicote, surge em sua mão. Você pode usar uma ação padrão para açoitar uma criatura em alcance curto. Quando faz isso, você pode escolher causar 2d6 pontos de dano de fogo ou, se o alvo for Médio ou menor, agarrá-lo. Passar no teste de resistência reduz o dano à metade ou evita o agarramento, conforme apropriado. Uma criatura agarrada sofre o dano do chicote automaticamente no início de cada um de seus turnos, e pode gastar uma ação padrão para fazer um teste de Atletismo (CD igual a da magia). Se passar, se solta.
  - site: Um açoite de fogo surge em uma de suas mãos com a qual possa empunhar uma arma (essa mão fica ocupada pela duração da magia). Você pode usar uma ação padrão para causar 2d6 pontos de dano de fogo com o açoite em uma criatura em alcance curto e deixá-la em chamas e enredada enquanto estiver em chamas dessa forma. Passar na resistência reduz o dano à metade e evita as chamas.

### Banimento
- **castingTime**
  - nosso: padrão
  - site: 1d3+1 rodadas
- **enhancements(custos)**
  - nosso: +1
  - site: +0
- **description**
  - nosso: Você expulsa criaturas que não são naturais deste mundo. Um alvo nativo de outro mundo, como muitas criaturas do tipo espírito, é teletransportado de volta para um lugar aleatório de seu mundo de origem. Já um alvo morto-vivo tem sua conexão com as energias negativas quase completamente rompida, sendo reduzido a 1d6 PV. Se passar na resistência, em vez dos efeitos acima, o alvo fica enjoado por 1d4 rodadas.

Se você tiver um ou mais itens que se oponham ao alvo de alguma maneira, a CD do teste de resistência aumenta em +2 por item. Por exemplo, se lançar a magia contra demônios do frio (vulneráveis a água benta e que odeiam luz e calor) enquanto segura um frasco de água benta e uma tocha acesa, a CD do teste de resistência aumenta em +4. O mestre decide se determinado item é forte o bastante contra a criatura para isso.
  - site: Você expulsa uma criatura não nativa de Arton. Um alvo nativo de outro mundo (como muitos espíritos), é teletransportado de volta para um lugar aleatório de seu mundo de origem. Já um alvo morto-vivo tem sua conexão com as energias negativas rompidas, sendo reduzido a 0 PV. Se passar na resistência, em vez dos efeitos acima, o alvo fica enjoado por 1d4 rodadas.

Se você tiver um ou mais itens que se oponham ao alvo de alguma maneira, a CD do teste de resistência aumenta em +2 por item. Por exemplo, se lançar a contra demônios do frio (vulneráveis a água benta e que odeiam luz e calor) enquanto segura um frasco de água benta e uma tocha acesa, a CD aumenta em +4. O mestre decide se determinado item é forte o bastante contra a criatura para isso.

### Barragem Elemental de Vectorius
- **enhancements(custos)**
  - nosso: +5;+5
  - site: +5;+5;+1
- **description**
  - nosso: Criada pelo arquimago Vectorius, esta magia produz quatro esferas elementais (ácido, eletricidade, fogo e frio) que voam até um ponto a sua escolha. Quando atingem o ponto escolhido, explodem causando 6d6 pontos de dano (cada uma do seu tipo) numa esfera com 12m de raio. Um teste de Reflexos reduz o dano à metade. Você pode mirar cada esfera em uma criatura ou ponto diferente. Uma criatura ao alcance da explosão de mais de uma esfera deve fazer um teste de resistência para cada uma. Além disso, as esferas causam os seguintes efeitos em criaturas que falharem em seus respectivos testes de resistência:

Esfera de ácido: vulnerável até o fim da cena.
Esfera elétrica: atordoado por uma rodada.
Esfera de fogo: em chamas.
Esfera de frio: lento até o fim da cena
  - site: Criada pelo arquimago Vectorius, esta produz quatro esferas, de ácido, eletricidade, fogo e frio, que voam até um ponto a sua escolha. Quando atingem o ponto escolhido, explodem causando 6d6 pontos de dano de seu respectivo tipo numa área com 12m de raio. Um teste de Reflexos reduz o dano à metade. Você pode mirar cada esfera em uma criatura ou ponto diferente. Uma criatura ao alcance da explosão de mais de uma esfera deve fazer um teste de resistência para cada uma. Além disso, as esferas causam os seguintes efeitos em criaturas que falharem em seus testes de resistência: • Ácido: vulnerável até o fim da cena. • Elétrica: atordoado por 1 rodada (apenas uma vez por cena). • Fogo: em chamas. • Frio: lento até o fim da cena.

Criada pelo arquimago Vectorius, esta produz quatro esferas, de ácido, eletricidade, fogo e frio, que voam até um ponto a sua escolha. Quando atingem o ponto escolhido, explodem causando 6d6 pontos de dano de seu respectivo tipo numa área com 12m de raio. Um teste de Reflexos reduz o dano à metade. Você pode mirar cada esfera em uma criatura ou ponto diferente. Uma criatura ao alcance da explosão de mais de uma esfera deve fazer um teste de resistência para cada uma. Além disso, as esferas causam os seguintes efeitos em criaturas que falharem em seus testes de resistência:

• Ácido: vulnerável até o fim da cena.

• Elétrica: atordoado por 1 rodada (apenas uma vez por cena).

• Fogo: em chamas.

• Frio: lento até o fim da cena.

### Bola de Fogo
- **enhancements(custos)**
  - nosso: +2;+2;+3
  - site: +2;+2;+3;+1

### Buraco Negro
- **enhancements(custos)**
  - nosso: +5;+10
  - site: +5
- **description**
  - nosso: Esta magia cria um vácuo capaz de sugar tudo nas proximidades. Escolha um espaço desocupado para o buraco negro. No início de cada um de seus três turnos seguintes, todas as criaturas a até 90m do buraco negro, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídas e são puxadas 30m na direção do buraco. Objetos soltos também são puxados. Criaturas podem gastar uma ação de movimento para se segurar em algum objeto fixo, recebendo +2 em seus testes de resistência. Criaturas e objetos que toquem o buraco negro são sugadas, desaparecendo para sempre.

Não se conhece o destino das coisas sugadas pelo buraco negro, uma vez que jamais retornam. Alguns estudiosos sugerem que podem ser enviadas para outros mundos. Muitos clérigos da Deusa da Noite acreditam que esta magia abre um portal para Sombria, o lar de sua deusa, e sonham um dia poder realizar essa jornada.
  - site: Esta magia cria um vácuo capaz de sugar tudo nas proximidades. Escolha um espaço desocupado para o buraco negro. No início de cada um de seus três turnos seguintes, todas as criaturas a até alcance longo do buraco negro, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídas e são puxadas 30m na direção do buraco. Objetos soltos também são puxados. Criaturas podem gastar uma ação de movimento para se segurar em algum objeto fixo, recebendo +2 em seus testes de resistência.

Criaturas e objetos que iniciem seu turno no espaço do buraco negro devem gastar uma ação de movimento e fazer um teste de Fortitude. Se passarem, podem escapar se arrastando (metade de seu deslocamento) para longe dele. Se falharem, perdem a ação (mas podem gastar outra para tentar novamente). Se terminarem seu turno no espaço do buraco negro, são sugadas, desaparecendo para sempre.

Não se conhece o destino das coisas sugadas pelo buraco negro. Alguns estudiosos sugerem que são enviadas para outros mundos — provavelmente Sombria, reino da deusa Tenebra.

### Bênção
- **area**
  - nosso: criaturas escolhidas
  - site: aliados
- **enhancements(custos)**
  - nosso: +1;+2
  - site: +1;+2;+1
- **description**
  - nosso: Abençoa os alvos, que recebem +1 em testes de ataque e rolagens de dano. Bênção anula Perdição.
  - site: Abençoa seus aliados, que recebem +1 em testes de ataque e rolagens de dano. Bênção anula Perdição.

### Campo de Força
- **enhancements(custos)**
  - nosso: +1;+1;+7;+9
  - site: +1;+3;+7;+7;+9
- **description**
  - nosso: Esta magia cria uma película protetora sobre você. Você recebe 30 PV temporários, mas apenas contra dano de corte, impacto ou perfuração.
  - site: Esta magia cria uma película protetora sobre você. Você recebe 30 pontos de vida temporários.

### Chuva de Meteoros
- **area**
  - nosso: explosão com 9m de raio
  - site: quadrado com 18m de lado
- **resistance**
  - nosso: Reflexos reduz à metade
  - site: Reflexos parcial
- **enhancements(custos)**
  - nosso: +2;+10
  - site: +2
- **description**
  - nosso: Esta magia faz com que um meteoro caia dos céus, devastando a área de impacto e seus arredores. Criaturas na área sofrem 20d6 pontos de dano (metade impacto, metade fogo).
  - site: Meteoros caem dos céus, devastando a área afetada. Criaturas na área sofrem 15d6 pontos de dano de impacto, 15d6 pontos de dano de fogo e ficam caídas e presas sob os escombros (agarradas). Uma criatura que passe no teste de resistência sofre metade do dano total e não fica caída e agarrada. Uma criatura agarrada pode escapar gastando uma ação padrão e passando em um teste de Atletismo. Toda a área afetada fica coberta de escombros, sendo considerada terreno difícil, e imersa numa nuvem de poeira (camuflagem leve). Esta magia só pode ser utilizada a céu aberto.

### Coluna de Chamas
- **enhancements(custos)**
  - nosso: +1;+1
  - site: +1;+1;+1
- **description**
  - nosso: Um pilar de fogo sagrado desce dos céus, causando 6d6 pontos de dano de fogo mais 6d6 pontos de dano de eletricidade nas criaturas e objetos livres na área.
  - site: Um pilar de fogo sagrado desce dos céus, causando 6d6 pontos de dano de fogo mais 6d6 pontos de dano de luz nas criaturas e objetos livres na área.

### Compreensão
- **resistance**
  - nosso: Vontade anula (veja texto)
  - site: Vontade anula (veja descrição)
- **description**
  - nosso: Essa magia lhe confere compreensão sobrenatural. Você pode tocar um texto e entender as palavras mesmo que não conheça o idioma. Se tocar numa criatura inteligente, pode se comunicar com ela mesmo que não tenham um idioma em comum. Se tocar uma criatura não inteligente, como um animal, pode perceber seus sentimentos.

Você também pode gastar uma ação de movimento para ouvir os pensamentos de uma criatura tocada (você “ouve” o que o alvo está pensando), mas um alvo involuntário tem direito a um teste de Vontade para proteger seus pensamentos e evitar este efeito.
  - site: Essa magia lhe confere compreensão sobrenatural. Você pode tocar um texto e entender as palavras mesmo que não conheça o idioma. Se tocar numa criatura inteligente, pode se comunicar com ela mesmo que não tenham um idioma em comum. Se tocar uma criatura não inteligente, como um animal, pode perceber seus sentimentos. Você também pode gastar uma ação de movimento para ouvir os pensamentos de uma criatura tocada (você “ouve” o que o alvo está pensando), mas um alvo involuntário tem direito a um teste de Vontade para proteger seus pensamentos e evitar este efeito.

### Conjurar Elemental
- **area**
  - nosso: aliado elemental
  - site: parceiro elemental
- **enhancements[0]**
  - nosso: o elemental muda para Enorme e recebe dois tipos de aliado indicados no seu elemento.
  - site: o elemental muda para Enorme e recebe dois tipos de parceiro indicados no seu elemento.
- **enhancements[1]**
  - nosso: você convoca um elemental de cada tipo. Você pode ordenar que cada elemental auxilie você ou seus aliados. Requer 5º círculo.
  - site: você convoca um elemental de cada tipo. Quando lança a magia, você pode escolher se cada elemental vai auxiliar você ou um aliado no alcance. Requer 5º círculo.
- **description**
  - nosso: Esta magia transforma uma porção de um elemento inerte em uma criatura elemental Grande do tipo do elemento alvo. Por exemplo, lançar esta magia numa fogueira ou tocha cria um elemental do fogo. Você pode criar elementais do ar, água, fogo e terra com essa magia. O elemental obedece a todos os seus comandos e pode funcionar como um aliado mestre do tipo destruidor (mas sem custo em PM) e mais um tipo entre os indicados na lista abaixo. Somente você pode ser auxiliado pelo elemental e ele não conta em seu limite de aliados.

Ar: assassino, perseguidor ou vigilante. Dano de eletricidade.

Água: ajudante, guardião ou médico. Dano de frio.

Fogo: atirador, combatente ou fortão. Dano de fogo.

Terra: combatente, guardião ou montaria. Dano de impacto.
  - site: Esta magia transforma uma porção de um elemento inerte em uma criatura elemental Grande do tipo do elemento alvo. Por exemplo, lançar esta magia numa fogueira ou tocha cria um elemental do fogo. Você pode criar elementais do ar, água, fogo e terra com essa magia. O elemental obedece a todos os seus comandos e pode funcionar como um parceiro do tipo destruidor (cuja habilidade custa apenas 2 PM para ser usada) e mais um tipo entre os indicados na lista abaixo, ambos mestres. O elemental auxilia apenas você e não conta em seu limite de parceiros.

Ar: assassino, perseguidor ou vigilante. Dano de eletricidade.

Água: ajudante, guardião ou médico. Dano de frio.

Fogo: atirador, combatente ou fortão. Dano de fogo.

Terra: combatente, guardião ou montaria. Dano de impacto.

### Conjurar Monstro
- **enhancements(custos)**
  - nosso: +1;+1;+1;+2;+2;+2;+2;+4;+5;+9;+9;+9;+14
  - site: +1;+1;+1;+2;+2;+2;+4;+5;+9;+9;+9;+14;+1;+3
- **description**
  - nosso: Esta magia conjura um monstro Pequeno que ataca seus inimigos. Você escolhe a aparência do monstro e o tipo de dano que ele pode causar, entre corte, impacto e perfuração. No entanto, ele não é uma criatura real, e sim um construto feito de energia. Se for destruído, ou quando a magia acaba, desaparece com um brilho, sem deixar nada para trás. Você só pode ter um monstro conjurado por esta magia por vez.

O monstro surge em um ponto escolhido por você dentro do alcance e pode agir no começo do seu próximo turno, sempre na sua Iniciativa. O monstro tem deslocamento 9m e pode fazer uma ação de movimento por rodada. Você pode usar uma ação padrão para dar uma das seguintes ordens a ele.

Mover: o monstro se movimenta o dobro do deslocamento nessa rodada.

Atacar: o monstro ataca um alvo em alcance corpo a corpo. O ataque acerta automaticamente e causa 2d4+2 pontos de dano.

Lançar Magia: o monstro pode servir como ponto de origem para uma magia lançada por você com execução de uma ação padrão ou menor. Ele pode descarregar um Toque Chocante em um inimigo distante, ou mesmo “cuspir” uma Bola de Fogo! Você gasta PM normalmente para lançar a magia.

Outros usos criativos para monstros conjurados ficam a critério do mestre. O monstro não age sem receber uma ordem.

Para efeitos de jogo, o monstro conjurado tem For 14, Des 17 e todos os outros atributos nulos. Ele tem 20 pontos de vida, não tem um valor de Defesa (ataques feitos contra ele acertam automaticamente) e usa o seu bônus para teste de Reflexos. Ele é imune a efeitos que pedem um teste de Fortitude ou Vontade.
  - site: Você conjura um monstro Pequeno que ataca seus inimigos. Você escolhe a aparência do monstro e o tipo de dano que ele pode causar, entre corte, impacto e perfuração. No entanto, ele não é uma criatura real, e sim um construto feito de energia. Se for destruído, ou quando a magia acaba, desaparece com um brilho, sem deixar nada para trás. Você só pode ter um monstro conjurado por esta magia por vez. O monstro surge em um espaço desocupado a sua escolha dentro do alcance e age no início de cada um de seus turnos, a partir da próxima rodada. O monstro tem deslocamento 9m e pode fazer uma ação de movimento por rodada. Você pode gastar uma ação padrão para dar uma das seguintes ordens a ele.

Mover: o monstro se movimenta o dobro do deslocamento nessa rodada.

Atacar: o monstro causa 2d4+2 pontos de dano a uma criatura adjacente.

Lançar Magia: o monstro pode servir como ponto de origem para uma magia lançada por você com execução de uma ação padrão ou menor. Ele pode descarregar um Toque Chocante em um inimigo distante, ou mesmo “cuspir” uma Bola de Fogo! Você gasta PM normalmente para lançar a magia.

Outros usos criativos para monstros conjurados ficam a critério do mestre. O monstro não age sem receber uma ordem. Para efeitos de jogo, o monstro conjurado tem For 2, Des 3 e todos os outros atributos nulos. Ele tem Defesa igual a sua, 20 pontos de vida e usa o seu valor para teste de Reflexos. Ele é imune a efeitos que pedem um teste de Fortitude ou Vontade.

### Conjurar Mortos-Vivos
- **enhancements(custos)**
  - nosso: +2;+3;+7
  - site: +2;+3;+7;+2;+3;+3;+3
- **description**
  - nosso: Seis esqueletos de tamanho Médio feitos de energia negativa emergem do chão em espaços desocupados escolhidos por você dentro do alcance. Você pode usar uma ação de movimento para fazer os mortos-vivos andarem (eles têm deslocamento 9m) ou uma ação padrão para fazê-los causar dano a criaturas adjacentes (1d6+2 pontos de dano de trevas cada). Os esqueletos têm For 14, Des 14 e todos os outros atributos nulos; eles têm 1 PV, não têm valor de Defesa ou testes de resistência, falham automaticamente em qualquer teste oposto e são imunes a atordoamento, dano não letal, doença, encantamento, fadiga, frio, ilusão, paralisia, sono e veneno. Eles desaparecem quando são reduzidos a 0 PV ou no fim da cena. Os mortos-vivos não agem sem receber uma ordem. Usos criativos para criaturas invocadas fora de combate ficam a critério do mestre.

Carniçal: como o esqueleto, mas tem For 16, Des 16, 12 PV e causa 1d8+3 pontos de dano de trevas mais 1d8 pontos de dano de veneno. Além disso, criaturas atingidas por um carniçal devem passar num teste de Fortitude (CD igual à da magia) ou ficam paralisadas por 1 rodada. Uma criatura que passe no teste de resistência fica imune à paralisia dos carniçais por 24 horas.

Sombra: como o esqueleto, mas tem a habilidade incorpóreo, Des 18, 30 PV e causa 1d10 pontos de dano de trevas mais 1d10 pontos de dano de frio. Além disso, criaturas vivas atingidas por uma sombra devem passar num teste de Fortitude (CD igual à da magia) ou perdem 1d4 PM. Sombras perdem a habilidade incorpóreo quando expostas à luz do sol.
  - site: Você conjura seis esqueletos capangas de tamanho Médio feitos de energia negativa em espaços desocupados dentro do alcance. Você pode gastar uma ação de movimento para fazer os mortos-vivos andarem (eles têm deslocamento 9m) ou uma ação padrão para fazê-los causar dano a criaturas adjacentes (1d6+2 pontos de dano de trevas cada). Os esqueletos têm For 2, Des 2, Defesa 18 e todos os outros atributos nulos eles têm 1 PV e falham automaticamente em qualquer teste de resistência ou oposto, mas são imunes a atordoamento, dano não letal, doença, encantamento, fadiga, frio, ilusão, paralisia, sono e veneno. Eles desaparecem quando são reduzidos a 0 PV ou no fim da cena. Os mortos-vivos não agem sem receber uma ordem. Usos criativos para capangas fora de combate ficam a critério do mestre.

Carniçal: como esqueletos, mas têm For 3, Des 3, Defesa 27 e causam 1d8+3 pontos de dano de trevas mais perda de 1d8 PV por veneno. Além disso, criaturas atingidas por um carniçal devem passar num teste de Fortitude ou ficam paralisadas por 1 rodada. Uma criatura que passe no teste de resistência fica imune à paralisia dos carniçais por um dia.

Sombra: como esqueletos, mas têm Des 4, Defesa 35, são incorpóreas e causam 2d10 pontos de dano de trevas. Além disso, criaturas vivas atingidas por uma sombra devem passar num teste de Fortitude ou perdem 1d4 PM. Sombras perdem a habilidade incorpóreo quando expostas à luz do sol.

### Consagrar
- **school**
  - nosso: Abjuração
  - site: Evocação
- **enhancements[1]**
  - nosso: aumenta as penalidades para mortos-vivos em –1.
  - site: aumenta as penalidades para mortos-vivos em –1. (penalidade máxima limitada pelo círculo máximo de magia que você pode lançar)
- **description**
  - nosso: Esta magia enche a área com energia positiva. Efeitos de luz que curam pontos de vida ou canalizam energia positiva têm seus efeitos maximizados. Por exemplo, Curar Ferimentos cura automaticamente 18 PV em alvos dentro da área. Esta magia não pode ser lançada em uma área contendo um símbolo visível dedicado a uma divindade que não a sua. Consagrar anula Profanar.
  - site: Você enche a área com energia positiva. Pontos de vida curados por efeitos de luz são maximizados dentro da área. Isso também afeta dano causado em mortos-vivos por esses efeitos. Por exemplo, Curar Ferimentos cura automaticamente 18 PV. Esta magia não pode ser lançada em uma área contendo um símbolo visível dedicado a uma divindade que não a sua. Consagrar anula Profanar.

### Controlar Fogo
- **enhancements(custos)**
  - nosso: +1;+2;+3
  - site: +1;+2;+3;+1
- **description**
  - nosso: Você pode criar, moldar, mover ou extinguir chamas e emanações de calor. Ao lançar a magia, escolha um dos efeitos.

Chamejar: o alvo é armas escolhidas. Elas causam +1d6 de dano de fogo. Também afeta armas naturais e ataques desarmados.

Esquentar: o alvo é 1 objeto, que começa a esquentar. Ele sofre 1d6 pontos de dano de fogo por rodada e causa o mesmo dano a qualquer criatura que o esteja segurando ou vestindo. A critério do mestre, o objeto ou a criatura vestindo-o também podem pegar fogo. Uma criatura pode gastar uma ação completa para resfriar o objeto (jogando areia ou se jogando numa fonte de água próxima, por exemplo) e cancelar o efeito da magia.

Extinguir: o alvo é 1 chama de tamanho Grande ou menor, que é apagada. Isso cria uma nuvem de fumaça que ocupa uma esfera de 3m de raio centrada onde estava a chama. Dentro da fumaça, criaturas têm camuflagem.

Modelar: o alvo é 1 chama de tamanho Grande ou menor. A cada rodada, você pode gastar uma ação livre para movimentá-la 9m em qualquer direção. Se atravessar o espaço ocupado por uma criatura, causa 2d6 pontos de dano de fogo. Uma criatura só pode receber dano dessa maneira uma vez por rodada.
  - site: Você pode criar, moldar, mover ou extinguir chamas e emanações de calor. Ao lançar a magia, escolha um dos efeitos. Chamejar: o alvo é armas escolhidas. Elas causam +1d6 de dano de fogo. Também afeta armas naturais e ataques desarmados. Esquentar: o alvo é 1 objeto, que começa a esquentar. Ele sofre 1d6 pontos de dano de fogo por rodada e causa o mesmo dano a qualquer criatura que o esteja segurando ou vestindo. A critério do mestre, o objeto ou a criatura vestindo-o também podem ficar em chamas. Uma criatura pode gastar uma ação completa para resfriar o objeto (jogando areia ou se jogando numa fonte de água próxima, por exemplo) e cancelar o efeito da magia. Extinguir: o alvo é 1 chama de tamanho Grande ou menor, que é apagada. Isso cria uma nuvem de fumaça que ocupa uma esfera com 3m de raio centrada onde estava a chama. Dentro da fumaça, criaturas têm camuflagem leve. Modelar: o alvo é 1 chama de tamanho Grande ou menor. A cada rodada, você pode gastar uma ação livre para movimentá-la 9m em qualquer direção. Se atravessar o espaço ocupado por uma criatura, causa 2d6 pontos de dano de fogo. Uma criatura só pode receber dano dessa maneira uma vez por rodada.

### Controlar o Clima
- **area**
  - nosso: círculo com 2km de raio
  - site: esfera com 2km de raio
- **enhancements[0]**
  - nosso: (Apenas Druidas): muda o raio da área para 3km e duração para 1d4 dias.
  - site: (Apenas Druidas) muda o raio da área para 3km e duração para 1d4 dias.
- **description**
  - nosso: Você muda o clima da área onde se encontra, podendo criar qualquer condição climática: chuva, neve, ventos, névoas...
  - site: Você muda o clima da área onde se encontra, podendo criar qualquer condição climática: chuva, neve, ventos, névoas... Veja o Capítulo 6: O Mestre para os efeitos do clima.

### Convocação Instantânea
- **area**
  - nosso: 1 objeto de até 5kg
  - site: 1 objeto de até 2 espaços
- **enhancements[0]**
  - nosso: além do normal, até 1 hora depois que lançou a magia, você pode gastar uma ação de movimento para enviar o objeto de volta para o local em que ele estava antes.
  - site: além do normal, até 1 hora após ter lançado a magia, você pode gastar uma ação de movimento para enviar o objeto de volta para o local em que ele estava antes.
- **enhancements[1]**
  - nosso: muda o alvo para um baú Médio, a duração para permanente e adiciona sacrifício de 1 PM. Em vez do normal, você esconde o baú alvo no Etéreo, com até 250kg de equipamento. A magia faz com que qualquer objeto caiba no baú, independentemente do seu tamanho. Uma vez escondido, você pode convocar o baú para um espaço livre adjacente, ou de volta para o Etéreo, como uma ação padrão. Componente material: baú construído com matéria-prima da melhor qualidade (T$ 1.000). Você deve ter em mãos uma miniatura do baú, no valor de T$ 100, para invocar o baú verdadeiro.
  - site: muda o alvo para um baú Médio, a duração para permanente e adiciona sacrifício de 1 PM. Em vez do normal, você esconde o baú no Éter Entre Mundos, com até 20 espaços de equipamento. A magia faz com que qualquer objeto caiba no baú, independentemente do seu tamanho. Uma vez escondido, você pode convocar o baú para um espaço livre adjacente, ou de volta para o Éter, com uma ação padrão. Componente material: baú construído com matéria- -prima da melhor qualidade (T$ 1.000). Você deve ter em mãos uma miniatura do baú, no valor de T$ 100, para invocar o baú verdadeiro.
- **enhancements[3]**
  - nosso: aumenta o peso limite do alvo em um fator de 10, até 500 kg. Um objeto muito grande ou pesado para aparecer em suas mãos é teletransportado para um espaço adjacente a sua escolha.
  - site: muda o alvo para 1 objeto de até 10 espaços. Um objeto muito grande ou pesado para aparecer em suas mãos surge em um espaço adjacente a sua escolha.
- **description**
  - nosso: Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com uma runa ou marca pessoal sua (ao custo de T$ 5). A magia não funciona se o objeto estiver com outra criatura, mas você saberá onde ele está e quem o está carregando (ou sua descrição física, caso não conheça a criatura).
  - site: Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com uma runa pessoal sua (ao custo de T$ 5). A magia não funciona se o objeto estiver com outra criatura, mas você saberá onde ele está e quem o está carregando (ou sua descrição física, caso não conheça a criatura).

### Criar Elementos
- **enhancements(custos)**
  - nosso: +1;+1;+2
  - site: +1;+1;+1
- **description**
  - nosso: Você cria uma pequena porção de um elemento, a sua escolha. Os elementos criados são reais, não mágicos. Elementos físicos devem surgir em uma superfície. Em vez de um cubo, pode-se criar objetos simples (sem partes móveis) feitos de gelo, terra ou pedra.

Água: enche um recipiente de tamanho Minúsculo (como um odre) com água potável ou cria um cubo de gelo de tamanho Minúsculo.

Ar: cria um vento fraco em um quadrado de 1,5m. Isso purifica a área de qualquer gás ou fumaça, ou remove névoa por uma rodada.

Fogo: cria uma chama que ilumina como uma tocha. Você pode segurá-la na palma de sua mão sem se queimar, ou fazê-la surgir em um quadrado de 1,5m. Se uma criatura ou objeto estiver no quadrado, sofre 1d6 pontos de dano de fogo; se falhar num teste de Reflexos, pega fogo.

Terra: cria um cubo de tamanho Minúsculo feito de terra, argila ou pedra.
  - site: Você cria uma pequena porção de um elemento, a sua escolha. Os elementos criados são reais, não mágicos. Elementos físicos devem surgir em uma superfície. Em vez de um cubo, pode- -se criar objetos simples (sem partes móveis) feitos de gelo, terra ou pedra. Água: enche um recipiente de tamanho Minúsculo (como um odre) com água potável ou cria um cubo de gelo de tamanho Minúsculo. Ar: cria um vento fraco em um quadrado de 1,5m. Isso purifica a área de qualquer gás ou fumaça, ou remove névoa por uma rodada. Fogo: cria uma chama que ilumina como uma tocha. Você pode segurá-la na palma de sua mão sem se queimar, ou fazê-la surgir em um quadrado de 1,5m. Se uma criatura ou objeto estiver no quadrado, sofre 1d6 pontos de dano de fogo se falhar num teste de Reflexos, fica em chamas. Terra: cria um cubo de tamanho Minúsculo feito de terra, argila ou pedra.

### Criar Ilusão
- **enhancements(custos)**
  - nosso: +1;+1;+1;+1;+2;+2;+2;+2;+5
  - site: +1;+1;+1;+1;+2;+2;+2;+5

### Crânio Voador de Vladislav
- **resistance**
  - nosso: Fortitude reduz à metade
  - site: Fortitude parcial
- **enhancements(custos)**
  - nosso: +1;+2
  - site: +2;+2
- **description**
  - nosso: Esta magia cria um crânio humano envolto em energia negativa, que causa 4d8+4 pontos de dano de trevas quando atinge o alvo e se desfaz emitindo um som horrendo, podendo deixar abalados todos os inimigos num raio de 3m. Passar no teste de resistência diminui o dano pela metade e evita a condição abalado. Alvos que já estiverem abalados e falharem no teste ficam apavorados por 1d4 rodadas.
  - site: Esta magia cria um crânio envolto em energia negativa. Quando atinge o alvo, ele causa 4d8+4 pontos de dano de trevas e se desfaz emitindo um som horrendo, deixando abalado o alvo e todos os inimigos num raio de 3m dele (criaturas já abaladas ficam apavoradas por 1d4 rodadas). Passar no teste de resistência diminui o dano à metade e evita a condição (as demais criaturas na área também tem direito ao teste de resistência, para evitar a condição).

### Círculo da Justiça
- **area**
  - nosso: cubo com 9m de lado
  - site: esfera com 9m de raio
- **enhancements[0]**
  - nosso: muda a execução para ação padrão, o alcance para pessoal, o alvo para você, a duração para cena e a resistência para nenhuma. Em vez do normal, qualquer criatura ou objeto invisível em alcance curto se torna visível. Isso não anula o efeito mágico; se sair do seu alcance, a criatura ou objeto voltam a ficar invisíveis.
  - site: muda a execução para ação padrão, o alcance para pessoal, o alvo para você, a duração para cena e a resistência para nenhuma. Em vez do normal, qualquer criatura ou objeto invisível em alcance curto se torna visível. Isso não dissipa o efeito mágicose sair do seu alcance, a criatura ou objeto voltam a ficar invisíveis.
- **description**
  - nosso: Também conhecida como Lágrimas do Deus da Trapaça, esta magia é usada em tribunais e para proteger áreas sensíveis. Criaturas na área sofrem –10 em testes de Acrobacia, Enganação, Furtividade e Ladinagem e não podem mentir deliberadamente — mas podem tentar evitar perguntas que normalmente responderiam com uma mentira (sendo evasivas ou cometendo omissões, por exemplo). Uma criatura que passe na resistência tem as penalidades reduzidas para –5 e pode mentir.
  - site: Também conhecida como Lágrimas de Hyninn, esta magia é usada em tribunais e para proteger áreas sensíveis. Criaturas na área sofrem –10 em testes de Acrobacia, Enganação, Furtividade e Ladinagem e não podem mentir deliberadamente — mas podem tentar evitar perguntas que normalmente responderiam com uma mentira (sendo evasivas ou cometendo omissões, por exemplo). Uma criatura que passe na resistência tem as penalidades reduzidas para –5 e pode mentir.

### Círculo da Restauração
- **area**
  - nosso: círculo de 3m de raio
  - site: esfera com 3m de raio
- **description**
  - nosso: Você evoca um círculo de luz que emana uma energia poderosa. Qualquer criatura viva que termine o turno dentro do círculo recupera 3d8+3 PV e 1 PM. Mortos-vivos e criaturas que sofrem dano por luz perdem PV e PM na mesma quantidade. Uma criatura só pode recuperar PM através desta magia uma vez por dia.
  - site: Você evoca um círculo de luz que emana uma energia poderosa. Qualquer criatura viva que termine o turno dentro do círculo recupera 3d8+3 PV e 1 PM. Mortos-vivos e criaturas que sofrem dano por luz perdem PV e PM na mesma quantidade. Uma criatura pode recuperar no máximo 5 PM por dia com esta magia.

### Cúpula de Repulsão
- **duration**
  - nosso: cena
  - site: sustentada
- **resistance**
  - nosso: 
  - site: Vontade anula
- **enhancements(custos)**
  - nosso: +1;+4;+8
  - site: +2;+5
- **description**
  - nosso: Uma cúpula de energia invisível o cerca, impedindo a aproximação de certas criaturas. Escolha um tipo de criatura com uma limitação específica, como animais mamíferos, monstros insetoides ou mortos-vivos corpóreos; ou uma raça, como elfos, goblins ou minotauros. Criaturas com o tipo e a limitação escolhidos (ou com a raça escolhida) não podem se aproximar a até 3m de você. Isso detém ataques corpo a corpo, mas não ataques à distância ou magias. Se você tentar se aproximar além do limite de 3m, rompe a cúpula e a magia é dissipada.
  - site: Uma cúpula de energia invisível o cerca, impedindo a aproximação de certas criaturas. Escolha um tipo de criatura (animais, espíritos, monstros...) ou uma raça de humanoides (elfos, goblins, minotauros..). Criaturas do grupo escolhido que tentem se aproximar a menos de 3m de você (ou seja, que tentem ficar adjacentes a você) devem fazer um teste de Vontade. Se falharem, não conseguem, gastam a ação e só podem tentar novamente na rodada seguinte. Isso impede ataques corpo a corpo, mas não ataques ou outros efeitos à distância. Se você tentar se aproximar além do limite de 3m, rompe a cúpula e a magia é dissipada.

### Deflagração de Mana
- **area**
  - nosso: explosão de 15m de raio
  - site: esfera com 15m de raio
- **duration**
  - nosso: 
  - site: instantânea
- **description**
  - nosso: Após concentrar seu mana, você explode em dano de essência, como uma estrela em plena terra. Todas as criaturas na área sofrem 150 pontos de dano de essência, e todos os itens mágicos (exceto artefatos) tornam-se mundanos. Você não é afetado pela magia. Alvos que passem no teste de Fortitude sofrem apenas metade do dano e seus itens mágicos voltam a funcionar depois de um dia.
  - site: Após concentrar seu mana, você emana energia, como uma estrela em plena terra. Todas as criaturas na área sofrem 150 pontos de dano de essência e todos os itens mágicos (exceto artefatos) tornam-se mundanos. Você não é afetado pela magia. Alvos que passem no teste de Fortitude sofrem metade do dano e seus itens mágicos voltam a funcionar após um dia.

### Desespero Esmagador
- **range**
  - nosso: 6m
  - site: pessoal
- **area**
  - nosso: cone
  - site: cone de 6m
- **enhancements[2]**
  - nosso: além do normal, criaturas que falhem na resistência ficam aos prantos (em termos de regras, adquirem a condição pasmo) por 1 rodada. Requer 3º círculo.
  - site: além do normal, criaturas que falhem na resistência ficam aos prantos (pasmos) por 1 rodada (apenas uma vez por cena). Requer 3º círculo.
- **description**
  - nosso: Humanoides na área são acometidos de grande tristeza, adquirindo as condições fraco e frustrado. Se passarem na resistência, adquirem esta condição por uma rodada.
  - site: Humanoides na área são acometidos de grande tristeza, ficando fracos e frustrados até o fim da cena (ou por uma rodada, se passarem no teste de resistência).

### Despedaçar
- **resistance**
  - nosso: Fortitude parcial ou Reflexos anula
  - site: Fortitude parcial
- **enhancements[5]**
  - nosso: muda o alcance para pessoal e a área para explosão de 6m de raio. Todas as criaturas e objetos na área são afetados.
  - site: muda o alcance para pessoal e a área para esfera com 6m de raio. Todas as criaturas e objetos mundanos na área são afetados.

### Detectar Ameaças
- **area**
  - nosso: esfera de 9m de raio
  - site: esfera com 18m de raio
- **enhancements[1]**
  - nosso: além do normal, você não fica surpreso desprevenido contra perigos detectados com sucesso e recebe +5 em testes de resistência contra armadilhas. Requer 2º círculo.
  - site: além do normal, você não fica surpreendido contra perigos detectados com sucesso e recebe +5 em testes de resistência contra armadilhas. Requer 2º círculo.

### Detonação Congelante
- **area**
  - nosso: esfera de 6m de raio
  - site: esfera de 6m
- **resistance**
  - nosso: Fortitude Parcial
  - site: Fortitude parcial

### Disfarce Ilusório
- **enhancements(custos)**
  - nosso: +1;+1;+2;+3
  - site: +1;+2;+2;+3

### Disparo Gélido
- **range**
  - nosso: Médio
  - site: médio
- **enhancements(custos)**
  - nosso: +1;+1
  - site: +1;+1;+1

### Dispersar as Trevas
- **area**
  - nosso: esfera de 6m de raio
  - site: esfera com 6m de raio
- **duration**
  - nosso: instantânea
  - site: veja texto
- **enhancements[1]**
  - nosso: muda o alcance para curto, a área para alvo 1 criatura e a duração para cena. O alvo fica imune a efeitos de necromancia e trevas.
  - site: muda o alcance para curto, a área para alvo 1 criatura e a duração para cena. O alvo fica imune a efeitos de trevas.
- **enhancements[2]**
  - nosso: muda o círculo máximo de magias dissipadas para 4º. Requer 4º círculo.
  - site: muda o círculo máximo des dissipadas para 4º. Requer 4º círculo.
- **enhancements[3]**
  - nosso: muda o círculo máximo de magias dissipadas para 5º. Requer 5º círculo.
  - site: muda o círculo máximo des dissipadas para 5º. Requer 5º círculo.
- **description**
  - nosso: Esta magia cria um forte brilho (multicolorido ou de uma cor que remeta a sua divindade) que causa diversos efeitos. Todas as magias de 3º círculo ou menor ativas na área são dissipadas se você passar num teste de Religião contra a CD de cada magia. Seus aliados na área recebem +4 em testes de resistência e resistência a trevas 10 até o fim da cena, protegidos por uma aura sutil da mesma cor. Inimigos na área ficam cegos por 1d4 rodadas. Dispersar as Trevas anula Anular a Luz.
  - site: Esta magia cria um forte brilho (multicolorido ou de uma cor que remeta a sua divindade) que causa diversos efeitos. Todas as magias de 3º círculo ou menor ativas na área são dissipadas se você passar num teste de Religião contra a CD de cada magia. Seus aliados na área recebem +4 em testes de resistência e redução de trevas 10 até o fim da cena, protegidos por uma aura sutil da mesma cor. Inimigos na área ficam cegos por 1d4 rodadas (apenas uma vez por cena). Dispersar as Trevas anula Anular a Luz (este efeito tem duração instantânea).

### Enfeitiçar
- **castingTime**
  - nosso: ação padrão
  - site: padrão
- **enhancements[0]**
  - nosso: em vez do normal, você sugere uma ação para o alvo e ele obedece. A sugestão deve ser feita de modo que pareça aceitável, a critério do mestre. Pedir ao alvo que pule em um precipício, por exemplo, anula a magia. Já sugerir a um guarda que descanse um pouco, de modo que você e seus aliados passem por ele, é aceitável. Quando o alvo executa a ação, a magia termina. Você pode determinar uma condição específica para a sugestão: por exemplo, que um rico mercador doe suas moedas para o primeiro mendigo que encontrar.
  - site: em vez do normal, você sugere uma ação para o alvo e ele obedece. A sugestão deve ser feita de modo que pareça aceitável, a critério do mestre. Pedir ao alvo que pule de um precipício, por exemplo, dissipa a magia. Já sugerir a um guarda que descanse um pouco, de modo que você e seus aliados passem por ele, é aceitável. Quando o alvo executa a ação, a magia termina. Você pode determinar uma condição específica para a sugestão: por exemplo, que um rico mercador doe suas moedas para o primeiro mendigo que encontrar.
- **description**
  - nosso: Esta magia torna o alvo prestativo (veja Diplomacia na página Perícias ). Ele não fica sob seu controle, mas percebe suas palavras e ações da maneira mais favorável possível. Você recebe um bônus de +10 em testes de Diplomacia com a vítima. Um alvo hostil ou que esteja envolvido em um combate recebe +5 em seu teste de resistência. Se você ou seus aliados tomarem qualquer ação hostil contra o alvo, a magia é anulada e o alvo retorna à atitude que tinha antes (ou piorada, de acordo com o mestre).
  - site: O alvo fica enfeitiçado (veja a página 394). Um alvo hostil ou que esteja envolvido em um combate recebe +5 em seu teste de resistência. Se você ou seus aliados tomarem qualquer ação hostil contra o alvo, a magia é dissipada e o alvo retorna à atitude que tinha antes (ou piorada, de acordo com o mestre).

### Enxame Rubro de Ichabod
- **area**
  - nosso: 1 enxame Grade (quadrado de 3m)
  - site: 1 enxame Grande (quadrado de 3m)
- **resistance**
  - nosso: Reflexos parcial
  - site: Reflexos reduz à metade
- **enhancements[2]**
  - nosso: muda o tipo de dano para trevas.
  - site: muda o dano para trevas.
- **enhancements[5]**
  - nosso: o enxame inclui parasitas inchados que explodem e criam novos enxames. No início de cada um de seus turnos, role 1d6. Em um resultado 5 ou 6, um novo enxame surge adjacente a um já existente à sua escolha. Você pode mover todos os enxames com uma única ação de movimento, mas eles não podem ocupar o mesmo espaço. Requer 4º círculo.
  - site: o enxame inclui parasitas que explodem e criam novos enxames. No início de cada um de seus turnos, role 1d6. Em um resultado 5 ou 6, um novo enxame surge adjacente a um já existente à sua escolha. Você pode mover todos os enxames com uma única ação de movimento, mas eles não podem ocupar o mesmo espaço. Requer 4º círculo.
- **description**
  - nosso: Você conjura um enxame de pequenas criaturas da Tormenta, que surge em um ponto a sua escolha. O enxame pode passar pelo espaço de outras criaturas e não impede que outras criaturas entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 4d12 pontos de dano de ácido a qualquer criatura em seu espaço (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.
  - site: Você conjura um enxame de pequenas criaturas da Tormenta. O enxame pode passar pelo espaço de outras criaturas e não impede que outras criaturas entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 4d12 pontos de dano de ácido a qualquer criatura em seu espaço (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.

### Erupção Glacial
- **enhancements(custos)**
  - nosso: +3;+4
  - site: +3;+4;+1
- **description**
  - nosso: Estacas de gelo irrompem do chão. Criaturas na área sofrem 4d6 de dano de corte, 4d6 de dano de frio e ficam caídas. Passar no teste de Reflexos evita o dano de corte e a queda. As estacas duram pela cena, o que torna a área afetada terreno difícil, e concedem cobertura para criaturas dentro da área ou atrás dela. As estacas são destruídas caso sofram qualquer quantidade de dano por fogo mágico.
  - site: Estacas de gelo irrompem do chão. Criaturas na área sofrem 4d6 de dano de corte, 4d6 de dano de frio e ficam caídas. Passar no teste de Reflexos evita o dano de corte e a queda. As estacas duram pela cena, o que torna a área afetada terreno difícil, e concedem cobertura leve para criaturas dentro da área ou atrás dela. As estacas são destruídas caso sofram qualquer quantidade de dano por fogo mágico.

### Escuridão
- **resistance**
  - nosso: 
  - site: Vontade anula (veja texto)
- **enhancements(custos)**
  - nosso: +1;+2;+2;+2;+5
  - site: +1;+2;+2;+3;+5
- **description**
  - nosso: O alvo emana sombras em uma área com 6m de raio. Criaturas dentro da área recebem camuflagem por escuridão. As sombras não podem ser iluminadas por nenhuma fonte de luz natural. O objeto pode ser guardado (em um bolso, por exemplo) para interromper a escuridão, que voltará a funcionar caso o objeto seja revelado. Se lançar a magia num objeto de uma criatura involuntária, ela tem direito a um teste de Vontade para anulá-la. Escuridão anula Luz.
  - site: O alvo emana sombras em uma área com 6m de raio. Criaturas dentro da área recebem camuflagem leve por escuridão leve. As sombras não podem ser iluminadas por nenhuma fonte de luz natural. O objeto pode ser guardado (em um bolso, por exemplo) para interromper a escuridão, que voltará a funcionar caso o objeto seja revelado. Se lançar a magia num objeto de uma criatura involuntária, ela tem direito a um teste de Vontade para anulá-la. Escuridão anula Luz.

### Explosão Caleidoscópica
- **area**
  - nosso: esfera de 6m de raio
  - site: esfera com 6m de raio
- **description**
  - nosso: Esta magia cria uma forte explosão de luzes estroboscópicas e sons cacofônicos que desorientam as criaturas atingidas. O efeito que cada criatura sofre depende do ND dela.

ND 4 ou menor: se falhar no teste de resistência, fica inconsciente. Se passar, fica atordoada por 1d4 rodadas e enjoada pelo resto da cena.

ND entre 5 e 9: se falhar no teste de resistência, fica atordoada por 1d4 rodadas e enjoada pelo resto da cena. Se passar, fica atordoada por 1 rodada e enjoada por 1d4 rodadas.

ND 10 ou maior: se falhar no teste de resistência, fica atordoada por 1 rodada e enjoada por 1d4 rodadas. Se passar, fica desprevenida e enjoada por 1 rodada.
  - site: Esta magia cria uma forte explosão de luzes estroboscópicas e sons cacofônicos que desorientam as criaturas atingidas. O efeito que cada criatura sofre depende do nível ou ND dela. Nível ou ND 4 ou menor: se falhar no teste de resistência, fica inconsciente. Se passar, fica atordoada por 1d4 rodadas e enjoada pelo resto da cena. Nível ou ND entre 5 e 9: se falhar no teste de resistência, fica atordoada por 1d4 rodadas e enjoada pelo resto da cena. Se passar, fica atordoada por 1 rodada e enjoada por 1d4 rodadas. Nível ou ND 10 ou maior: se falhar no teste de resistência, fica atordoada por 1 rodada e enjoada por 1d4 rodadas. Se passar, fica desprevenida e enjoada por 1 rodada. Uma criatura só pode ser atordoada por esta magia uma vez por cena.

### Explosão de Chamas
- **range**
  - nosso: 6m
  - site: pessoal
- **area**
  - nosso: cone
  - site: cone de 6m
- **enhancements(custos)**
  - nosso: +1;+2
  - site: +1;+1;+1

### Ferver Sangue
- **resistance**
  - nosso: Fortitude reduz à metade
  - site: Fortitude parcial
- **enhancements[0]**
  - nosso: aumenta o dano em +1d6.
  - site: aumenta o dano em +1d8.
- **description**
  - nosso: O sangue do alvo aquece rapidamente até entrar em ebulição. Quando a magia é lançada, e no início de cada um de seus turnos, o alvo sofre 3d6 pontos de dano de fogo (Fortitude reduz à metade). Se o alvo passar em dois testes de Fortitude seguidos, dissipa a magia. Se o alvo for reduzido a 0 PV pelo dano desta magia, seu corpo explode, matando-o e causando 6d6 pontos de dano de fogo em todas as criaturas a até 3m (Reflexos reduz à metade). Essa magia não afeta criaturas sem sangue, como construtos ou espíritos.
  - site: O sangue do alvo aquece até entrar em ebulição. Quando a magia é lançada, e no início de cada um de seus turnos, o alvo sofre 4d8 pontos de dano de fogo e fica enjoado por uma rodada (Fortitude reduz o dano à metade e evita a condição). Se o alvo passar em dois testes de Fortitude seguidos, dissipa a magia. Se o alvo for reduzido a 0 PV pelo dano desta magia, seu corpo explode, matando-o e causando 6d6 pontos de dano de fogo em todas as criaturas a até 3m (Reflexos reduz à metade). Essa magia não afeta criaturas sem sangue, como construtos ou mortos-vivos.

### Físico Divino
- **enhancements(custos)**
  - nosso: +3;+7;+7
  - site: +3;+3;+7;+12
- **description**
  - nosso: O alvo se torna uma versão mais poderosa de si mesmo. O alvo recebe +4 em Força, Destreza ou Constituição, a sua escolha. Esse aumento não oferece PV ou PM adicionais.
  - site: Você fortalece o corpo do alvo. Ele recebe +2 em Força, Destreza ou Constituição, a sua escolha. Esse aumento não oferece PV ou PM adicionais.

### Fúria do Panteão
- **area**
  - nosso: nuvem de tempestade com 90m de lado
  - site: cubo de 90m
- **resistance**
  - nosso: 
  - site: veja texto
- **enhancements(custos)**
  - nosso: 
  - site: +1
- **description**
  - nosso: Você cria uma nuvem de tempestade, com trovões e relâmpagos. Enquanto você sustenta a magia, ela gera os seguintes efeitos, sempre no início do seu turno.

1ª rodada (quando você lança a magia): trovões ribombam. Criaturas na área sofrem 6d6 pontos de dano de impacto e ficam surdas por uma rodada.

2ª rodada: relâmpagos caem. Até seis criaturas a sua escolha na área sofrem 10d8 pontos de dano de eletricidade.

3º rodada em diante: chuva gélida e ventos causam 6d6 pontos de dano de frio por rodada. Além disso, reduzem a visibilidade (como a magia Névoa), transformam toda a área em terreno difícil e tornam ataques à distância impossíveis. Por fim, a área conta como condição terrível para conjuradores lançarem magias.
  - site: Você cria uma nuvem de tempestade violenta. Os ventos tornam ataques à distância impossíveis e fazem a área contar como condição terrível para lançar magia. Além disso, inimigos na área têm a visibilidade reduzida (como a magia Névoa). Uma vez por turno, você pode gastar uma ação de movimento para gerar um dos efeitos a seguir.

Nevasca. Inimigos na área sofrem 10d6 pontos de dano de frio (Fortitude reduz à metade). A área fica coberta de neve, virando terreno difícil até o fim da cena ou até você usar siroco.

Raios. Até 6 inimigos a sua escolha na área sofrem 10d8 pontos de dano de eletricidade (Reflexos reduz à metade).

Siroco. Transforma a chuva em uma tempestade de areia escaldante. Inimigos na área sofrem 10d6 pontos de dano (metade corte, metade fogo) e ficam sangrando (Fortitude reduz o dano à metade e evita a condição). Trovões. Inimigos sofrem 10d6 pontos de dano de impacto e ficam desprevenidos por uma rodada (Fortitude reduz o dano à metade e evita a condição).

### Globo da Verdade de Gwen
- **area**
  - nosso: 
  - site: 1 globo
- **description**
  - nosso: Cria um globo flutuante e intangível, com 50cm de diâmetro. O globo mostra uma cena vista até uma semana atrás por você ou por uma criatura que você toque ao lançar a magia (mediante uma pergunta; a criatura pode fazer um teste de Vontade para anular o efeito), permitindo que outras pessoas a vejam.
  - site: Cria um globo flutuante e intangível, com 50cm de diâmetro. O globo mostra uma cena vista até uma semana atrás por você ou por uma criatura que você toque ao lançar a magia (mediante uma pergunta a criatura pode fazer um teste de Vontade para anular o efeito), permitindo que outras pessoas a vejam.

### Gêiser Cáustico
- **castingTime**
  - nosso: padrão
  - site: ação padrão
- **range**
  - nosso: Médio
  - site: médio
- **area**
  - nosso: Cilindro com 3m de diâmetro e altura
  - site: cilindro com 3m de diâmetro e 3m de altura

### Heroísmo
- **enhancements(custos)**
  - nosso: +4
  - site: +2

### Hipnotismo
- **area**
  - nosso: criaturas escolhidas de ND 2 ou menor
  - site: 1 animal ou humanoide
- **enhancements(custos)**
  - nosso: +1;+2;+2;+2;+5;+9;+14
  - site: +1;+2;+2;+2;+5
- **description**
  - nosso: Suas palavras e movimentos ritmados deixam as criaturas fascinadas (veja Condições, na página Regras para Combate ). Esta magia só afeta criaturas que possam perceber você. Se usar esta magia em combate, os alvos recebem +5 em seus testes de resistência.

Truque: muda o alvo para 1 criatura e a duração para 1 rodada. Em vez de fascinado, o alvo fica pasmo. Uma criatura só pode ser afetada por este truque uma vez por cena.
  - site: Suas palavras e movimentos ritmados deixam o alvo fascinado. Esta magia só afeta criaturas que possam perceber você. Se usar esta magia em combate, o alvo recebe +5 em seu teste de resistência. Se a criatura passar, fica imune a este efeito por um dia.

Truque: muda a duração para 1 rodada. Em vez de fascinado, o alvo fica pasmo (apenas uma vez por cena).

### Ilusão Lacerante
- **range**
  - nosso: curto
  - site: médio
- **area**
  - nosso: 1 criatura
  - site: cubo de 9m
- **duration**
  - nosso: cena
  - site: sustentada
- **enhancements(custos)**
  - nosso: +2;+3
  - site: +3;+4
- **description**
  - nosso: Você cria uma ilusão de algum perigo mortal. Quando a magia é lançada, e no início de cada um de seus turnos, o alvo deve fazer um teste de Vontade; se falhar, acredita que a ilusão é real e sofre 3d6 pontos de dano. O tipo de dano depende da ilusão — fogo para uma ilusão de chamas, impacto para uma ilusão de desmoronamento etc. Somente o alvo pode ver a ilusão, e racionaliza o efeito sempre que falha no teste (por exemplo, acredita que o mesmo teto pode cair sobre ele várias vezes). Se o alvo passar em dois testes de Vontade seguidos, anula o efeito.
  - site: Você cria uma ilusão de algum perigo mortal. Quando a magia é lançada, criaturas na área devem fazer um teste de Vontade uma falha significa que a criatura acredita que a ilusão é real e sofre 3d6 pontos de dano psíquico não letal. Sempre que uma criatura iniciar seu turno dentro da área, deve repetir o teste de Vontade. Se falhar, sofre o dano novamente. Somente criaturas que falham veem a ilusão, e racionalizam o efeito sempre que falham no teste (por exemplo, acredita que o mesmo teto pode cair sobre ela várias vezes).

### Imagem Espelhada
- **enhancements(custos)**
  - nosso: +2;+5
  - site: +2;+2

### Infligir Ferimentos
- **enhancements(custos)**
  - nosso: +2;+2;+2;+5
  - site: +1;+2;+2;+5

### Lança Ígnea de Aleph
- **enhancements(custos)**
  - nosso: +3;+4
  - site: +3;+4;+1
- **description**
  - nosso: Esta magia foi desenvolvida pelo mago imortal Aleph Olhos Vermelhos, um entusiasta dos estudos vulcânicos. Ela dispara um projétil de magma superaquecido contra o alvo, que sofre 4d6 pontos de dano de fogo e 4d6 pontos de dano de perfuração e fica em chamas. As chamas causam 2d6 pontos de dano por rodada, em vez do dano normal. Se passar no teste de resistência, o alvo sofre metade do dano e não fica em chamas.

Respingos de rocha incandescente se espalham com a explosão, atingindo todas as criaturas adjacentes ao alvo, que devem fazer um teste de Reflexos. Se falharem, ficam em chamas, como descrito acima.
  - site: Esta magia foi desenvolvida pelo mago imortal Aleph Olhos Vermelhos, um entusiasta dos estudos vulcânicos. Ela dispara um projétil de magma contra o alvo, que sofre 4d6 pontos de dano de fogo e 4d6 pontos de dano de perfuração e fica em chamas. As chamas causam 2d6 pontos de dano por rodada, em vez do dano normal. Se passar no teste de resistência, o alvo sofre metade do dano e não fica em chamas. Respingos de rocha incandescente se espalham com a explosão, atingindo todas as criaturas adjacentes ao alvo, que devem fazer um teste de Reflexos. Se falharem, ficam em chamas, como descrito acima.

### Leque Cromático
- **range**
  - nosso: 4,5m
  - site: pessoal
- **area**
  - nosso: cone
  - site: cone de 4,5m
- **enhancements(custos)**
  - nosso: +2;+2;+5;+9;+14
  - site: +2;+2;+5
- **description**
  - nosso: Um cone de luzes brilhantes surge a partir das suas mãos, deixando as criaturas na área atordoadas por 1 rodada e ofuscadas pela cena. Caso passem na resistência, não ficam atordoadas. Esta magia afeta apenas criaturas de ND 2 ou menor e não afeta criaturas cegas.
  - site: Um cone de luzes brilhantes surge das suas mãos, deixando os animais e humanoides na área atordoados por 1 rodada (apenas uma vez por cena, Vontade anula) e ofuscados pela cena. Esta magia não afeta criaturas cegas.

### Localização
- **area**
  - nosso: círculo com 90m de raio
  - site: esfera com 90m de raio
- **enhancements[0]**
  - nosso: aumenta a área em um fator de 10 (90m para 900m, 900m para 9km, e assim por diante).
  - site: aumenta a área em um fator de 10 (90m para 900m, 900m para 9km e assim por diante).
- **description**
  - nosso: Esta magia pode encontrar uma criatura ou objeto a sua escolha. Você pode pensar em termos gerais (“um elfo”, “algo de metal”) ou específicos (“Gwen, a elfa”, “uma espada longa”). A magia indica a direção e distância da criatura ou objeto mais próximo desse tipo, caso esteja ao alcance. Você pode movimentar-se para continuar procurando. Procurar algo muito específico (“a espada longa encantada do Barão Rulyn”) exige que você tenha em mente uma imagem precisa do objeto; caso a imagem não seja muito próxima da verdade, a magia falha, mas você gasta os PM mesmo assim. Esta magia pode ser bloqueada por uma fina camada de chumbo.

Truque: muda a área para alvo você. Em vez do normal, você sabe onde fica o norte e recebe +5 em testes de Sobrevivência para se orientar.
  - site: Esta magia pode encontrar uma criatura ou objeto a sua escolha. Você pode pensar em termos gerais (“um elfo”, “algo de metal”) ou específicos (“Gwen, a elfa”, “uma espada longa”). A magia indica a direção e distância da criatura ou objeto mais próximo desse tipo, caso esteja ao alcance. Você pode movimentar-se para continuar procurando. Procurar algo muito específico (“a espada longa encantada do Barão Rulyn”) exige que você tenha em mente uma imagem precisa do objeto caso a imagem não seja muito próxima da verdade, a magia falha, mas você gasta os PM mesmo assim. Esta magia pode ser bloqueada por uma fina camada de chumbo.

Truque: muda a área para alvo você. Em vez do normal, você sabe onde fica o norte e recebe +5 em testes de Sobrevivência para se orientar.

### Manto do Cruzado
- **school**
  - nosso: Convocação
  - site: Evocação
- **description**
  - nosso: Você invoca a energia sagrada de sua divindade na forma de um manto de energia sólida que reveste seu corpo. Esta magia tem duas versões. Você escolhe qual versão pode lançar quando aprende esta magia. Ela não pode ser mudada.

Manto de Luz: um manto dourado e luminoso. No início de cada um de seus turnos, você e todos os seus aliados em alcance curto recuperam 2d8 PV. Você fica imune a dano de trevas e seus ataques corpo a corpo causam +2d8 pontos de dano de luz.

Manto de Trevas: um manto negro como a noite. No início de cada um de seus turnos, todos os inimigos em alcance curto sofrem 2d8 pontos de dano de trevas. Você cura metade de todo o dano causado pela magia.
  - site: Você invoca o poder de sua divindade na forma de um manto de energia que reveste seu corpo. Esta magia tem duas versões. Você escolhe qual versão pode lançar quando aprende esta magia. Ela não pode ser mudada. Manto de Luz: um manto dourado e luminoso. No início de cada um de seus turnos, você e todos os seus aliados em alcance curto recuperam 2d8 PV. Você recebe imunidade a dano de trevas e seus ataques corpo a corpo causam +2d8 pontos de dano de luz. Manto de Trevas: um manto negro como a noite. No início de cada um de seus turnos, todos os inimigos em alcance curto sofrem 4d8 pontos de dano de trevas. Você cura metade de todo o dano causado pela magia.

### Mapear
- **area**
  - nosso: superfície ou objeto plano, como uma mesa ou pergaminho
  - site: superfície ou objeto plano, como uma mesa ou papel
- **enhancements[0]**
  - nosso: muda o alvo para 1 criatura e a duração para 1 hora. Em vez do normal, a criatura tocada descobre o caminho mais direto para entrar ou sair de um lugar. Assim, a magia pode ser usada para descobrir a rota até o relicário de uma catedral ou a saída mais próxima de uma masmorra (mas não para encontrar a localização de uma criatura ou objeto; a magia funciona apenas em relação a lugares). Caso a criatura demore mais de uma hora para percorrer o caminho, o conhecimento se perde.
  - site: muda o alvo para 1 criatura e a duração para 1 hora. Em vez do normal, a criatura tocada descobre o caminho mais direto para entrar ou sair de um lugar. Assim, a magia pode ser usada para descobrir a rota até o relicário de uma catedral ou a saída mais próxima de uma masmorra (mas não para encontrar a localização de uma criatura ou objeto a magia funciona apenas em relação a lugares). Caso a criatura demore mais de uma hora para percorrer o caminho, o conhecimento se perde.

### Mata-Dragão
- **area**
  - nosso: explosão em cone de 30m
  - site: cone de 30m
- **enhancements[0]**
  - nosso: aumenta o dano em 1d12.
  - site: aumenta o dano em +1d12.
- **description**
  - nosso: Esta é uma das mais poderosas magias de destruição existentes. Após entoar longos cânticos, o conjurador dispara uma carga de energia que varre uma enorme área à sua frente, causando 20d12 pontos de dano de essência em todas as criaturas, construções e objetos livres atingidos. Apesar de seu poder destrutivo, esta magia é lenta, tornando seu uso difícil em combate. Além disso, pode causar tantos danos colaterais que poucos conjuradores se arriscam a utilizá-la.
  - site: Esta é uma das mais poderosas magias de destruição existentes. Após entoar longos cânticos, o conjurador dispara uma carga de energia que varre uma enorme área à sua frente, causando 20d12 pontos de dano de essência em todas as criaturas, construções e objetos livres atingidos. Sempre que rola um resultado 12 em um dado de dano, a magia causa +1d12 pontos de dano. Apesar de seu poder destrutivo, esta magia é lenta, tornando seu uso difícil em combate.

### Mente Divina
- **enhancements(custos)**
  - nosso: +3;+7;+7
  - site: +3;+3;+7;+12
- **description**
  - nosso: Você traz inspiração divina à mente do alvo. Escolha entre Inteligência, Sabedoria ou Carisma. O alvo recebe +4 no atributo escolhido. Esse aumento não oferece PV ou PM adicionais.
  - site: Você fortalece a mente do alvo. Ele recebe +2 em Inteligência, Sabedoria ou Carisma, a sua escolha. Esse aumento não oferece PV, PM ou perícias adicionais.

### Muralha Elemental
- **enhancements(custos)**
  - nosso: +2;+4
  - site: +2;+2;+4;+1
- **description**
  - nosso: Esta magia cria uma muralha de um elemento a sua escolha. A muralha pode ter duas formas: uma barreira de até 30m de comprimento e 3m de altura (ou o contrário) ou uma cúpula de 3m de raio. Os efeitos variam conforme o tipo de elemento escolhido.

Fogo: Faz surgir uma violenta cortina de chamas. Um lado da muralha (a sua escolha) emite ondas de calor, que causam 2d6 pontos de dano de fogo em criaturas a até 6m. A muralha causa esse dano quando surge e no início de seus turnos. Atravessar a muralha causa 8d6 pontos de dano de fogo. Caso seja criada em uma área onde existem criaturas, elas sofrem dano como se estivessem atravessando a muralha, mas podem fazer um teste de Reflexos para reduzir o dano à metade (a criatura escolhe para qual lado quer escapar, mas se escapar para o lado quente sofrerá mais 2d6 pontos de dano).

Gelo: Evoca uma parede grossa de gelo denso com 15cm de espessura. Na forma de cúpula, pode prender uma ou mais criaturas, mas elas têm direito a um teste de Reflexos para escapar antes que a cúpula se forme. Cada trecho de 3m da muralha tem Defesa 8, 40 PV e RD 5. Um trecho da muralha que atinja 0 PV será rompido. Qualquer efeito de fogo causa dano dobrado à muralha. Uma criatura que atravesse um trecho rompido da muralha sofre 4d6 pontos de dano de frio.
  - site: Uma muralha de um elemento a sua escolha se eleva da terra. Ela pode ser um muro de até 30m de comprimento e 3m de altura (ou o contrário) ou uma cúpula de 3m de raio. Os efeitos variam conforme o elemento escolhido.

Fogo. Faz surgir uma violenta cortina de chamas. Um lado da muralha (a sua escolha) emite ondas de calor, que causam 2d6 pontos de dano de fogo em criaturas a até 6m quando você lança a e no início de seus turnos. Atravessar a muralha causa 8d6 pontos de dano de fogo. Caso seja criada em uma área onde existem criaturas, elas sofrem dano como se estivessem atravessando a muralha, mas podem fazer um teste de Reflexos para reduzir o dano à metade e escapar para um lado (a criatura escolhe, mas se escapar para o lado quente sofrerá mais 2d6 pontos de dano).

Gelo. Evoca uma parede grossa de gelo denso com 15cm de espessura. Na forma de cúpula, pode prender uma ou mais criaturas, mas elas têm direito a um teste de Reflexos para escapar antes que a cúpula se forme. Cada trecho de 3m da muralha tem Defesa 8, 40 PV e RD 5. Um trecho da muralha que atinja 0 PV será rompido. Qualquer efeito de fogo causa dano dobrado à muralha. Uma criatura que atravesse um trecho rompido da muralha sofre 4d6 pontos de dano de frio.

### Muralha de Ossos
- **enhancements(custos)**
  - nosso: +2;+5
  - site: +3;+5
- **description**
  - nosso: Uma parede de ossos se eleva da terra. A parede tem 15m de comprimento, 3m de altura e 1,5m de espessura. Ela pode ter qualquer forma — não precisa ser uma linha reta —, mas sua base precisa estar no chão e ela não pode aparecer de modo que ocupe o espaço de uma criatura.

É possível escalar a parede. Isso exige um teste de Atletismo e causa 4d8 pontos de dano de corte. Também é possível destruir o muro para atravessá-lo ou libertar uma criatura agarrada. Cada trecho de 3m do muro tem Defesa 8, 40 PV e resistência a corte, frio e perfuração 5.
  - site: Uma parede de ossos se eleva da terra. A parede tem 15m de comprimento, 9m de altura e 1,5m de espessura. Ela pode ter qualquer forma — não precisa ser uma linha reta —, mas sua base precisa estar sempre tocando o solo. Quando a parede surge, criaturas na área ocupada ou adjacentes sofrem 4d8 pontos de dano de corte e precisam fazer um teste de Reflexos para não ficarem presas no emaranhado de ossos. Uma criatura presa dessa maneira fica agarrada, e pode gastar uma ação padrão para fazer um teste de Atletismo para se soltar. Se passar no teste, sai da muralha para um dos lados adjacentes. Se falhar, sofre 4d8 pontos de dano de corte. É possível destruir o muro para atravessá-lo ou libertar uma criatura agarrada. Cada trecho de 3m do muro tem Defesa 8, 40 PV e redução de corte, frio e perfuração 10. Também é possível escalar a parede. Isso exige um teste de Atletismo e causa 4d8 pontos de dano de corte para cada 3m escalados.

### Mão Poderosa de Talude
- **enhancements(custos)**
  - nosso: +3
  - site: +2;+5
- **description**
  - nosso: Esta magia cria uma mão flutuante de tamanho Grande que sempre se posiciona entre você e um oponente a sua escolha. A mão fornece cobertura (+5 na Defesa) contra esse oponente. Nada é capaz de enganar a mão — coisas como escuridão, invisibilidade, metamorfose e disfarces mundanos não a impedem de protegê-lo. A mão tem Defesa 20 e PV e resistências iguais aos seus. Com uma ação de movimento, você pode comandar a mão para que o proteja de outro oponente ou para que realize uma das ações a seguir.

Agarrar: a mão usa uma manobra agarrar contra o oponente, com bônus de +20. A mão mantém o oponente agarrado, mas não causa dano. Esmagar: a mão esmaga um oponente já agarrado, causando 2d6+12 pontos de dano.

Empurrar: a mão afasta o oponente, usando uma manobra empurrar com bônus de +20. A mão sempre acompanha o oponente para empurrá-lo até a distância máxima que conseguir, dentro do alcance da magia.
  - site: Esta magia cria uma mão flutuante Grande que sempre se posiciona entre você e um oponente a sua escolha. A mão fornece cobertura leve (+5 na Defesa) contra esse oponente. Nada é capaz de enganar a mão — coisas como escuridão, invisibilidade, metamorfose e disfarces mundanos não a impedem de protegê-lo. A mão tem Defesa 20 e PV e resistências iguais aos seus. Com uma ação de movimento, você pode comandar a mão para que o proteja de outro oponente ou para que realize uma das ações a seguir. Agarrar: a mão usa uma manobra agarrar contra o oponente, usando o seu Misticismo com um bônus adicional de +10. A mão mantém o oponente agarrado, mas não causa dano. Esmagar: a mão esmaga um oponente agarrado, causando 2d6+10 pontos de dano de impacto. Empurrar: a mão afasta o oponente (manobra empurrar usando o seu Misticismo com um bônus adicional de +10). A mão acompanha o oponente para empurrá-lo o máximo que conseguir, dentro do alcance da magia.

### Palavra Primordial
- **duration**
  - nosso: instantânea
  - site: instantânea ou veja texto
- **description**
  - nosso: Você pronuncia uma palavra do idioma primordial da Criação, que causa um dos efeitos abaixo, a sua escolha.

Atordoar: a criatura fica atordoada por 2d4 rodadas. Se passar no teste de resistência, fica desprevenida por 1d4 rodadas.

Cegar: a criatura fica cega. Se passar no teste de resistência, fica ofuscada por 1d4 rodadas.

Matar: a criatura morre. Além do teste de Vontade, a criatura tem direito a um teste de Fortitude. Se passar em qualquer um deles, sofre 10d8 pontos de dano e fica sangrando.
  - site: Você pronuncia uma palavra do idioma primordial da Criação, que causa um dos efeitos abaixo, a sua escolha. Atordoar: a criatura fica atordoada por 1d4+1 rodadas (apenas uma vez por cena). Se passar no teste de resistência, ou se já foi atordoada por esta magia, fica desprevenida por 1d4 rodadas. Cegar: a criatura fica cega. Se passar no teste de resistência, fica ofuscada por 1d4 rodadas. Matar: a criatura morre. Além do teste de Vontade, a criatura tem direito a um teste de Fortitude se tiver mais da metade de seus PV. Se passar em qualquer um deles, em vez de morrer perde 10d8 pontos de vida e fica sangrando.

### Perdição
- **resistance**
  - nosso: nenhuma
  - site: 
- **enhancements[0]**
  - nosso: aumenta as penalidades em –1, limitado pelo círculo máximo de magia que você pode lançar
  - site: aumenta as penalidades em –1 (penalidade máxima limitada pelo círculo máximo de magia que você pode lançar).

### Potência Divina
- **enhancements(custos)**
  - nosso: +2;+2;+2
  - site: +2;+5;+2
- **description**
  - nosso: Você canaliza o poder de sua divindade. Você aumenta uma categoria de tamanho (seu equipamento muda de acordo). Além disso, você recebe Força +8 e resistência a dano 10. Você não pode lançar magias enquanto estiver sob efeito de Potência Divina.
  - site: Você canaliza o poder de sua divindade. Você aumenta uma categoria de tamanho (seu equipamento muda de acordo) e recebe Força +4 e RD 10. Você não pode lançar magias enquanto estiver sob efeito de Potência Divina.

### Premonição
- **enhancements(custos)**
  - nosso: +3;+5
  - site: +3;+10
- **description**
  - nosso: Vislumbres do futuro permitem que você reavalie suas ações. Uma vez por rodada, você pode usar uma reação para rolar novamente um teste recém realizado, mas deve aceitar o resultado da nova rolagem.
  - site: Vislumbres do futuro permitem que você reavalie suas ações. Uma vez por rodada, você pode rolar novamente um teste recém realizado, mas deve aceitar o resultado da nova rolagem.

### Queda Suave
- **area**
  - nosso: 1 criatura ou objeto com até 200kg
  - site: 1 criatura ou objeto Grande ou menor
- **enhancements(custos)**
  - nosso: +2
  - site: +2;+2;+1
- **description**
  - nosso: O alvo cai lentamente. A velocidade da queda é reduzida para 18m por rodada — o suficiente para não causar dano.

Como lançar esta magia é uma reação, você pode lançá-la rápido o bastante para salvar a si ou um aliado de quedas inesperadas.

Lançada sobre um projétil — como uma flecha ou uma rocha largada do alto de um penhasco —, a magia faz com que ele cause metade do dano normal, devido à lentidão.

Queda Suave só funciona em criaturas e objetos em queda livre ou similar; a magia não vai frear um golpe de espada ou o mergulho rasante de um atacante voador.

Truque: muda o alvo para objeto com até 5kg. Em vez do normal, você pode gastar uma ação de movimento para levitar o alvo até 4,5m em qualquer direção.
  - site: O alvo cai lentamente. A velocidade da queda é reduzida para 18m por rodada — o suficiente para não causar dano. Como lançar esta magia é uma reação, você pode lançá-la rápido o bastante para salvar a si ou um aliado de quedas inesperadas. Lançada sobre um projétil — como uma flecha ou uma rocha largada do alto de um penhasco —, a magia faz com que ele cause metade do dano normal, devido à lentidão. Queda Suave só funciona em criaturas e objetos em queda livre a magia não vai frear um golpe de espada ou o mergulho rasante de um atacante voador.

Truque: muda o alvo para objeto Minúsculo. Em vez do normal, você pode gastar uma ação de movimento para levitar o alvo até 4,5m em qualquer direção.

### Raio Polar
- **enhancements(custos)**
  - nosso: +3;+5
  - site: +3;+5;+1
- **description**
  - nosso: Você dispara um raio azul esbranquiçado de gelo e ar congelante. O alvo sofre 10d8 pontos de dano de frio e fica preso em um bloco de gelo (paralisado). Se passar no teste de resistência, sofre metade do dano e, em vez de paralisado, fica lento por uma rodada. É possível quebrar o gelo para libertar uma criatura presa: o bloco tem 20 PV, resistência a dano 10 e é vulnerável a fogo. Uma criatura presa pode usar uma ação completa para fazer um teste de Força e tentar se libertar do gelo; cada vez que passar no teste causa 10 pontos de dano ao bloco, ignorando a RD.
  - site: Você dispara um raio azul esbranquiçado de gelo e ar congelante. O alvo sofre 10d8 pontos de dano de frio e fica preso em um bloco de gelo (paralisado). Se passar no teste de resistência, sofre metade do dano e, em vez de paralisado, fica lento por uma rodada. É possível quebrar o gelo para libertar uma criatura presa: o bloco tem 20 PV, RD 10 e é vulnerável a fogo. Uma criatura presa pode gastar uma ação completa para fazer um teste de Atletismo e se libertar do gelo cada vez que passar no teste causa 10 pontos de dano ao bloco, ignorando a RD.

### Raio Solar
- **range**
  - nosso: médio
  - site: pessoal
- **area**
  - nosso: linha
  - site: linha de 30m
- **enhancements[1]**
  - nosso: em vez do normal, criaturas vivas a sua escolha na área curam 4d8 pontos de vida; o restante sofre o dano normalmente.
  - site: em vez do normal, criaturas vivas a sua escolha na área curam 4d8 pontos de vida o restante sofre o dano normalmente.
- **description**
  - nosso: Você canaliza uma poderosa rajada de energia positiva que ilumina o campo de batalha. Criaturas na área sofrem 4d8 pontos de dano de luz (ou 4d12, se forem mortos-vivos) e ficam ofuscadas por uma rodada. Se passarem na resistência, sofrem metade do dano e não ficam ofuscadas.

Truque: muda a duração para cena e a resistência para nenhuma. Em vez do normal, cria um facho de luz, que ilumina a área da magia. Uma vez por rodada, você pode mudar a direção do facho como uma ação livre.
  - site: Você canaliza uma poderosa rajada de energia positiva que ilumina o campo de batalha. Criaturas na área sofrem 4d8 pontos de dano de luz (ou 4d12, se forem mortos-vivos) e ficam ofuscadas por uma rodada. Se passarem na resistência, sofrem metade do dano e não ficam ofuscadas.

Truque: muda a duração para cena e a resistência para nenhuma. Em vez do normal, cria um facho de luz que ilumina a área da magia. Uma vez por rodada, você pode mudar a direção do facho como uma ação livre.

### Refúgio
- **enhancements(custos)**
  - nosso: +1;+3;+3;+3;+9
  - site: +1;+3;+3;+9

### Relâmpago
- **range**
  - nosso: médio
  - site: pessoal
- **area**
  - nosso: linha
  - site: linha de 30m
- **enhancements(custos)**
  - nosso: +2;+3
  - site: +2;+3;+1

### Relâmpago Flamejante de Reynard
- **enhancements(custos)**
  - nosso: +4
  - site: +2;+1
- **description**
  - nosso: Esta é uma magia poderosa, mas lenta, desenvolvida pelo metódico e impassível arquimago Reynard. Na primeira rodada de execução, você invoca as energias elementais do fogo, e uma de suas mãos fica em chamas. Na segunda rodada, invoca as energias elementais dos relâmpagos, ficando com a outra mão eletrificada. Então, pela duração da magia, pode usar uma ação de movimento para disparar bolas de fogo (6d6 pontos de dano de fogo numa explosão de 3m de raio) ou relâmpagos (6d6 pontos de dano de eletricidade numa linha). Você também pode, como uma ação padrão, usar as duas mãos num ataque de energia mista (12d12 pontos de dano, metade de fogo e metade de eletricidade, numa explosão de 6m de raio). Você precisa estar com as duas mãos livres para invocar o efeito misto e isso consome toda a energia da magia, terminando-a imediatamente.
  - site: Esta é uma magia poderosa, desenvolvida pelo metódico e impassível arquimago Reynard. Você invoca as energias elementais do fogo e do relâmpago, fazendo com que uma de suas mãos fique em chamas e a outra mão eletrificada. Pela duração da magia, você pode gastar uma ação de movimento para disparar uma bola de fogo (10d6 pontos de dano de fogo numa esfera com 6m de raio) ou um relâmpago (10d6 pontos de dano de eletricidade numa linha). Você também pode, como uma ação padrão, usar as duas mãos num ataque de energia mista (20d12 pontos de dano, metade de fogo e metade de eletricidade, numa esfera com 9m de raio). Você precisa estar com as duas mãos livres para invocar o efeito misto e isso consome toda a energia da magia, terminando-a imediatamente. Por se tratar de um ritual complexo, o tempo de execução dessa magia não pode ser reduzido.

### Runa de Proteção
- **castingTime**
  - nosso: completa
  - site: 1 hora
- **area**
  - nosso: 1 objeto ou passagem de até 6m de largura
  - site: uma área de 6m de raio
- **resistance**
  - nosso: nenhum ou Reflexos reduz à metade (veja o texto)
  - site: varia (veja o texto)
- **enhancements(custos)**
  - nosso: +1;+1;+1;+3
  - site: +1;+1;+3
- **description**
  - nosso: Esta magia protege um objeto que possa ser aberto ou uma passagem de até 6m de largura. Quando uma criatura abre o objeto ou passa pela passagem, a runa explode, causando 6d6 pontos de dano em todos os alvos a até 3m. A criatura que ativa a runa não tem direito a teste de resistência; outras criaturas na área têm direito a um teste de Reflexos para reduzir o dano à metade. Quando lança a magia, você escolhe o tipo de dano, entre ácido, eletricidade, fogo, frio, luz ou trevas.

Você pode determinar que a runa se ative apenas em condições específicas — por exemplo, apenas por goblins ou apenas por mortos-vivos. Você também pode criar uma palavra mágica que impeça a runa de se ativar.

Um personagem pode encontrar a runa com um teste de Investigação e desarmá-la com um teste de Ladinagem (ambos CD 28).

Componente material: pó de diamante no valor de T$ 200, com o qual o conjurador desenha a runa, que brilha por alguns instantes e depois se torna praticamente invisível.
  - site: Você escreve uma runa pessoal em uma superfície fixa, como uma parede ou o chão, que protege uma pequena área ao redor. Quando uma criatura entra na área afetada a runa explode, causando 6d6 pontos de dano em todos os alvos a até 6m. A criatura que ativa a runa não tem direito a teste de resistência outras criaturas na área têm direito a um teste de Reflexos para reduzir o dano à metade. Quando lança a magia, você escolhe o tipo de dano, entre ácido, eletricidade, fogo, frio, luz ou trevas. Você pode determinar que a runa se ative apenas em condições específicas — por exemplo, apenas por goblins ou apenas por mortos-vivos. Você também pode criar uma palavra mágica que impeça a runa de se ativar. Um personagem pode encontrar a runa com um teste de Investigação e desarmá-la com um teste de Ladinagem. Componente material: pó de diamante no valor de T$ 200, com o qual o conjurador desenha a runa, que brilha por alguns instantes e depois se torna praticamente invisível.

### Réquiem
- **area**
  - nosso: criatura escolhidas
  - site: criaturas escolhidas
- **resistance**
  - nosso: Vontade parcial
  - site: Vontade anula
- **description**
  - nosso: Esta magia cria uma ilusão particular para cada uma das criaturas que atingir. Enquanto a magia durar, no início de cada um de seus turnos, cada criatura afetada deve fazer um teste de Vontade; se falhar, acha que não tomou as ações que realmente fez no turno anterior e é obrigada a repetir as mesmas ações neste turno, com uma penalidade cumulativa de –5 em todos os testes para cada vez que se repetir (a penalidade não se aplica ao teste de Vontade contra esta magia). Por exemplo, se a criatura se aproximou de um alvo e o atacou, precisa se aproximar desse mesmo alvo e atacar novamente. A ação repetida consome PM e recursos normalmente e, caso exija um teste de resistência, qualquer alvo faz esse teste com um bônus igual ao da penalidade desta magia.
  - site: Esta magia cria uma ilusão particular para cada uma das criaturas que atingir. Enquanto a magia durar, no início de cada um de seus turnos, cada criatura afetada deve fazer um teste de Vontade se falhar, acha que não tomou as ações que realmente fez no turno anterior e é obrigada a repetir as mesmas ações neste turno, com uma penalidade cumulativa de –5 em todos os testes para cada vez que se repetir (a penalidade não se aplica ao teste de Vontade contra esta magia). Por exemplo, se a criatura se aproximou de um alvo e o atacou, precisa se aproximar desse mesmo alvo e atacar novamente. A ação repetida consome PM e recursos normalmente e, caso exija um teste de resistência, qualquer alvo faz esse teste com um bônus igual ao da penalidade desta magia.

### Servos Invisíveis
- **area**
  - nosso: até 5 criaturas conjuradas
  - site: criaturas conjuradas
- **duration**
  - nosso: 1 dia
  - site: 1 cena
- **description**
  - nosso: Você cria até três servos invisíveis e silenciosos, capazes de realizar tarefas simples como apanhar lenha, colher frutos, varrer o chão ou alimentar um cavalo. Os servos podem ser usados para manter arrumada e organizada uma mansão ou pequena torre ou para preparar um acampamento nos ermos para você e seus aliados (veja a perícia Sobrevivência, na página Perícias).

Eles também podem ajudá-lo em tarefas mais complexas, como fazer uma pesquisa ou preparar uma poção, mas isso consome sua energia mágica. Você pode “gastar” um servo para receber um bônus não cumulativo de +2 em um teste de perícia (exceto testes de ataque e resistência). Os servos não são criaturas reais; não podem lutar, nem resistir a qualquer dano ou efeito que exija um teste de resistência ou teste oposto — falharão automaticamente no teste e serão destruídos.
  - site: Você cria até três servos invisíveis e silenciosos, capazes de realizar tarefas simples como apanhar lenha, colher frutos, varrer o chão ou alimentar um cavalo. Os servos podem ser usados para manter arrumada e organizada uma mansão ou pequena torre ou para preparar um acampamento nos ermos para você e seus aliados (veja a perícia Sobrevivência, na página 123). Eles também podem ajudá-lo em tarefas mais complexas, como fazer uma pesquisa ou preparar uma poção, mas isso consome sua energia mágica. Você pode “gastar” um servo para receber um bônus não cumulativo de +2 em um teste de perícia (exceto testes de ataque e resistência). Os servos não são criaturas reais não podem lutar, nem resistir a qualquer dano ou efeito que exija um teste de resistência ou teste oposto — falharão automaticamente no teste e serão destruídos.

### Seta Infalível de Talude
- **area**
  - nosso: até 2 criaturas
  - site: criaturas escolhidas
- **description**
  - nosso: Favorita entre arcanistas iniciantes, esta magia lança duas setas de energia que causando 1d4+1 pontos de dano de essência cada. Você pode lançar as setas em alvos diferentes ou concentrá-las num mesmo alvo. Caso você possua um bônus no dano de magias, como pelo poder Arcano de Batalha, ele é aplicado em apenas uma seta (o bônus vale para a magia, não cada alvo).
  - site: Favorita entre arcanistas iniciantes, esta magia lança duas setas de energia que causam 1d4+1 pontos de dano de essência cada. Você pode lançar as setas em alvos diferentes ou concentrá-las num mesmo alvo. Caso você possua um bônus no dano de magias, como pelo poder Arcano de Batalha, ele é aplicado em apenas uma seta (o bônus vale para a magia, não cada alvo).

### Soco de Arsenal
- **resistance**
  - nosso: Fortitude reduz à metade
  - site: Fortitude parcial
- **enhancements[0]**
  - nosso: muda o alcance para pessoal, o alvo para você, a duração para cena e a resistência para nenhuma. Em vez do normal, seus ataques corpo a corpo passam a acertar inimigos distantes. Seu alcance natural aumenta em 3m; uma criatura Média pode atacar adversários a até 4,5m, por exemplo.
  - site: muda o alcance para pessoal, o alvo para você, a duração para cena e a resistência para nenhuma. Em vez do normal, seus ataques corpo a corpo passam a acertar inimigos distantes. Seu alcance natural aumenta em 3muma criatura Média pode atacar adversários a até 4,5m, por exemplo.
- **enhancements[2]**
  - nosso: aumenta a distância do efeito de empurrar em +3m.
  - site: aumenta o empurrão em +3m.
- **description**
  - nosso: Ninguém sabe se Mestre Arsenal foi realmente o criador desta magia — mas ele foi o primeiro a utilizá-la. O conjurador fecha o punho e gesticula como se estivesse golpeando o alvo, causando 4d6 + mod. Força pontos de dano de impacto. A vítima é empurrada 3m na direção oposta à sua (ou 1,5m se passar na resistência).
  - site: Ninguém sabe se Mestre Arsenal foi realmente o criador desta magia — mas ele foi o primeiro a utilizá-la. Você fecha o punho e gesticula como se estivesse golpeando o alvo, causando dano de impacto igual a 4d6 + sua Força. A vítima é empurrada 3m na direção oposta à sua. Passar no teste de resistência reduz o dano à metade e evita o empurrão.

### Sono
- **area**
  - nosso: 1 criatura de ND 2 ou menor
  - site: 1 humanoide
- **enhancements(custos)**
  - nosso: +2;+2;+5;+5;+9;+14
  - site: +2;+2;+5
- **description**
  - nosso: Um sono místico recai sobre o alvo. Se passar na resistência, fica fatigado por uma rodada. Se falhar, fica inconsciente e caído.
  - site: Um cansaço místico recai sobre o alvo. Se falhar na resistência, ele fica inconsciente e caído ou, se estiver envolvido em combate ou outra situação perigosa, fica exausto por 1 rodada, depois fatigado. Em ambos os casos, se passar, o alvo fica fatigado por 1d4 rodadas.

### Sopro das Uivantes
- **range**
  - nosso: 6m
  - site: pessoal
- **area**
  - nosso: cone
  - site: cone de 9m
- **resistance**
  - nosso: Fortitude parcial (veja texto)
  - site: Fortitude parcial
- **enhancements(custos)**
  - nosso: +2;+2;+3
  - site: +2;+3;+1
- **description**
  - nosso: Você sopra ar gélido que causa 4d6 pontos de dano de frio (Fortitude reduz à metade). Criaturas de tamanho Médio ou menor que falhem na resistência são empurradas 6m na direção oposta. Se houver uma parede ou outro objeto sólido (mas não uma criatura) no caminho, a criatura para de se mover, mas sofre 1d6 pontos de dano de impacto.
  - site: Você sopra ar gélido que causa 4d6 pontos de dano de frio (Fortitude reduz à metade). Criaturas de tamanho Médio ou menor que falhem na resistência ficam caídas e são empurradas 6m na direção oposta. Se houver uma parede ou outro objeto sólido (mas não uma criatura) no caminho, a criatura para de se mover, mas sofre +2d6 pontos de dano de impacto.

### Talho Invisível de Edauros
- **range**
  - nosso: curto
  - site: pessoal
- **area**
  - nosso: cone
  - site: cone de 9m
- **enhancements[1]**
  - nosso: muda o alvo para você e a duração para sustentada. Uma vez por rodada, como uma ação padrão, você pode disparar uma lâmina de ar contra um alvo em alcance médio, causando 6d8 pontos de dano de corte (Fortitude reduz à metade).
  - site: muda o alvo para você, a duração para sustentada e o efeito para uma vez por rodada, como uma ação de movimento, você pode disparar uma lâmina de ar contra um alvo em alcance médio, causando 6d8 pontos de dano de corte (Fortitude reduz à metade).
- **description**
  - nosso: Esta magia cruel foi desenvolvida pelo mago de combate Edauros, quando ainda era um bípede. Você faz um gesto rápido e dispara uma lâmina de ar em alta velocidade. Criaturas na área sofrem 8d8 pontos de dano de corte e ficam sangrando. Alvos que passem no teste de resistência sofrem metade do dano e não ficam sangrando.
  - site: Esta magia cruel foi desenvolvida pelo mago de combate Edauros, quando ainda era um bípede. Você faz um gesto rápido e dispara uma lâmina de ar em alta velocidade. Criaturas na área sofrem 10d8 pontos de dano de corte e ficam sangrando. Alvos que passem no teste de resistência sofrem metade do dano e não ficam sangrando.

### Tempestade Divina
- **area**
  - nosso: cilindro com 9m de raio e 9m de altura
  - site: cilindro com 15m de raio e 15m de altura
- **duration**
  - nosso: cena
  - site: sustentada
- **enhancements(custos)**
  - nosso: +1;+1;+2;+3;+7
  - site: +1;+2;+3;+3;+3;+3;+1
- **description**
  - nosso: Esta magia só pode ser usada em ambientes abertos. A área fica sujeita a um vendaval — ataques à distância sofrem penalidade de –5, chamas são apagadas e névoas e fumaças são dissipadas em 1 rodada. Você também pode causar chuva (–5 em testes de Percepção), neve (como chuva, mais a área se torna terreno difícil) ou granizo (como chuva, mais 1 ponto de dano de impacto por rodada, no início de seus turnos). Criaturas na área recebem uma penalidade de –15m no deslocamento de voo (mínimo 1,5m).
  - site: Esta magia só pode ser usada em ambientes abertos. A área fica sujeita a um vendaval — ataques à distância sofrem penalidade de –5, chamas são apagadas e névoas são dissipadas. Você também pode gerar chuva (–5 em testes de Percepção), neve (como chuva, e a área se torna terreno difícil) ou granizo (como chuva, mais 1 ponto de dano de impacto por rodada, no início de seus turnos).

### Tentáculos de Trevas
- **area**
  - nosso: círculo com 6m de raio
  - site: esfera com 6m de raio
- **description**
  - nosso: Um círculo de energias sombrias se abre no chão, de onde surgem tentáculos feitos de treva viscosa. Ao lançar a magia e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando seu bônus de Misticismo) contra cada criatura na área. Se você passar, a criatura é agarrada; se a vítima já está agarrada, é esmagada, sofrendo 4d6 pontos de dano de trevas. A área conta como terreno difícil. Os tentáculos são imunes a dano.
  - site: Um círculo de energias sombrias se abre no chão, de onde surgem tentáculos feitos de treva viscosa. Ao lançar a magia e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando seu valor de Misticismo) contra cada criatura na área. Se você passar, a criatura é agarrada se a vítima já está agarrada, é esmagada, sofrendo 4d6 pontos de dano de trevas. A área conta como terreno difícil. Os tentáculos são imunes a dano.

### Terremoto
- **area**
  - nosso: dispersão com 30m de raio
  - site: esfera com 30m de raio
- **description**
  - nosso: Esta magia cria um tremor de terra que rasga o solo. O terremoto dura uma rodada, durante a qual criaturas sobre o solo não podem se mover, atacar ou lançar magias. O efeito exato depende do terreno.

Caverna ou subterrâneo: a magia derruba o teto, causando 12d6 pontos de dano de impacto e agarrando todas as criaturas na área. Um teste de Reflexos reduz o dano à metade e evita ficar agarrado.

Construção: todas as estruturas na área sofrem 200 pontos de dano de impacto, o suficiente para derrubar construções de madeira ou alvenaria simples, mas não de alvenaria reforçada. Criaturas em uma construção que desmorone sofrem o mesmo efeito de criaturas em uma caverna (veja acima).

Espaço aberto: fendas se abrem no chão; cada criatura tem 25% de chance (1 em 1d4) de cair em uma delas. A vítima tem direito a um teste de Reflexos para se agarrar na borda e escapar. No início do seu próximo turno as fendas se fecham, matando todos que estejam dentro delas.

Penhascos: o penhasco racha, criando um desmoronamento que percorre uma distância horizontal igual à distância vertical da queda. Por exemplo, um penhasco com 30m de altura desmorona em uma área de 30m de comprimento além da base. Qualquer criatura no caminho sofre 8d6 pontos de dano de impacto e fica agarrada. Um teste de Reflexos reduz o dano à metade e evita ficar agarrado.

Rio, lago ou pântano: fissuras se abrem sob a água, drenando-a e formando um lamaçal. Criaturas na área precisam fazer um teste de Reflexos para não afundarem na lama e ficarem agarradas. No início do seu próximo turno as fissuras se fecham, possivelmente afogando as criaturas que ficaram agarradas. Escapar exige uma ação completa e um teste de Atletismo.

Criaturas agarradas (efeito possível de caverna, construção, penhasco e rio, lago ou pântano) sofrem 1d6 pontos de dano por rodada até serem libertadas, o que exige uma ação completa e um teste de Atletismo (por parte da própria criatura ou de um aliado adjacente).
  - site: Esta magia cria um tremor de terra que rasga o solo. O terremoto dura uma rodada, durante a qual criaturas sobre o solo ficam atordoadas (apenas uma vez por cena). Barreiras físicas não interrompem a área de Terremoto. O efeito exato depende do terreno. Caverna ou subterrâneo: a magia derruba o teto, causando 12d6 pontos de dano de impacto e agarrando todas as criaturas na área. Um teste de Reflexos reduz o dano à metade e evita a condição. Construção: todas as estruturas na área sofrem 200 pontos de dano de impacto, o suficiente para derrubar construções de madeira ou alvenaria simples, mas não de alvenaria reforçada. Criaturas em uma construção que desmorone sofrem o mesmo efeito de criaturas em uma caverna (veja acima). Espaço aberto: fendas se abrem no chão. Cada criatura na área precisa rolar um dado em um resultado ímpar, uma fenda se abre sob ela e ela precisa fazer um teste de Reflexos se falhar, cai na fenda. A criatura pode escapar gastando uma ação completa e passando em um teste de Atletismo. No início do seu próximo turno as fendas se fecham, matando todos que estejam dentro delas. Penhasco: o penhasco racha, criando um desmoronamento que percorre uma distância horizontal igual à distância da queda. Por exemplo, um penhasco com 30m de altura desmorona em uma área de 30m de comprimento além da base. Qualquer criatura no caminho sofre 12d6 pontos de dano de impacto e fica agarrada. Um teste de Reflexos reduz o dano à metade e evita ficar agarrado. Rio, lago ou pântano: fissuras se abrem sob a água, drenando-a e formando um lamaçal. Criaturas na área precisam fazer um teste de Reflexos para não afundarem na lama e ficarem agarradas. No início do seu próximo turno as fissuras se fecham, possivelmente afogando as criaturas que ficaram agarradas. Criaturas agarradas (efeito possível de caverna, construção, penhasco e rio, lago ou pântano) sofrem 1d6 pontos de dano por rodada até serem libertadas, o que exige uma ação completa e um teste de Atletismo (por parte da própria criatura ou de um aliado adjacente).

### Toque Chocante
- **enhancements(custos)**
  - nosso: +1;+2;+2
  - site: +1;+2;+2;+1

### Toque Vampírico
- **enhancements(custos)**
  - nosso: +1;+2;+2
  - site: +2;+2;+2

### Toque da Morte
- **resistance**
  - nosso: Fortitude parcial
  - site: veja texto
- **description**
  - nosso: Sua mão exala energias letais. Se a criatura tocada falhar no teste de Fortitude, seus PV são reduzidos a –10; se passar, sofre 10d8 pontos de dano de trevas.
  - site: Sua mão exala energias letais. A criatura sofre 10d8+10 pontos de dano de trevas. Se estiver com menos da metade de seus PV, em vez disso deve fazer um teste de Fortitude. Se passar, sofre o dano normal. Se falhar, seus PV são reduzidos a –10.

### Tranquilidade
- **castingTime**
  - nosso: ação padrão
  - site: padrão
- **enhancements(custos)**
  - nosso: +1;+1;+2;+5
  - site: +1;+1;+5
- **description**
  - nosso: Você emana ondas de serenidade. Se falhar na resistência, o alvo tem sua atitude mudada para indiferente (veja Diplomacia na página Perícias ) e não pode atacar ou realizar qualquer tipo de ação agressiva. Se passar, recebe –2 em testes de ataque. Qualquer ação hostil contra o alvo anula a magia, e ele retorna à atitude que tinha antes (ou piorada, de acordo com o mestre).
  - site: Você emana ondas de serenidade. Se falhar na resistência, o alvo tem sua atitude mudada para indiferente (veja a página 259) e não pode atacar ou realizar qualquer ação agressiva. Se passar, sofre –2 em testes de ataque. Qualquer ação hostil contra o alvo ou seus aliados dissipa a magia e faz ele retornar à atitude que tinha antes (ou pior, de acordo com o mestre).

### Transmutar Objetos
- **enhancements(custos)**
  - nosso: +2;+1;+1;+5;+9
  - site: +1;+2;+3;+5;+9
- **description**
  - nosso: A magia transforma matéria bruta para moldar um novo objeto. Você pode usar matéria-prima mundana para criar um objeto de tamanho Pequeno ou menor e preço máximo de T$ 25, como um balde ou uma espada. O objeto reverte à matéria-prima no final da cena, ou se for tocado por um objeto feito de chumbo. Esta magia não pode ser usada para criar objetos consumíveis, como alimentos, itens alquímicos ou venenos, nem objetos com mecanismos complexos, como bestas ou armas de fogo. Transmutar Objetos anula Despedaçar.

Truque: muda o alvo para 1 objeto mundano e a duração para instantânea. Em vez do normal, você pode alterar as propriedades físicas do objeto, como colorir, limpar ou sujar itens pequenos (incluindo peças de roupa), aquecer, esfriar e/ou temperar (mas não produzir) até 0,5kg de material inanimado (incluindo comida), ou curar 1 PV do objeto, consertando pequenas falhas como colar um frasco de cerâmica quebrado, unir os elos de uma corrente ou costurar uma roupa rasgada. Um objeto só pode ser afetado por este truque uma vez por dia.
  - site: A magia transforma matéria bruta para moldar um novo objeto. Você pode usar matéria-prima mundana para criar um objeto de tamanho Pequeno ou menor e preço máximo de T$ 25, como um balde ou uma espada. O objeto reverte à matéria-prima no final da cena, ou se for tocado por um objeto feito de chumbo. Esta magia não pode ser usada para criar objetos consumíveis, como alimentos ou itens alquímicos, nem objetos com mecanismos complexos, como bestas ou armas de fogo. Transmutar Objetos anula Despedaçar.

Truque: muda o alvo para 1 objeto mundano Mínusculo (ou material em quantidade equivalente) e a duração para instantânea. Em vez do normal, você pode alterar as propriedades físicas do alvo, como colorir, limpar ou sujar itens pequenos (incluindo peças de roupa), aquecer, esfriar e/ou temperar (mas não produzir) ou curar 1 PV do objeto, consertando pequenas falhas como colar um frasco de cerâmica quebrado, unir os elos de uma corrente ou costurar uma roupa rasgada. Um objeto só pode ser afetado por este truque uma vez por dia.

### Velocidade
- **duration**
  - nosso: cena
  - site: sustentada
- **enhancements(custos)**
  - nosso: +7;+7
  - site: +0;+7;+7;+1

### Vestimenta da Fé
- **area**
  - nosso: 1 traje, armadura ou escudo
  - site: 1 armadura, escudo ou vestuário
- **enhancements[0]**
  - nosso: o objeto também oferece o mesmo bônus em testes de resistência. Requer 3º círculo.
  - site: o objeto oferece o mesmo bônus em testes de resistência. Requer 3º círculo.
- **enhancements[2]**
  - nosso: o objeto também oferece resistência a dano 5. Requer 4º círculo.
  - site: o objeto também oferece redução de dano 5. Requer 4º círculo.
- **description**
  - nosso: Você fortalece uma indumentária com o poder de sua fé. Isso aumenta o bônus de Defesa de uma armadura ou escudo em +2 (isso é uma melhoria no item, portanto é cumulativa com outras magias). No caso de um traje, ele passa a oferecer +2 na Defesa e continua contando como se você não estivesse usando armadura.
  - site: Você fortalece um item, aumentando o bônus de Defesa de uma armadura ou escudo em +2. No caso de um vestuário, ele passa a oferecer +2 na Defesa (não cumulativo com armadura). Os efeitos desta magia contam como um bônus de encanto.


## Só redação

### Abençoar Alimentos
- **description**
  - nosso: Você purifica e abençoa uma porção de comida ou dose de bebida. Isso torna um alimento sujo, estragado ou envenenado próprio para consumo. Além disso, se for consumido até o final da duração, o alimento oferece 5 PV temporários ou 1 PM temporário (além de quaisquer bônus que já oferecesse). Bônus de alimentação duram um dia e cada personagem só pode receber um bônus de alimentação por dia

Truque: o alimento é purificado (não causa nenhum efeito nocivo se estava estragado ou envenenado), mas não oferece bônus ao ser consumido.
  - site: Você purifica e abençoa uma porção de comida ou dose de bebida. Isso torna um alimento sujo, estragado ou envenenado próprio para consumo. Além disso, se for consumido até o final da duração, o alimento oferece 5 PV temporários ou 1 PM temporário (além de quaisquer bônus que já oferecesse). Bônus de alimentação duram um dia e cada personagem só pode receber um bônus de alimentação por dia.

Truque: o alimento é purificado (não causa nenhum efeito nocivo se estava estragado ou envenenado), mas não fornece bônus ao ser consumido.

### Aliado Animal
- **enhancements[0]**
  - nosso: muda o alvo para 1 animal Minúsculo e a duração para 1 semana. Em vez do normal, o animal se desloca ao melhor de suas capacidades até um local designado por você — em geral, para levar um item, carta ou similar. Quando o animal chega ao destino, fica esperando até o fim da magia, permitindo apenas que uma ou mais criaturas escolhidas por você se aproximem e peguem o que ele estiver carregando.
  - site: muda o alvo para 1 animal Minúsculo e a duração para 1 semana. Em vez do normal, o animal se desloca no melhor de suas capacidades até um local designado por você — em geral, para levar um item, carta ou similar. Quando o animal chega ao destino, fica esperando até o fim da magia, permitindo apenas que uma ou mais criaturas escolhidas por você se aproximem e peguem o que ele estiver carregando.
- **enhancements[1]**
  - nosso: muda o aliado para mestre. Requer 3º círculo.
  - site: muda o parceiro para mestre. Requer 3º círculo.
- **enhancements[2]**
  - nosso: muda o alvo para 2 animais prestativos. Cada animal funciona como um aliado de um tipo diferente, e você pode receber a ajuda de ambos (mas ainda precisa seguir o limite de aliados de acordo com o seu nível de personagem). Requer 4º círculo.
  - site: muda o alvo para 2 animais prestativos. Cada animal funciona como um parceiro de um tipo diferente, e você pode receber a ajuda de ambos (mas ainda precisa seguir o limite de parceiros de acordo com o seu nível de personagem). Requer 4º círculo.
- **description**
  - nosso: Você cria um vínculo mental com um animal prestativo em relação a você. O Aliado Animal obedece a você ao melhor de suas capacidades, mesmo que isso arrisque a vida dele. Ele funciona como um aliado veterano, de um tipo a sua escolha entre ajudante, combatente, fortão, guardião, montaria ou perseguidor.
  - site: Você cria um vínculo mental com um animal prestativo em relação a você. O Aliado Animal obedece a você no melhor de suas capacidades, mesmo que isso arrisque a vida dele. Ele funciona como um parceiro veterano, de um tipo a sua escolha entre ajudante, combatente, fortão, guardião, montaria ou perseguidor.

### Alterar Destino
- **description**
  - nosso: Sua mente visualiza todas as possibilidades de um evento, permitindo a você escolher o melhor curso de ação. Você automaticamente passa em um teste de resistência ou evita um ataque nesta rodada.
  - site: Sua mente visualiza todas as possibilidades de um evento, permitindo a você escolher o melhor curso de ação. Você pode rolar novamente um teste de resistência com um bônus de +10 ou um inimigo deve rolar novamente um ataque contra você com uma penalidade de –10.

### Alterar Memória
- **enhancements[0]**
  - nosso: muda o alcance para cone de 4,5m e o alvo para criaturas na área.
  - site: muda o alcance para pessoal e o alvo para área cone de 4,5m.

### Alterar Tamanho
- **enhancements[1]**
  - nosso: muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo e seu equipamento aumentam de tamanho em uma categoria. O alvo também recebe Força +4. Um alvo involuntário pode fazer um teste de Fortitude para negar o efeito.
  - site: muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo aumenta uma categoria de tamanho (seu equipamento se ajusta ao novo tamanho). O alvo também recebe Força +2. Um alvo involuntário pode fazer um teste de Fortitude para negar o efeito.
- **enhancements[2]**
  - nosso: muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo e seu equipamento diminuem de tamanho em uma categoria. O alvo também recebe Destreza +4. Um alvo involuntário pode fazer um teste de Fortitude para negar o efeito. Requer 3º círculo.
  - site: muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo diminui uma categoria de tamanho (seu equipamento se ajusta ao novo tamanho). O alvo também recebe Destreza +2. Um alvo involuntário pode fazer um teste de Fortitude para negar o efeito. Requer 3º círculo.
- **enhancements[3]**
  - nosso: muda o alcance para toque, o alvo para 1 criatura, a duração para permanente e a resistência para Fortitude anula. Em vez do normal, se falhar na resistência o alvo e seu equipamento têm seu tamanho mudado para Minúsculo. O alvo também tem seu valor de Força reduzido a 1 e suas formas de deslocamento reduzidas a 3m. Requer 4º círculo.
  - site: muda o alcance para toque, o alvo para 1 criatura, a duração para permanente e a resistência para Fortitude anula. Em vez do normal, se falhar na resistência o alvo e seu equipamento têm seu tamanho mudado para Minúsculo. O alvo tem seu valor de Força reduzido a –5 e seus deslocamentos reduzidos a 3m. Requer 4º círculo.
- **description**
  - nosso: Esta magia aumenta ou diminui o tamanho de um item mundano em até três categorias (um objeto Enorme vira Pequeno, por exemplo). Você também pode mudar a consistência do item, deixando-o rígido como pedra ou flexível como seda (isso não altera sua RD ou PV, apenas suas propriedades físicas).
  - site: Esta magia aumenta ou diminui o tamanho de um item mundano em até três categorias (um objeto Enorme vira Pequeno, por exemplo). Você também pode mudar a consistência do item, deixando-o rígido como pedra ou flexível como seda (isso não altera sua RD ou PV, apenas suas propriedades físicas). Se lançar a magia num objeto de uma criatura involuntária, ela pode fazer um teste de Vontade para anulá-la.

### Animar Objetos
- **description**
  - nosso: Você concede vida a objetos inanimados. Cada objeto se torna um aliado sob seu controle. O tipo dele é escolhido da lista de tamanho e ele não conta em seu limite de aliados. Com uma ação de movimento, você pode comandar mentalmente qualquer objeto animado dentro do alcance para que auxilie você ou outra criatura neste turno. Outros usos criativos para os objetos ficam a cargo do mestre. Objetos animados têm valores de Força, Destreza de acordo com seu tamanho e todos os outros atributos nulos; eles têm PV de acordo com seu tamanho, não têm valor de Defesa ou testes de resistência e falham automaticamente em qualquer teste oposto, e são imunes a doenças, fadiga, sangramento, sono e veneno. Diferente de aliados comuns, um objeto pode ser alvo de um ataque direto. Esta magia não afeta itens mágicos, nem objetos que estejam sendo carregados por outra criatura.

Estatísticas de objetos animados

Minúsculo: For 4, Des 18, 5 PV; Assassino ou Combatente Iniciante.

Pequeno: For 6, Des 14, 10 PV; Combatente ou Guardião Iniciante.

Médio: For 10, Des 12, 20 PV; Combatente ou Guardião Veterano.

Grande: For 14, Des 10, 40 PV; Fortão, Guardião ou Montaria Veterano.

Enorme: For 18, Des 6, 60 PV; Fortão, Guardião ou Montaria Mestre.
  - site: Você concede vida a objetos inanimados. Cada objeto se torna um parceiro sob seu controle. O tipo dele é escolhido da lista de tamanho e ele não conta em seu limite de parceiros. Com uma ação de movimento, você pode comandar mentalmente qualquer objeto animado dentro do alcance para que auxilie você ou outra criatura. Outros usos criativos para os objetos ficam a cargo do mestre. Objetos animados são construtos com valores de Força, Destreza e PV de acordo com seu tamanho. Todos os outros atributos são nulos, eles não têm valor de Defesa ou testes de resistência e falham automaticamente em qualquer teste oposto. Diferente de parceiros comuns, um objeto pode ser alvo de ações hostis. Esta magia não afeta itens mágicos, nem objetos que estejam sendo carregados por outra criatura.

Estatísticas de objetos animados

Minúsculo: For –3, Des 4, 5 PV Assassino ou Combatente Iniciante.

Pequeno: For –2, Des 2, 10 PV Combatente ou Guardião Iniciante.

Médio: For 0, Des 1, 20 PV Combatente ou Guardião Veterano.

Grande: For 2, Des 0, 40 PV Fortão, Guardião ou Montaria (cavalo) Veterano.

Enorme: For 4, Des –2, 60 PV Fortão, Guardião ou Montaria (cavalo) Mestre.

Você concede vida a objetos inanimados. Cada objeto se torna um parceiro sob seu controle. O tipo dele é escolhido da lista de tamanho e ele não conta em seu limite de parceiros. Com uma ação de movimento, você pode comandar mentalmente qualquer objeto animado dentro do alcance para que auxilie você ou outra criatura. Outros usos criativos para os objetos ficam a cargo do mestre. Objetos animados são construtos com valores de Força, Destreza e PV de acordo com seu tamanho. Todos os outros atributos são nulos, eles não têm valor de Defesa ou testes de resistência e falham automaticamente em qualquer teste oposto. Diferente de parceiros comuns, um objeto pode ser alvo de ações hostis.

Esta magia não afeta itens mágicos, nem objetos que estejam sendo carregados por outra criatura.

Estatísticas de objetos animados

Minúsculo: For –3, Des 4, 5 PV Assassino ou Combatente Iniciante.

Pequeno: For –2, Des 2, 10 PV Combatente ou Guardião Iniciante.

Médio: For 0, Des 1, 20 PV Combatente ou Guardião Veterano.

Grande: For 2, Des 0, 40 PV Fortão, Guardião ou Montaria (cavalo) Veterano.

Enorme: For 4, Des –2, 60 PV Fortão, Guardião ou Montaria (cavalo) Mestre.

### Aparência Perfeita
- **description**
  - nosso: Esta magia lhe concede um rosto idealizado, porte físico garboso, voz melodiosa e olhar sedutor, deixando-o mais atraente e confiável. Enquanto a magia estiver ativa, seu Carisma torna-se 20 (ou recebe um bônus de +4, caso seja 20 ou maior) e você recebe +5 nos testes de Diplomacia e Enganação. Quando a magia acaba, quaisquer observadores percebem a mudança e tendem a suspeitar de você. Da mesma maneira, pessoas que o viram sob o efeito da magia sentirão que “algo está errado” ao vê-lo em condições normais. Quando a cena acabar, você pode gastar os PM da magia novamente como uma ação livre para mantê-la ativa. Este efeito não fornece PV ou PM adicionais.
  - site: Esta magia lhe concede um rosto idealizado, porte físico garboso, voz melodiosa e olhar sedutor. Caso seu Carisma seja 5 ou mais, você recebe +2 neste atributo. Do contrário, ele se torna 5 (isso conta como um bônus). Além disso, você recebe +5 em Diplomacia e Enganação. Quando a magia acaba, quaisquer observadores percebem a mudança e tendem a suspeitar de você. Da mesma maneira, pessoas que o viram sob o efeito da magia sentirão que “algo está errado” ao vê-lo em condições normais. Quando a cena acabar, você pode gastar os PM da magia novamente como uma ação livre para mantê-la ativa. Este efeito não fornece PV ou PM adicionais.

### Aprisionamento
- **description**
  - nosso: Você cria uma prisão mágica para aprisionar uma criatura. Se falhar no teste de resistência, o alvo sofre o efeito da magia; se passar, fica imune a esta magia por uma semana. Enquanto estiver aprisionada, a criatura não precisa respirar e alimentar-se, e não envelhece. Magias de adivinhação não conseguem localizar ou perceber o alvo. Ao lançar a magia, você escolhe uma das seguintes formas de prisão. O componente material varia, mas todos custam T$ 1.000.

Acorrentamento: o alvo é preso por correntes firmemente enraizadas no chão, que o mantém no lugar. O alvo fica paralisado e não pode se mover ou ser movido por qualquer meio. Componente Material: uma fina corrente de mitral.

Contenção Mínima: o alvo diminui para uma altura de 2 centímetros e é preso dentro de uma pedra preciosa ou objeto semelhante. A luz pode passar através da pedra preciosa normalmente (permitindo que o alvo veja o lado de fora e outras criaturas o vejam), mas nada mais pode passar, nem por meio de teletransporte ou viagem planar. A pedra não pode ser quebrada enquanto o alvo estiver dentro. Componente Material: uma pedra preciosa, como um diamante ou rubi.

Prisão Dimensional: o alvo é transportado para um pequeno semiplano protegido contra teletransporte e viagens planares. O semiplano pode ser um labirinto, uma gaiola, uma torre ou qualquer estrutura ou área confinada similar de sua escolha. Componente Material: uma representação em miniatura da prisão, feita de jade.

Sepultamento: o alvo é sepultado bem fundo abaixo da terra, dentro de uma esfera de força mágica. Nada pode destruir ou atravessar a esfera, nem mesmo teletransporte ou viagens planares. Componente Material: um pequeno orbe de adamante.

Sono Eterno: o alvo adormece e não pode ser acordado. Componente Material: fruta preparada com ervas soníferas raras.

Quando a magia é lançada, você deve especificar uma condição que fará com que ela termine e solte o alvo. A condição pode ser tão específica ou elaborada quanto você quiser, mas deve ser possível de acontecer. As condições podem se basear no nome, identidade ou divindade padroeira de uma criatura, ou em ações ou qualidades observáveis, mas nunca em estatísticas intangíveis, como nível, classe ou pontos de vida. O mestre tem a palavra final sobre se uma condição é válida ou não.

Dissipar Magia pode dissipar o efeito, mas deve ser conjurada com o aprimoramento de 5º círculo e alvo na prisão.
  - site: Você cria uma prisão mágica para aprisionar uma criatura. Se falhar no teste de resistência, o alvo sofre o efeito da se passar, fica imune a esta magia por uma semana. Enquanto estiver aprisionada, a criatura não precisa respirar e alimentar-se, e não envelhece.s de adivinhação não conseguem localizar ou perceber o alvo. Ao lançar a, você escolhe uma das seguintes formas de prisão. O componente material varia, mas todos custam T$ 1.000. Acorrentamento: o alvo é preso por correntes firmemente enraizadas no chão, que o mantém no lugar. O alvo fica paralisado e não pode se mover ou ser movido por qualquer meio. Componente Material: uma fina corrente de mitral. Contenção Mínima: o alvo diminui para 2 cm de altura e é preso dentro de uma pedra preciosa ou objeto semelhante. Luz passa através da pedra, permitindo que o alvo veja o lado de fora e seja visto, mas nada mais pode passar, nem por meio de teletransporte ou viagem planar. A pedra não pode ser quebrada enquanto o alvo estiver dentro. Componente Material: uma pedra preciosa, como um diamante ou rubi. Prisão Dimensional: o alvo é transportado para um semiplano protegido contra teletransporte e viagens planares. Pode ser um labirinto, uma gaiola, uma torre ou qualquer estrutura ou área confinada e pequena a sua escolha. Componente Material: uma representação em miniatura da prisão, feita de jade. Sepultamento: o alvo é sepultado nas profundezas da terra, em uma esfera mágica. Nada pode destruir ou atravessar a esfera, nem mesmo teletransporte ou viagens planares. Componente Material: um pequeno orbe de adamante. Sono Eterno: o alvo adormece e não pode ser acordado. Componente Material: fruta preparada com ervas soníferas raras. Quando a magia é lançada, você deve especificar uma condição que fará com que ela termine e solte o alvo. A condição pode ser tão específica ou elaborada quanto você quiser, mas deve ser possível de acontecer. As condições podem se basear no nome, identidade ou divindade padroeira de uma criatura, ou em ações ou qualidades observáveis, mas nunca em estatísticas intangíveis, como nível, classe ou pontos de vida. O mestre tem a palavra final sobre se uma condição é válida ou não.

Você cria uma prisão mágica para aprisionar uma criatura. Se falhar no teste de resistência, o alvo sofre o efeito da se passar, fica imune a esta magia por uma semana. Enquanto estiver aprisionada, a criatura não precisa respirar e alimentar-se, e não envelhece.s de adivinhação não conseguem localizar ou perceber o alvo. Ao lançar a, você escolhe uma das seguintes formas de prisão. O componente material varia, mas todos custam T$ 1.000.

Acorrentamento: o alvo é preso por correntes firmemente enraizadas no chão, que o mantém no lugar. O alvo fica paralisado e não pode se mover ou ser movido por qualquer meio. Componente Material: uma fina corrente de mitral.

Contenção Mínima: o alvo diminui para 2 cm de altura e é preso dentro de uma pedra preciosa ou objeto semelhante. Luz passa através da pedra, permitindo que o alvo veja o lado de fora e seja visto, mas nada mais pode passar, nem por meio de teletransporte ou viagem planar. A pedra não pode ser quebrada enquanto o alvo estiver dentro. Componente Material: uma pedra preciosa, como um diamante ou rubi.

Prisão Dimensional: o alvo é transportado para um semiplano protegido contra teletransporte e viagens planares. Pode ser um labirinto, uma gaiola, uma torre ou qualquer estrutura ou área confinada e pequena a sua escolha. Componente Material: uma representação em miniatura da prisão, feita de jade.

Sepultamento: o alvo é sepultado nas profundezas da terra, em uma esfera mágica. Nada pode destruir ou atravessar a esfera, nem mesmo teletransporte ou viagens planares. Componente Material: um pequeno orbe de adamante.

Sono Eterno: o alvo adormece e não pode ser acordado. Componente Material: fruta preparada com ervas soníferas raras.

Quando a magia é lançada, você deve especificar uma condição que fará com que ela termine e solte o alvo. A condição pode ser tão específica ou elaborada quanto você quiser, mas deve ser possível de acontecer. As condições podem se basear no nome, identidade ou divindade padroeira de uma criatura, ou em ações ou qualidades observáveis, mas nunca em estatísticas intangíveis, como nível, classe ou pontos de vida. O mestre tem a palavra final sobre se uma condição é válida ou não.

### Armadura Arcana
- **enhancements[0]**
  - nosso: muda a execução para reação. Em vez do normal, você cria um escudo mágico que fornece +5 na Defesa contra o próximo ataque que sofrer (cumulativo com o bônus fornecido pelo efeito básico desta magia e armaduras).
  - site: muda a execução para reação. Em vez do normal, quando sofre um ataque, você cria um escudo mágico que fornece +5 na Defesa contra esse ataque (cumulativo com o bônus do efeito básico desta magia e de armaduras).
- **enhancements[2]**
  - nosso: muda a duração para 1 dia.
  - site: muda a duração para um dia.

### Augúrio
- **enhancements[0]**
  - nosso: muda a execução para 1 minuto. Em vez do normal, você pode consultar uma divindade, fazendo uma pergunta sobre um evento que acontecerá até um dia no futuro. O mestre rola a chance de falha; com um resultado de 2 a 6, você recebe uma resposta, desde uma simples frase até uma profecia ou enigma. Em geral, este uso sempre oferece pistas, indicando um caminho a tomar para descobrir a resposta que se procura. Numa falha você não recebe resposta alguma. Requer 3º círculo.
  - site: muda a execução para 1 minuto. Em vez do normal, você pode consultar uma divindade, fazendo uma pergunta sobre um evento que acontecerá até um dia no futuro. O mestre rola a chance de falha com um resultado de 2 a 6, você recebe uma resposta, desde uma simples frase até uma profecia ou enigma. Em geral, este uso sempre oferece pistas, indicando um caminho a tomar para descobrir a resposta que se procura. Numa falha você não recebe resposta alguma. Requer 3º círculo.
- **enhancements[2]**
  - nosso: o mestre rola 1d12; a magia só falha em um resultado 1.
  - site: o mestre rola 1d12 a magia só falha em um resultado 1.
- **enhancements[3]**
  - nosso: o mestre rola 1d20; a magia só falha em um resultado 1.
  - site: o mestre rola 1d20 a magia só falha em um resultado 1.
- **description**
  - nosso: Esta magia diz se uma ação que você tomará em breve — no máximo uma hora no futuro — trará resultados bons ou ruins. O mestre rola 1d6 em segredo; com um resultado de 2 a 6, a magia funciona e você recebe uma das seguintes respostas: “felicidade” (a ação trará bons resultados); “miséria” (a ação trará maus resultados); “felicidade e miséria” (para ambos) ou “nada” (para ações que não trarão resultados bons ou ruins).

Com um resultado 1, a magia falha e oferece o resultado “nada”. Não há como saber se esse resultado foi dado porque a magia falhou ou não. Lançar esta magia múltiplas vezes sobre o mesmo assunto gera sempre o primeiro resultado.

Por exemplo, se o grupo está prestes a entrar em uma câmara, o augúrio dirá “felicidade” se a câmara contém um tesouro desprotegido, “miséria” se contém um monstro, “felicidade e miséria” se houver um tesouro e um monstro ou “nada” se a câmara estiver vazia.
  - site: Esta magia diz se uma ação que você tomará em breve — no máximo uma hora no futuro — trará resultados bons ou ruins. O mestre rola 1d6 em segredo com um resultado de 2 a 6, a magia funciona e você recebe uma das seguintes respostas: “felicidade” (a ação trará bons resultados) “miséria” (a ação trará maus resultados) “felicidade e miséria” (para ambos) ou “nada” (para ações que não trarão resultados bons ou ruins).

Com um resultado 1, a magia falha e oferece o resultado “nada”. Não há como saber se esse resultado foi dado porque a magia falhou ou não. Lançar esta magia múltiplas vezes sobre o mesmo assunto gera sempre o primeiro resultado.

Por exemplo, se o grupo está prestes a entrar em uma câmara, o augúrio dirá “felicidade” se a câmara contém um tesouro desprotegido, “miséria” se contém um monstro, “felicidade e miséria” se houver um tesouro e um monstro ou “nada” se a câmara estiver vazia.

### Aviso
- **enhancements[0]**
  - nosso: aumenta o alcance em um fator de 10 (90m para 900m, 900m para 9km, e assim por diante).
  - site: aumenta o alcance em um fator de 10 (90m para 900m, 900m para 9km e assim por diante).
- **description**
  - nosso: Envia um aviso telepático para uma criatura, mesmo que não possa vê-la nem tenha linha de efeito. Escolha um:

Alerta: o alvo recebe +5 em seu próximo teste de Iniciativa e de Percepção dentro da cena.

Mensagem: o alvo recebe uma mensagem sua de até 25 palavras. Vocês devem ter um idioma em comum para o alvo poder entendê-lo.

Localização: o alvo sabe onde você está naquele momento. Se você mudar de posição, ele não saberá.
  - site: Envia um aviso telepático para uma criatura, mesmo que não possa vê-la nem tenha linha de efeito. Escolha um: Alerta: o alvo recebe +5 em seu próximo teste de Iniciativa e de Percepção dentro da cena.

Mensagem: o alvo recebe uma mensagem sua de até 25 palavras. Vocês devem ter um idioma em comum para o alvo poder entendê-lo.

Localização: o alvo sabe onde você está naquele momento. Se você mudar de posição, ele não saberá.

Envia um aviso telepático para uma criatura, mesmo que não possa vê-la nem tenha linha de efeito. Escolha um:

Alerta: o alvo recebe +5 em seu próximo teste de Iniciativa e de Percepção dentro da cena.

Mensagem: o alvo recebe uma mensagem sua de até 25 palavras. Vocês devem ter um idioma em comum para o alvo poder entendê-lo.

Localização: o alvo sabe onde você está naquele momento. Se você mudar de posição, ele não saberá.

### Caminhos da Natureza
- **description**
  - nosso: Você invoca espíritos da natureza, pedindo que eles abram seu caminho. As criaturas afetadas recebem deslocamento +3m e ignoram penalidades por terreno difícil se estiverem em terrenos naturais.

Truque: muda o alcance para pessoal e o alvo para você. Em vez do normal, você sabe onde fica o norte, e recebe +5 em testes de Sobrevivência para orientar-se.
  - site: Você invoca espíritos da natureza, pedindo que eles abram seu caminho. As criaturas afetadas recebem deslocamento +3m e ignoram penalidades por terreno difícil em terrenos naturais.

Truque: muda o alcance para pessoal e o alvo para você. Em vez do normal, você recebe +5 em testes de Sobrevivência para se orientar.

### Campo Antimagia
- **description**
  - nosso: Você é cercado por uma barreira invisível com 3m de raio que acompanha seus movimentos. Qualquer magia ou habilidade mágica que entre na área da barreira é suprimida enquanto estiver lá.

Criaturas convocadas que entrem em um Campo Antimagia desaparecem. Elas reaparecem na mesma posição quando a duração do Campo termina — supondo que a duração da magia que as convocou ainda não tenha terminado. Criaturas mágicas, como elementais, ou construtos imbuídos com magia durante sua criação, como golens, não são diretamente afetados pelo Campo Antimagia. Entretanto, como qualquer criatura, não poderão usar magias ou habilidades mágicas dentro dele.

Dissipar Magia não dissipa um Campo Antimagia, e dois Campos na mesma área não se neutralizam. Artefatos e deuses maiores não são afetados por um Campo Antimagia.
  - site: Você é cercado por uma barreira invisível com 3m de raio que o acompanha. Qualquer habilidade mágica ou item mágico que entre na área da barreira é suprimida enquanto estiver lá. Criaturas convocadas que entrem em um Campo Antimagia desaparecem. Elas reaparecem na mesma posição quando a duração do Campo termina — supondo que a duração da magia que as convocou ainda não tenha terminado. Criaturas mágicas ou imbuídas com durante sua criação não são diretamente afetadas pelo Campo Antimagia. Entretanto, como qualquer criatura, não poderão usar magias ou habilidades mágicas dentro dele. Uma magia que dissipa outras não dissipa um Campo Antimagia, e dois Campos na mesma área não se neutralizam. Artefatos e deuses maiores não são afetados por um Campo Antimagia.

### Camuflagem Ilusória
- **enhancements[0]**
  - nosso: a imagem do alvo fica ainda mais distorcida, oferecendo camuflagem total.
  - site: muda a duração para sustentada. A imagem do alvo fica mais distorcida, aumentando a chance de falha da camuflagem leve para 50%.
- **description**
  - nosso: O alvo fica com sua imagem nublada, como se vista através de um líquido, recebendo os efeitos de camuflagem.
  - site: O alvo fica com sua imagem nublada, como se vista através de um líquido, recebendo os efeitos de camuflagem leve.

### Comunhão com a Natureza
- **description**
  - nosso: Após uma breve união com a natureza local, você obtém informações e intuições sobre a região em que está, numa distância equivalente a um dia de viagem. Você recebe 6d4 dados de auxílio. Enquanto a magia durar, sempre que for realizar um teste de perícia em áreas naturais, você pode gastar qualquer quantidade desses d4 e adicionar o resultado rolado como bônus no teste. A magia termina se você ficar sem dados.
  - site: Após uma breve união com a natureza local, você obtém informações e intuições sobre a região em que está, numa distância equivalente a um dia de viagem. Você recebe 6d4 dados de auxílio. Enquanto a magia durar, sempre que for realizar um teste de perícia em áreas naturais, você pode gastar 2d4 (mais 2d4 para cada círculo de magias acima do 3º que puder lançar) e adicionar o resultado rolado como bônus no teste. A magia termina se você ficar sem dados.

### Conceder Milagre
- **description**
  - nosso: Você transfere um pouco de seu poder divino a outra criatura. Escolha uma magia de até 2º círculo que você conheça; o alvo pode lançar essa magia uma vez, sem gastar pelo custo base em PM (aprimoramentos podem ser usados, mas o alvo deve gastar seus próprios PM). Você sofre uma penalidade de –3 PM até que o alvo lance a magia que ganhou.
  - site: Você transfere um pouco de seu poder divino a outra criatura. Escolha uma de até 2º círculo que você conheça o alvo pode lançar essa magia uma vez, sem pagar o custo dela em PM (aprimoramentos podem ser usados, mas o alvo deve gastar seus próprios PM). Você sofre uma penalidade de –3 PM até que o alvo lance a magia.

### Concentração de Combate
- **enhancements[0]**
  - nosso: muda a execução para padrão e a duração para cena. Requer 2° círculo.
  - site: muda a execução para padrão e a duração para cena. Requer 2º círculo.
- **enhancements[1]**
  - nosso: além do normal, ao atacar você, um inimigo deve rolar dois dados e usar o pior resultado. Requer 3° círculo.
  - site: além do normal, ao atacar você, um inimigo deve rolar dois dados e usar o pior resultado. Requer 3º círculo.
- **enhancements[2]**
  - nosso: muda a execução para padrão, o alcance para curto, o alvo para criaturas escolhidas e a duração para cena. Requer 4° círculo.
  - site: muda a execução para padrão, o alcance para curto, o alvo para criaturas escolhidas e a duração para cena. Requer 4º círculo.
- **enhancements[3]**
  - nosso: muda a execução para padrão e a duração para 1 dia. Além do normal, você recebe um sexto sentido que o avisa de qualquer perigo ou ameaça. Você fica imune às condições surpreendido e desprevenido e recebe +10 em Defesa e Reflexos. Requer 5º círculo.
  - site: muda a execução para padrão e a duração para um dia. Além do normal, você recebe um sexto sentido que o avisa de qualquer perigo ou ameaça. Você fica imune às condições surpreendido e desprevenido e recebe +10 na Defesa e Reflexos. Requer 5º círculo.
- **description**
  - nosso: Você amplia sua percepção, antecipando movimentos dos inimigos e achando brechas em sua defesa. Quando faz um ataque, você rola dois dados e usa o melhor resultado.
  - site: Você amplia sua percepção, antecipando movimentos dos inimigos e achando brechas em sua defesa. Quando faz um teste de ataque, você rola dois dados e usa o melhor resultado.

### Condição
- **enhancements[1]**
  - nosso: aumenta a duração para 1 dia.
  - site: muda a duração para um dia.
- **description**
  - nosso: Pela duração da magia, você sabe a posição e condição (PV atuais, se estão sob efeito de magia...) das criaturas escolhidas. Depois de lançada, a distância entre você e os alvos não importa — a magia só deixa de detectar um alvo se ele morrer ou viajar para outro plano.
  - site: Pela duração da magia, você sabe a posição e status (PV atuais, se estão com uma condição ou sob efeito de magia...) dos alvos. Depois de lançada, a distância dos alvos não importa — a só deixa de detectar um alvo se ele morrer ou for para outro plano.

### Contato Extraplanar
- **enhancements[1]**
  - nosso: Muda os dados de auxílio para d12. Sempre que rolar um resultado 12 num desses d12, a entidade “suga” 2 PM de você. Requer 4º círculo.
  - site: Muda os dados de auxílio para d12. Sempre que rolar um resultado 12 num desses dados, a entidade “suga” 2 PM de você. Requer 4º círculo.
- **description**
  - nosso: Sua mente viaja até outro plano de existência, onde entra em contato com seres extraplanares como gênios, demônios ou elementais. Você firma um contrato com uma dessas entidades para que o auxilie durante o dia, em troca de se alimentar de seu mana. Quando a magia é lançada, você recebe 6d6 dados de auxílio. Enquanto a magia durar, sempre que for realizar um teste de perícia, você pode gastar qualquer quantidade desses d6 e adicionar o resultado rolado como bônus no teste. No entanto, esse auxílio tem um preço: sempre que rolar um “6” num desses d6, a entidade “suga” 1 PM de você. A magia termina quando você ficar sem dados para rolar, sem PM ou no fim do dia (o que acontecer primeiro).
  - site: Sua mente viaja até outro plano de existência, onde entra em contato com seres extraplanares como gênios e demônios. Você firma um contrato com uma dessas entidades para que o auxilie durante o dia, em troca de se alimentar de seu mana. Quando a magia é lançada, você recebe 6d6 dados de auxílio. Enquanto a magia durar, sempre que for realizar um teste de perícia, você pode gastar 1d6 (mais 1d6 para cada círculo de magias acima do 3º que puder lançar) e adicionar o resultado como bônus no teste. No entanto, sempre que rolar um “6” num desses dados, a entidade “suga” 1 PM de você. A magia termina se você gastar todos os dados, ficar sem PM ou no fim do dia (o que acontecer primeiro).

### Controlar Madeira
- **enhancements[0]**
  - nosso: muda o alcance para pessoal, o alvo para você e a duração para 1 dia. Você e seu equipamento se transformam em uma árvore de tamanho Grande. Nessa forma, você não pode falar ou fazer ações físicas, mas consegue perceber seus arredores normalmente. Se for atacado nessa forma, a magia é dissipada. Um teste de Sobrevivência (CD 30) revela que você não é uma árvore verdadeira.
  - site: muda o alcance para pessoal, o alvo para você e a duração para um dia. Você e seu equipamento se transformam em uma árvore de tamanho Grande. Nessa forma, você não pode falar ou fazer ações físicas, mas consegue perceber seus arredores normalmente. Se for atacado nessa forma, a é dissipada. Um teste de Sobrevivência (CD 30) revela que você não é uma árvore verdadeira.
- **enhancements[2]**
  - nosso: muda o alvo para objeto de madeira Enorme ou menor. Requer 3º círculo.
  - site: muda o tamanho do alvo para Enorme ou menor. Requer 3º círculo.
- **enhancements[3]**
  - nosso: muda o alvo para objeto de madeira Colossal ou menor. Requer 4º círculo.
  - site: muda o tamanho do alvo para Colossal ou menor. Requer 4º círculo.
- **description**
  - nosso: Você molda, retorce, altera ou repele madeira. Ao lançar a magia, escolha.

Fortalecer: deixa o alvo mais resistente. Armas têm seu dano aumentado em um passo. Escudos têm seu bônus de Defesa aumentado em +2. Além disso, esses e outros itens de madeira recebem +5 na RD e dobram seus PV.

Modelar: muda a forma do alvo. Pode transformar um galho em espada, criar uma porta onde antes havia apenas uma parede, transformar um tronco em uma caixa... Mas não pode criar mecanismos complexos (como uma besta) ou itens consumíveis.

Repelir: o alvo é repelido por você. Se for uma arma, ataques feitos com ela contra você falham automaticamente. Se for uma porta ou outro objeto que possa ser aberto, ele vai se abrir quando você se aproximar, mesmo que esteja trancado. Uma carroça ou outro objeto que vá atingi-lo, como um tronco caindo ou barril, vai desviar ou simplesmente parar adjacente a você, sem lhe causar dano. Os efeitos de regras em outros objetos de madeira ficam a cargo do mestre.

Retorcer: torna o alvo imprestável. Uma porta retorcida emperra (exigindo um teste de Força contra CD 25 para ser aberta). Armas e itens retorcidos impõem uma penalidade de –5 em testes de perícia. Escudos retorcidos deixam de oferecer qualquer bônus (mas ainda impõem penalidades). Um barco retorcido começa a afundar e naufraga ao final da cena. Os efeitos de regras em outros objetos de madeira ficam a cargo do mestre.
  - site: Você molda, retorce, altera ou repele madeira. Se lançar esta magia num objeto de uma criatura involuntária, ela tem direito a um teste de Vontade para anulá-la. Ao lançar a magia, escolha.

Fortalecer: deixa o alvo mais resistente. Armas têm seu dano aumentado em um passo. Escudos têm seu bônus de Defesa aumentado em +2 (isso é uma melhoria no item, portanto é cumulativa com outras magias). Esses e outros itens de madeira recebem +5 na RD e dobram seus PV.

Modelar: muda a forma do alvo. Pode transformar um galho em espada, criar uma porta onde antes havia apenas uma parede, transformar um tronco em uma caixa... Mas não pode criar mecanismos complexos (como uma besta) ou itens consumíveis.

Repelir: o alvo é repelido por você. Se for uma arma, ataques feitos com ela contra você falham automaticamente. Se for uma porta ou outro objeto que possa ser aberto, ele vai se abrir quando você se aproximar, mesmo que esteja trancado. Um objeto que vá atingi-lo, como uma carroça, tronco ou barril, vai desviar ou parar adjacente a você, sem lhe causar dano. Os efeitos de regras em outros objetos de madeira ficam a cargo do mestre.

Retorcer: estraga o alvo. Uma porta retorcida emperra (exigindo um teste de Força contra CD 25 para ser aberta). Armas e itens retorcidos impõem –5 em testes de perícia. Escudos retorcidos deixam de oferecer bônus (mas ainda impõem penalidades). Um barco retorcido começa a afundar e naufraga ao final da cena. Os efeitos de regras em outros objetos de madeira ficam a cargo do mestre.

### Controlar Plantas
- **enhancements[0]**
  - nosso: muda a duração para instantânea. Em vez do normal, as plantas na área diminuem, como se tivessem sido podadas. Terreno difícil muda para terreno normal e não oferece camuflagem. Esse efeito anula o uso normal de Controlar Plantas.
  - site: muda a duração para instantânea. Em vez do normal, as plantas na área diminuem, como se tivessem sido podadas. Terreno difícil muda para terreno normal e não fornece camuflagem. Esse efeito dissipa o uso normal de Controlar Plantas.

### Controlar Terra
- **enhancements[1]**
  - nosso: muda o alcance para pessoal, o alvo para você e a duração para 1 dia. Você e seu equipamento fundem-se a uma superfície ou objeto adjacente feito de pedra, terra, argila ou areia que possa acomodá-lo. Você pode voltar ao espaço adjacente como uma ação livre, dissipando a magia. Enquanto mesclado, você não pode falar ou fazer ações físicas, mas consegue perceber seus arredores normalmente. Pequenos danos não o afetam, mas se o objeto (ou o trecho onde você está imerso) for destruído, a magia é dissipada, você volta a um espaço livre adjacente e sofre 10d6 pontos de dano de impacto.
  - site: muda o alcance para pessoal, o alvo para você e a duração para um dia. Você e seu equipamento fundem-se a uma superfície ou objeto adjacente feito de pedra, terra, argila ou areia que possa acomodá-lo. Você pode voltar ao espaço adjacente como uma ação livre, dissipando a magia. Enquanto mesclado, você não pode falar ou fazer ações físicas, mas consegue perceber seus arredores normalmente. Pequenos danos não o afetam, mas se o objeto (ou o trecho onde você está imerso) for destruído, a magia é dissipada, você volta a um espaço livre adjacente e sofre 10d6 pontos de dano de impacto.
- **description**
  - nosso: Você manipula a densidade e a forma de toda terra, pedra, lama, argila ou areia na área. Ao lançar a magia, escolha.

Amolecer: se afetar o teto, uma coluna ou suporte, provoca um desabamento que causa 10d6 pontos de dano de impacto às criaturas na área (Reflexos reduz à metade). Se afetar um piso de terra ou pedra, cria terreno difícil de areia ou argila, respectivamente.

Modelar: pode usar pedra ou argila para criar um ou mais objetos simples de tamanho Enorme ou menor (sem mecanismos ou partes móveis). Por exemplo, pode transformar um tijolo em uma maça, criar uma passagem onde antes havia apenas uma parede ou levantar uma ou mais paredes que oferecem cobertura total (RD 8 e 50 PV para cada 3m).

Solidificar: transforma lama ou areia em terra ou pedra. Criaturas com os pés na superfície ficam agarradas. Elas podem se soltar com uma ação padrão e um teste de Acrobacia ou Atletismo.
  - site: Você manipula a densidade e a forma de toda terra, pedra, lama, argila ou areia na área. Ao lançar a magia, escolha. Amolecer: se afetar o teto, uma coluna ou suporte, provoca um desabamento que causa 10d6 pontos de dano de impacto às criaturas na área (Reflexos reduz à metade). Se afetar um piso de terra ou pedra, cria terreno difícil de areia ou argila, respectivamente. Modelar: pode usar pedra ou argila para criar um ou mais objetos simples de tamanho Enorme ou menor (sem mecanismos ou partes móveis). Por exemplo, pode transformar um tijolo em uma maça, criar uma passagem onde antes havia apenas uma parede ou levantar uma ou mais paredes que oferecem cobertura total (RD 8 e 50 PV para cada 3m). Solidificar: transforma lama ou areia em terra ou pedra. Criaturas com os pés na superfície ficam agarradas. Elas podem se soltar com uma ação padrão e um teste de Acrobacia ou Atletismo.

### Controlar a Gravidade
- **description**
  - nosso: Você controla os efeitos da gravidade dentro da área. Ao lançar a magia, escolha um dos efeitos abaixo. Enquanto a magia durar, você pode usar uma ação padrão para mudar o efeito.

Aumentar: a gravidade fica mais forte. No início de seus turnos, cada criatura na área deve fazer um teste de Força. Se passar, fica fatigada. Se falhar, fica fatigada e caída.

Inverter: inverte a gravidade da área, fazendo com que criaturas e objetos “caiam” para cima, atingindo o topo (12m) em uma rodada. Se um obstáculo (como um teto) impedir o movimento das criaturas, elas sofrem 1d6 pontos de dano de impacto para cada 1,5m de “queda”. Elas podem então se levantar e caminhar no obstáculo, de cabeça para baixo. Se não houver obstáculo, as criaturas e objetos ficam flutuando no topo da área afetada, sem poder sair do lugar. Criaturas voadoras podem se movimentar normalmente. Alguém adjacente a algo que possa agarrar tem direito a um teste de Reflexos para evitar a “queda”. A criatura deve permanecer presa pela duração da magia; caso contrário “cairá”.

Reduzir: a gravidade fica mais leve. Criaturas ou objetos livres com até 100kg flutuam para cima e para baixo conforme sua vontade, com deslocamento de voo 6m. Criaturas na área recebem +20 de bônus em testes de Atletismo para escalar e saltar. Uma criatura levitando fica instável, sofrendo –2 de penalidade em testes de ataque.
  - site: Você controla os efeitos da gravidade dentro da área. Ao lançar a magia, escolha um dos efeitos abaixo. Enquanto a magia durar, você pode gastar uma ação padrão para mudar o efeito.

Aumentar: no início de seus turnos, cada criatura na área deve fazer um teste de Atletismo. Se passar, fica fatigada. Se falhar, fica fatigada e caída.

Inverter: inverte a gravidade da área, fazendo com que criaturas e objetos “caiam” para cima, atingindo o topo (12m) em uma rodada. Se um obstáculo (como um teto) impedir o movimento das criaturas, elas sofrem 1d6 pontos de dano de impacto para cada 1,5m de “queda”. Elas podem então se levantar e caminhar no obstáculo, de cabeça para baixo. Se não houver obstáculo, as criaturas e objetos ficam flutuando no topo da área afetada, sem poder sair do lugar. Criaturas voadoras podem se movimentar normalmente. Alguém adjacente a algo que possa agarrar tem direito a um teste de Reflexos para evitar a “queda”. A criatura deve permanecer presa pela duração da caso contrário “cairá”.

Reduzir: criaturas ou objetos livres Médios ou menores flutuam para cima e para baixo conforme sua vontade, com deslocamento de voo 6m. Criaturas na área recebem +20 em testes de Atletismo para escalar e saltar. Uma criatura levitando fica instável, sofrendo –2 em testes de ataque.

### Controlar o Tempo
- **description**
  - nosso: Aquele que controla o tempo controla o mundo. Escolha um dos efeitos a seguir.

Congelar o tempo: você entra em um estado atemporal que faz todas as criaturas e efeitos parecerem congelados. Você pode agir livremente por 3 rodadas de tempo aparente. Durante essas rodadas, efeitos contínuos não o afetam, mas criaturas e objetos em posse de criaturas ficam imunes a seus ataques e magias. Magias de área e com duração maior que este efeito vão agir normalmente quando o congelamento acabar. Este efeito costuma ser usado para fortalecer suas defesas e invocar criaturas.

Saltar no tempo: você e até 5 criaturas voluntárias são transportadas de 1 a 24 horas para o futuro, desaparecendo com um brilho. Vocês ressurgem no mesmo lugar, com a mesma velocidade e orientação; do seu ponto de vista, nenhum tempo se passou. Se um objeto sólido agora ocupa o espaço de uma criatura, ela ressurge na área vazia mais próxima.

Voltar no tempo: você revive os últimos segundos. Todas as ações da rodada anterior são desfeitas (incluindo perda de PV e PM). Tudo retorna à posição em que estava no início do seu turno na última rodada e você é o único que sabe o que acontecerá. Todos os outros personagens envolvidos na cena devem repetir as mesmas ações — exceto se você fizer algo a respeito (como avisar seus aliados sobre o que vai acontecer).
  - site: Aquele que controla o tempo controla o mundo. Escolha um dos efeitos a seguir. Congelar o tempo: você gera uma bolha do seu tamanho na qual o tempo passa mais lentamente. Para outras criaturas, a bolha surge e desaparece instantaneamente, mas, para você, ela dura 3 rodadas, durante as quais você pode agir e não é afetado por efeitos contínuos (como chamas). Porém, durante essas 3 rodadas, você e quaisquer efeitos que você gerar não podem sair da área que você ocupava quando lançou esta magia. Efeitos de área com duração maior que a da bolha voltam a agir normalmente quando ela termina. Saltar no tempo: você e até 5 criaturas voluntárias são transportadas de 1 a 24 horas para o futuro, desaparecendo com um brilho. Vocês ressurgem no mesmo lugar, com a mesma velocidade e orientação do seu ponto de vista, nenhum tempo se passou. Se um objeto sólido agora ocupa o espaço de uma criatura, ela ressurge na área vazia mais próxima. Voltar no tempo: você revive os últimos segundos. Todas as ações da rodada anterior são desfeitas (incluindo perda de PV e PM — exceto os gastos nesta magia). Tudo retorna à posição em que estava no início do seu turno na última rodada e você é o único que sabe o que acontecerá. Outros personagens devem repetir as mesmas ações — exceto se você fizer algo a respeito (como avisar seus aliados sobre o que vai acontecer). Você só pode reviver uma mesma rodada uma vez.

### Controlar Água
- **description**
  - nosso: Você pode controlar os movimentos e comportamentos da água. Ao lançar a magia, escolha um dos efeitos abaixo.

Congelar: toda a água mundana na área é congelada. Criaturas nadando na área ficam imóveis; escapar exige gastar uma ação padrão e passar num teste de Atletismo ou Acrobacia.

Derreter: gelo mundano na área vira água e a magia termina. A critério do mestre, isso pode criar terreno difícil.

Enchente: eleva o nível da água mundana na área em até 4,5m. A sua escolha, muda área para alvo: uma embarcação. O alvo recebe +3m em seu deslocamento pela duração do efeito.

Evaporar: toda a água e gelo mundano na área evaporam instantaneamente e a magia termina. Elementais da água, plantas monstruosas e criaturas com imunidade a frio na área sofrem 10d8 pontos de dano de fogo; outras criaturas vivas recebem metade desse dano (Fortitude reduz à metade).

Partir: diminui o nível de toda água mundana na área em até 4,5m. Em um corpo d’água raso, isso abre um caminho seco, que pode ser atravessado a pé. Em um corpo d’água profundo, cria um redemoinho que pode prender barcos (um teste de Pilotagem com CD igual à da magia permite ao piloto livrar a embarcação). Elementais da água na área ficam lentos.
  - site: Você controlar os movimentos e comportamentos da água. Ao lançar a magia, escolha um dos efeitos abaixo.

Congelar: toda a água mundana na área é congelada. Criaturas nadando na área ficam imóveis; escapar exige gastar uma ação padrão e passar num teste de Atletismo ou Acrobacia.

Derreter: gelo mundano na área vira água e a magia termina. A critério do mestre, isso pode criar terreno difícil.

Enchente: eleva o nível da água mundana na área em até 4,5m. A sua escolha, muda área para alvo: uma embarcação. O alvo recebe +3m em seu deslocamento pela duração do efeito.

Evaporar: toda a água e gelo mundano na área evaporam instantaneamente e a magia termina. Elementais da água, plantas monstruosas e criaturas com imunidade a frio na área sofrem 10d8 pontos de dano de fogo; outras criaturas vivas recebem metade desse dano (Fortitude reduz à metade).

Partir: diminui o nível de toda água mundana na área em até 4,5m. Em um corpo d’água raso, isso abre um caminho seco, que pode ser atravessado a pé. Em um corpo d’água profundo, cria um redemoinho que pode prender barcos (um teste de Pilotagem com CD igual à da magia permite ao piloto livrar a embarcação). Elementais da água na área ficam lentos.

### Curar Ferimentos
- **description**
  - nosso: Você canaliza luz que recupera 2d8+2 pontos de vida na criatura tocada. Curar Ferimentos anula Infligir Ferimentos.

Truque: muda o alvo para 1 morto-vivo. Em vez do normal, causa 1d8 pontos de dano de luz (Vontade reduz à metade).
  - site: Você canaliza luz que recupera 2d8+2 pontos de vida na criatura tocada.

Truque: muda o alvo para 1 morto-vivo. Em vez do normal, causa 1d8 pontos de dano de luz (Vontade reduz à metade).

### Cólera de Azgher
- **description**
  - nosso: Você cria uma explosão de luz dourada e intensa. Criaturas na área ficam cegas por 1d4 rodadas, pegam fogo e sofrem 10d6 pontos de dano de fogo (mortos-vivos sofrem 10d8 pontos de dano). Uma criatura que passe no teste de resistência não fica cega, não pega fogo e sofre metade do dano.
  - site: Você cria um fulgor dourado e intenso. Criaturas na área ficam cegas por 1d4 rodadas e em chamas, e sofrem 10d6 pontos de dano de fogo (mortos-vivos sofrem 10d8 pontos de dano). Uma criatura que passe no teste de resistência não fica cega nem em chamas e sofre metade do dano.

### Desejo
- **description**
  - nosso: Esta é a mais poderosa das magias arcanas, permitindo alterar a realidade a seu bel-prazer. Você pode:

Dissipar os efeitos de qualquer magia de 4º círculo ou menor.
Transportar até 10 criaturas voluntárias em alcance longo para qualquer outro local, em qualquer plano.
Desfazer um acontecimento recente. A magia permite que um teste realizado por uma criatura em alcance longo na última rodada seja realizado novamente. Por exemplo, se um aliado morreu na última rodada devido ao ataque de um inimigo, você pode obrigar o inimigo a refazer esse ataque.

Normalmente, Desejo não exige sacrifício de PM — mas você pode desejar por algo mais poderoso. Nesse caso, a magia requer o sacrifício de 2 PM e pode fazer coisas como:

Criar um item mundano de até T$ 25.000.
Duplicar os efeitos de qualquer magia de até 4º círculo. Caso a magia precise de um componente material para ser lançada, ainda é necessário providenciar o componente.
Aumentar um atributo de uma criatura em +1. Um mesmo atributo pode ser aumentado em até +5 através do uso de Desejo.

Desejo pode gerar efeitos ainda mais poderosos, mas tenha cuidado! Desejar a fortuna de um rei pode transportá-lo para a sala de tesouro real, onde você será preso ou morto; desejar ser imortal pode transformá-lo em morto-vivo, e assim por diante. Qualquer efeito que não encaixe na lista acima deve ser decidido pelo mestre.
  - site: Esta é a mais poderosa das magias arcanas, permitindo alterar a realidade a seu bel-prazer. Você pode: • Dissipar os efeitos de qualquer magia de 4º círculo ou menor. • Transportar até 10 criaturas voluntárias em alcance longo para qualquer outro local, em qualquer plano. • Desfazer um acontecimento recente. A magia permite que um teste realizado por uma criatura em alcance longo na última rodada seja realizado novamente. Por exemplo, se um aliado morreu na última rodada devido ao ataque de um inimigo, você pode obrigar o inimigo a refazer esse ataque. Você pode desejar por algo ainda mais poderoso. Nesse caso, a magia requer o sacrifício de 2 PM e pode fazer coisas como: • Criar um item mundano de até T$ 30.000. • Duplicar os efeitos de qualquer magia de até 4º círculo. Caso a magia precise de um componente material para ser lançada, ainda é necessário providenciar o componente. • Aumentar um atributo de uma criatura em +1. Cada atributo só pode ser aumentado uma vez com Desejo. Desejo pode gerar efeitos ainda mais poderosos, mas cuidado! Desejar a fortuna de um rei pode transportá-lo para a sala de tesouro real, onde você poderá ser preso ou morto desejar ser imortal pode transformá-lo em morto-vivo, e assim por diante. Qualquer efeito que não se encaixe na lista acima deve ser decidido pelo mestre.

### Despertar Consciência
- **enhancements[1]**
  - nosso: muda a duração para permanente e adiciona sacrifício de 1 PM.
  - site: muda a duração para permanente e adiciona penalidade de –3 PM.
- **description**
  - nosso: Você desperta a consciência de um animal ou planta, que passa a ajudá-lo. O alvo se torna um aliado veterano de um tipo a sua escolha entre ajudante, combatente, fortão, guardião, médico ou perseguidor. Se usar esta magia em um aliado que já possua, seu nível de poder aumenta em um passo (iniciante para veterano, veterano para mestre). Se já for um aliado mestre, fornece um bônus adicional de outro tipo de aliado iniciante (entre as escolhas acima). O alvo ganha Inteligência 3d6, +1d4 de Carisma e pode falar os idiomas que você conhece.

Se não quiser ter o alvo como aliado, você pode pedir que ele proteja um local específico, atacando invasores (nesse caso, use as estatísticas apropriadas à criatura; plantas usam as estatísticas de entes).
  - site: Você desperta a consciência de um animal ou planta. O alvo se torna um parceiro veterano de um tipo a sua escolha entre ajudante, combatente, fortão, guardião, médico, perseguidor ou vigilante. Se usar esta magia em outro parceiro que já possua, o nível de poder de um de seus tipos aumenta em um passo (apenas uma vez por parceiro). Se já for um parceiro mestre, recebe o bônus de outro tipo de parceiro iniciante (entre as escolhas acima). O alvo se torna uma criatura racional, com Inteligência –1, e pode falar.

### Dissipar Magia
- **enhancements[0]**
  - nosso: muda a área para esfera com 9m de raio. Em vez do normal, cria um efeito de disjunção. Todas as magias na área são automaticamente dissipadas e todos os itens mágicos na área, exceto aqueles que você estiver carregando, viram itens mundanos (com direito a um teste de resistência para evitar esse efeito). Requer 5º círculo.
  - site: muda a área para esfera com 9m de raio. Em vez do normal, cria um efeito de disjunção. Todas as magias na área são automaticamente dissipadas e todos os itens mágicos na área, exceto aqueles que você estiver carregando, viram itens mundanos por uma cena (com direito a um teste de Vontade para evitar esse efeito). Requer 5º círculo.
- **description**
  - nosso: Você dissipa outras magias que estejam ativas, como se sua duração tivesse acabado. Note que efeitos de magias instantâneas não podem ser dissipados (não se pode dissipar uma Bola de Fogo ou Relâmpago depois que já causaram dano...). Se lançar essa magia em uma criatura ou área, faça um teste de Misticismo; você anula as magias com CD igual ou menor que o resultado do teste. Se lançada contra um item mágico, o transforma em um item mundano por 1d6 rodadas (sem teste de resistência).
  - site: Você dissipa outras magias que estejam ativas, como se sua duração tivesse acabado. Note que efeitos de magias instantâneas não podem ser dissipados (não se pode dissipar uma Bola de Fogo ou Relâmpago depois que já causaram dano...). Se lançar essa magia em uma criatura ou área, faça um teste de Misticismo você dissipa as magias com CD igual ou menor que o resultado do teste. Se lançada contra um item mágico, o transforma em um item mundano por 1d6 rodadas (Vontade anula).

### Engenho de Mana
- **enhancements[1]**
  - nosso: muda a duração para 1 dia.
  - site: muda a duração para um dia.
- **description**
  - nosso: Esta poderosa magia manifesta um disco de energia que lembra uma roda de engenho e flutua no ponto em que foi conjurado. O disco é intangível, imune a dano e não pode ser movido. Enquanto estiver ativo, tenta absorver qualquer magia lançada em alcance médio dele, como uma ação automática de contramágica, usando seu teste de Misticismo. Caso vença o teste, o engenho não só anula a magia como absorve os PM usados para lançá-la, acumulando PM temporários. No seu turno, se estiver ao alcance do disco, você pode gastar PM guardados nele para lançar magias.
  - site: Você cria um disco de energia que lembra uma roda de engenho e flutua no ponto em que foi conjurado. O disco é imune a dano, não pode ser movido e faz uma contramágica automática contra qualquer magia lançada em alcance médio dele (exceto as suas), usando seu teste de Misticismo. Caso vença o teste, o engenho não só anula a magia como absorve os PM usados para lançá-la, acumulando PM temporários. No seu turno, se estiver ao alcance do disco, você pode gastar PM nele para lançar magias.

### Enxame de Pestes
- **description**
  - nosso: Você conjura um enxame de criaturas a sua escolha, como besouros, gafanhotos, mosquitos, ratos, morcegos ou serpentes, que surge em um ponto a sua escolha. O enxame pode passar pelo espaço de outras criaturas e não impede que outras criaturas entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 2d12 pontos de dano de veneno a qualquer criatura em seu espaço (Fortitude reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.
  - site: Você conjura um enxame de criaturas a sua escolha, como besouros, gafanhotos, ratos, morcegos ou serpentes. O enxame pode passar pelo espaço de outras criaturas e não impede que outras criaturas entrem no espaço dele. No final de seus turnos, o enxame causa 2d12 pontos de dano de corte a qualquer criatura em seu espaço (Fortitude reduz à metade). Você pode gastar uma ação de movimento para mover o enxame 12m.

### Escudo da Fé
- **enhancements[1]**
  - nosso: também fornece ao alvo camuflagem contra ataques à distância.
  - site: também fornece ao alvo camuflagem leve contra ataques à distância.
- **enhancements[3]**
  - nosso: muda a execução para ação padrão, o alcance para toque e a duração para cena. A magia cria uma conexão mística entre você e o alvo. Além do efeito normal, o alvo sofre apenas metade do dano por ataques e efeitos; a outra metade do dano é transferida a você. Se a qualquer momento o alvo sair de alcance curto de você, a magia é dissipada. Requer 2º círculo.
  - site: muda a execução para ação padrão, o alcance para toque e a duração para cena. A magia cria uma conexão mística entre você e o alvo. Além do efeito normal, o alvo sofre metade do dano por ataques e efeitos a outra metade do dano é transferida a você. Se o alvo sair de alcance curto de você, a é dissipada. Requer 2º círculo.
- **enhancements[4]**
  - nosso: muda a duração para 1 dia. Requer 2º círculo.
  - site: muda a duração para um dia. Requer 2º círculo.

### Esculpir Sons
- **enhancements[0]**
  - nosso: aumenta o número de alvos em +1. Todas as criaturas e objetos devem ser afetados da mesma forma.
  - site: aumenta o número de alvos em +1. Todas as criaturas e objetos devem ser afetadas da mesma forma.

### Flecha Ácida
- **enhancements[0]**
  - nosso: além do normal, se o alvo coberto pelo muco ácido estiver usando armadura ou escudo, o item é corroído. Isso reduz o bônus na Defesa do item em 1 ponto permanentemente. O item pode ser consertado, restaurando seu bônus (veja a perícia Ofício, na página Perícias).
  - site: além do normal, se o alvo coberto pelo muco ácido estiver usando armadura ou escudo, o item é corroído. Isso reduz o bônus na Defesa do item em 1 ponto permanentemente. O item pode ser consertado, restaurando seu bônus (veja Ofício, na página 121).
- **description**
  - nosso: Você dispara um projétil que causa 4d6 pontos de dano de ácido. Se falhar no teste de resistência, o alvo também fica coberto por um muco corrosivo durante duas rodadas, sofrendo mais 2d6 de dano de ácido no início de seus turnos. Se lançada contra um objeto livre (que não esteja em posse de uma criatura) a magia causa dano dobrado e ignora a RD do objeto.
  - site: Você dispara um projétil que causa 4d6 pontos de dano de ácido. Se falhar no teste de resistência, o alvo fica coberto por um muco corrosivo, sofrendo mais 2d6 de dano de ácido no início de seus dois próximos turnos. Se lançada contra um objeto que não esteja em posse de uma criatura a magia causa dano dobrado e ignora a RD do objeto.

### Forma Etérea
- **description**
  - nosso: Você e todo o equipamento que está com você são transportados para o plano etéreo, que existe paralelamente ao plano material (o mundo físico). Na prática, é como ser transformado em um fantasma (mas você ainda é considerado uma criatura viva). Uma criatura etérea é invisível (pode alterar entre visível e invisível como ação livre), incorpórea e capaz de se mover em qualquer direção, inclusive para cima e para baixo. Ela enxerga o plano material, mas tudo parece cinza e insubstancial, reduzindo o alcance da visão e audição para 18m. Magias de abjuração e essência afetam criaturas etéreas, mas outras magias, não. Da mesma forma, uma criatura etérea não pode atacar nem lançar magias contra criaturas no plano material. Duas criaturas etéreas podem se afetar normalmente. Uma criatura afetada pode se materializar como uma ação de movimento, encerrando a magia. Uma criatura etérea que se materialize em um espaço ocupado é jogada para o espaço não ocupado mais próximo e sofre 1d6 pontos de dano de impacto para cada 1,5m de deslocamento.
  - site: Você e todo o equipamento que está com você são transportados para o plano etéreo, que existe paralelamente ao plano material (o mundo físico). Na prática, é como ser transformado em um fantasma (mas você ainda é considerado uma criatura viva). Uma criatura etérea é invisível (pode alterar en193 tre visível e invisível como ação livre), incorpórea e capaz de se mover em qualquer direção, inclusive para cima e para baixo. Ela enxerga o plano material, mas tudo parece cinza e insubstancial, reduzindo o alcance da visão e audição para 18m. Magias de abjuração e essência afetam criaturas etéreas, mas outras magias, não. Da mesma forma, uma criatura etérea não pode atacar nem lançar magias contra criaturas no plano material. Duas criaturas etéreas podem se afetar normalmente. Uma criatura afetada pode se materializar como uma ação de movimento, encerrando a magia. Uma criatura etérea que se materialize em um espaço ocupado é jogada para o espaço não ocupado mais próximo e sofre 1d6 pontos de dano de impacto para cada 1,5m de deslocamento.

### Globo de Invulnerabilidade
- **description**
  - nosso: Você é envolto por uma esfera mágica brilhante com 3m de raio, que detém qualquer magia de 2º círculo ou menor. Nenhuma magia pode ser lançada contra um alvo dentro do globo e magias de área não o penetram. No entanto, magias ainda podem ser lançadas de dentro para fora.

Dissipar Magia só dissipa o globo se for usada diretamente sobre você, não o afetando se usada em área. Efeitos mágicos não são dissipados quando entram na esfera, apenas suprimidos (voltam a funcionar fora do globo, caso sua duração não tenha acabado).

O globo é imóvel e não tem efeito sobre criaturas ou objetos. Após lançá-lo, você pode entrar ou sair livremente.
  - site: Você é envolto por uma esfera mágica brilhante com 3m de raio, que detém qualquer magia de 2º círculo ou menor. Nenhuma magia pode ser lançada contra um alvo dentro do globo e magias de área não o penetram. No entanto, magias ainda podem ser lançadas de dentro para fora.

Uma magia que dissipe outras magias só dissipa o globo se for usada diretamente sobre você, não o afetando se usada em área. Efeitos mágicos não são dissipados quando entram na esfera, apenas suprimidos (voltam a funcionar fora do globo, caso sua duração não tenha acabado). O globo é imóvel e não tem efeito sobre criaturas ou objetos. Após lançá-lo, você pode entrar ou sair livremente.

### Imobilizar
- **description**
  - nosso: O alvo fica paralisado; se passar na resistência, em vez disso fica lento. A cada rodada, pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, se liberta do efeito.
  - site: O alvo fica paralisado se passar na resistência, em vez disso fica lento. A cada rodada, pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, se liberta do efeito.

### Intervenção Divina
- **description**
  - nosso: Você pede a sua divindade para interceder diretamente. Você pode:

Curar todos os PV e condições de até 10 criaturas em alcance longo.
Dissipar os efeitos de qualquer magia de 4º círculo ou menor.

Normalmente, Intervenção Divina não exige sacrifício de PM — mas você pode implorar por algo mais poderoso. Nesse caso, a magia requer o sacrifício de 2 PM e pode fazer coisas como:

Criar um item mundano de até T$ 25.000.
Duplicar os efeitos de qualquer magia de até 4º círculo. Caso a magia precise de um componente material para ser lançada, ainda é necessário providenciar o componente.
Proteger uma cidade de um desastre, como uma erupção vulcânica, enchente ou terremoto.
Ressuscitar uma criatura em alcance longo que tenha morrido há até uma rodada. A criatura acorda com 1 PV.
Qualquer outra coisa que o mestre autorize, conforme os desejos e objetivos da divindade do conjurador.
  - site: Você pede a sua divindade para interceder diretamente. Você pode:

• Curar todos os PV e condições de até 10 criaturas em alcance longo (este efeito cura mortos-vivos, em vez de causar dano).

• Dissipar os efeitos de qualquer magia de 4º círculo ou menor. Você pode implorar por algo ainda mais poderoso. Nesse caso, a magia requer o sacrifício de 2 PM e pode fazer coisas como:

• Criar um item mundano de até T$ 30.000.

• Duplicar os efeitos de qualquer magia de até 4º círculo. Caso a magia precise de um componente material para ser lançada, ainda é necessário providenciar o componente.

• Proteger uma cidade de um desastre, como uma erupção vulcânica, enchente ou terremoto.

• Ressuscitar uma criatura em alcance longo que tenha morrido há até uma rodada. A criatura acorda com 1 PV.

• Qualquer outra coisa que o mestre autorize, conforme os desejos e objetivos da divindade do conjurador.

### Invisibilidade
- **enhancements[0]**
  - nosso: muda a execução para ação padrão, o alcance para toque e o alvo para 1 criatura ou 1 objeto.
  - site: muda a execução para ação padrão, o alcance para toque e o alvo para 1 criatura ou 1 objeto Grande ou menor.
- **enhancements[2]**
  - nosso: muda a duração para sustentada. Em vez do normal, o alvo gera uma esfera de invisibilidade. O alvo e todas as criaturas a até 3m dele se tornam invisíveis, como no efeito normal da magia (ainda ficam visíveis caso façam uma ação hostil). A esfera se move juntamente com o alvo; qualquer coisa que saia da esfera fica visível. Requer 3º círculo.
  - site: muda a duração para sustentada. Em vez do normal, o alvo gera uma esfera de invisibilidade. Não pode ser usado em conjunto com outros aprimoramentos. O alvo e todas as criaturas a até 3m dele se tornam invisíveis, como no efeito normal da magia (ainda ficam visíveis caso façam uma ação hostial). A esfera se move juntamente com o alvo qualquer coisa que saia da esfera fica visível. Requer 3º círculo.
- **enhancements[3]**
  - nosso: muda a execução para ação padrão, o alcance para toque e o alvo para 1 criatura. A magia não é dissipada caso o alvo faça um ataque ou use uma habilidade ofensiva. Requer 4º círculo.
  - site: muda a execução para ação padrão, o alcance para toque e o alvo para 1 criatura. A magia não é dissipada caso o alvo faça uma ação hostil. Requer 4º círculo.
- **description**
  - nosso: O alvo fica invisível, incluindo seu equipamento. Ele recebe camuflagem total e +20 em testes de Furtividade. Como o normal, criaturas que não possam vê-lo ficam desprevenidas contra seus ataques.

A magia termina se o alvo faz um ataque ou usa uma habilidade hostil. Ações contra objetos livres não dissipam a Invisibilidade (você pode tocar ou apanhar objetos que não estejam sendo segurados por outras criaturas). Causar dano indiretamente — por exemplo, acendendo o pavio de um barril de pólvora que vai detonar mais tarde — não é considerado um ataque.

Objetos soltos pelo alvo voltam a ser visíveis e objetos apanhados por ele ficam invisíveis. Uma luz transportada pelo alvo nunca fica invisível (mesmo que sua fonte seja). Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível.
  - site: O alvo fica invisível (incluindo seu equipamento). Um personagem invisível recebe camuflagem total, +10 em testes de Furtividade contra ouvir e criaturas que não possam vê-lo ficam desprevenidas contra seus ataques. A magia termina se o alvo faz uma ação hostil contra uma criatura. Ações contra objetos livres não dissipam a Invisibilidade (você pode tocar ou apanhar objetos que não estejam sendo segurados por outras criaturas). Causar dano indiretamente — por exemplo, acendendo o pavio de um barril de pólvora que vai detonar mais tarde — não é considerado um ataque. Objetos soltos pelo alvo voltam a ser visíveis e objetos apanhados por ele ficam invisíveis. Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível. Uma luz nunca fica invisível (mesmo que sua fonte seja).

### Invulnerabilidade
- **description**
  - nosso: Esta magia cria uma barreira mágica impenetrável que protege você contra efeitos nocivos mentais ou físicos, a sua escolha.

Proteção mental: você fica imune às condições abalado, alquebrado, apavorado, atordoado, confuso, esmorecido, fascinado, frustrado e pasmo, além de efeitos de encantamento e ilusão.

Proteção física: você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de acertos críticos, ataques furtivos e doenças.
  - site: Esta magia cria uma barreira mágica impenetrável que protege você contra efeitos nocivos mentais ou físicos, a sua escolha. Proteção mental: você fica imune às condições abalado, alquebrado, apavorado, atordoado, confuso, esmorecido, fascinado, frustrado e pasmo, além de efeitos de encantamento e ilusão. Proteção física: você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de acertos críticos, ataques furtivos e doenças.

### Legião
- **description**
  - nosso: Você domina a mente dos alvos. Os alvos obedecem cegamente a seus comandos, exceto ordens claramente suicidas. Um alvo tem direito a um teste no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam pasmos por 1 rodada enquanto recuperam a consciência.
  - site: Você domina a mente dos alvos. Os alvos obedecem cegamente a seus comandos, exceto ordens claramente suicidas. Um alvo tem direito a um teste no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam abalados por 1 rodada enquanto recuperam a consciência.

### Lendas e Histórias
- **enhancements[0]**
  - nosso: muda a execução para 1 dia, o alcance para ilimitado e adiciona componente material (cuba de ouro cheia d’água e ingredientes mágicos, no valor de T$ 1.000). Você ainda precisa ter alguma informação sobre o alvo, como um nome, descrição ou localização.
  - site: muda a execução para um dia, o alcance para ilimitado e adiciona componente material (cuba de ouro cheia d’água e ingredientes mágicos, no valor de T$ 1.000). Você ainda precisa ter alguma informação sobre o alvo, como um nome, descrição ou localização.
- **description**
  - nosso: Você descobre informações sobre uma criatura, objeto ou local que esteja tocando. O que exatamente você descobre depende do mestre: talvez você não descubra tudo que há para saber, mas ganhe pistas para continuar a investigação. A cada rodada que mantiver a magia, você descobre:

- Todas as informações sobre o alvo, como se tivesse passado em todos os testes de Conhecimento para tal.
- Todas as habilidades do alvo. Se for uma criatura, você sabe suas estatísticas de jogo como raça, classe, nível, atributos, magias, resistências e fraquezas. Se for um item mágico, aprende seu efeito e funcionamento.
- Se alvo está sob influência de alguma magia e todas as informações sobre as magias ativas, se houver alguma.
  - site: Você descobre informações sobre uma criatura, objeto ou local que esteja tocando. O que exatamente você descobre depende do mestre: talvez você não descubra tudo que há para saber, mas ganhe pistas para continuar a investigação. A cada rodada que mantiver a, você descobre:

• Todas as informações sobre o alvo, como se tivesse passado em todos os testes de Conhecimento para tal.

• Todas as habilidades do alvo. Se for uma criatura, você sabe suas estatísticas de jogo como raça, classe, nível, atributos, magias, resistências e fraquezas. Se for um item mágico, aprende seu efeito e funcionamento.

• Se o alvo está sob influência de alguma magia e todas as informações sobre as magias ativas, se houver alguma.

### Libertação
- **description**
  - nosso: O alvo fica imune a condições de paralisia e ignora qualquer efeito que impeça ou restrinja seu deslocamento. Por fim, pode usar habilidades que exigem liberdade de movimentos mesmo se estiver usando armadura ou escudo
  - site: O alvo fica imune a efeitos de movimento e ignora qualquer efeito que impeça ou restrinja seu deslocamento. Por fim, pode usar habilidades que exigem liberdade de movimentos mesmo se estiver usando armadura ou escudo.

### Ligação Sombria
- **enhancements[0]**
  - nosso: além do normal, o alvo também pode morrer por perda de PV ou se você morrer (um teste de Fortitude anula a morte).
  - site: a magia não termina se o alvo chegar a 0 PV (o que significa que dano causado por essa magia pode matá-lo).
- **description**
  - nosso: Esse ritual cria uma conexão entre seu corpo e o da criatura alvo, criando uma marca idêntica na pele de ambos. Enquanto a magia durar, sempre que você sofrer qualquer dano ou condição, o alvo dessa magia deve fazer um teste de Fortitude; se falhar, sofre a mesma quantidade e tipo de dano que você, ou adquire a mesma condição. A magia termina se o alvo chegar a 0 pontos de vida.
  - site: Cria uma conexão entre seu corpo e o da criatura alvo, deixando uma marca idêntica na pele de ambos. Enquanto a magia durar, sempre que você sofrer qualquer dano ou condição, o alvo desta magia deve fazer um teste de Fortitude se falhar, sofre o mesmo dano que você ou adquire a mesma condição. A magia termina se o alvo chegar a 0 pontos de vida.

### Ligação Telepática
- **enhancements[1]**
  - nosso: muda o alvo para 1 criatura. Em vez do normal, você cria um elo mental que permite que você veja e ouça através dos sentidos da criatura, se gastar uma ação de movimento. Uma criatura involuntária pode fazer um teste de Vontade para suprimir a magia por uma hora. Requer 3º círculo.
  - site: muda o alvo para 1 criatura. Em vez do normal, você cria um elo mental que permite que você veja e ouça pelos sentidos da criatura, se gastar uma ação de movimento. Uma criatura involuntária pode fazer um teste de Vontade para suprimir a magia por uma hora. Requer 3º círculo.
- **description**
  - nosso: Você cria um elo mental entre duas criaturas com Inteligência 3 ou maior (você pode ser uma delas). As criaturas podem se comunicar independente de idioma ou distância, mas não em mundos diferentes.
  - site: Você cria um elo mental entre duas criaturas com Inteligência -4 ou maior (você pode ser uma delas). As criaturas podem se comunicar independente de idioma ou distância, mas não em mundos diferentes.

### Luz
- **enhancements[1]**
  - nosso: muda a duração para 1 dia.
  - site: muda a duração para um dia.
- **enhancements[2]**
  - nosso: muda a duração para permanente e adiciona componente material (pó de rubi no valor de T$ 50). Requer 2º círculo.
  - site: muda a duração para permanente e adiciona componente material (pó de rubi no valor de T$ 50). Não pode ser usado em conjunto com outros aprimoramentos. Requer 2º círculo.
- **enhancements[4]**
  - nosso: (Apenas Arcanos) muda o alcance para longo e o efeito para 4 esferas brilhantes. Cria esferas flutuantes de pura luz com 10cm de diâmetro, que você pode posicionar onde quiser dentro do alcance. Você pode enviar uma esfera à frente, outra para trás, outra para cima e manter uma perto de você, por exemplo. Uma vez por rodada, você pode mover as esferas com uma ação livre. Cada esfera ilumina como uma tocha, mas não produz calor. Se uma esfera ocupar o espaço de uma criatura, ela fica ofuscada e sua silhueta pode ser vista claramente (ela não recebe camuflagem por escuridão ou invisibilidade). Requer 2º círculo.
  - site: (Apenas Arcanos) muda o alcance para longo e o efeito para cria 4 pequenos globos flutuantes de pura luz. Você pode posicionar os globos onde quiser dentro do alcance. Você pode enviar um à frente, outra para trás, outra para cima e manter um perto de você, por exemplo. Uma vez por rodada, você pode mover os globos com uma ação livre. Cada um ilumina como uma tocha, mas não produz calor. Se um globo ocupar o espaço de uma criatura, ela fica ofuscada e sua silhueta pode ser vista claramente (ela não recebe camuflagem por escuridão ou invisibilidade). Requer 2º círculo.
- **enhancements[5]**
  - nosso: (Apenas Divinos) a luz é cálida como a do sol. Criaturas que sofrem penalidades e dano pela luz solar sofrem seus efeitos como se estivessem expostos à luz solar real. Dentro da área seus aliados estabilizam automaticamente e ficam imunes à condição sangrando, e seus inimigos ficam ofuscados. Requer 2º círculo.
  - site: (Apenas Divinos) a luz é cálida como a do sol. Criaturas que sofrem penalidades e dano pela luz solar sofrem seus efeitos como se estivessem expostos à luz solar real. Seus aliados na área estabilizam automaticamente e ficam imunes à condição sangrando, e seus inimigos ficam ofuscados. Requer 2º círculo.
- **enhancements[6]**
  - nosso: (Apenas Divinos) muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo é envolto por um halo de luz, recebendo +10 em testes de Diplomacia e resistência a trevas 10. Requer 2º círculo.
  - site: (Apenas Divinos) muda o alcance para toque e o alvo para 1 criatura. Em vez do normal, o alvo é envolto por um halo de luz, recebendo +10 em testes de Diplomacia e redução de trevas 10. Requer 2º círculo.

### Lágrimas de Wynna
- **enhancements[0]**
  - nosso: muda a área para círculo de 6m de raio e o alvo para criaturas escolhidas.
  - site: muda a área para esfera com 6m de raio e o alvo para criaturas escolhidas.
- **enhancements[1]**
  - nosso: muda a execução para 1 dia e adiciona custo adicional (sacrifício de 1 PM). O alvo da magia precisa ser mantido em alcance curto do conjurador durante toda a execução. Ao término, faz um teste de Vontade. Se falhar, perde a habilidade de lançar magias arcanas permanentemente. Se passar, resiste, mas ainda pode ser alvo da magia no dia seguinte. Nenhum poder mortal é capaz de reverter essa perda. Os clérigos da Deusa da Magia dizem que ela chora cada vez que este ritual é realizado.
  - site: muda a execução para um dia e adiciona custo adicional (sacrifício de 1 PM). O alvo da magia precisa ser mantido em alcance curto do conjurador durante toda a execução. Ao término, faz um teste de Vontade. Se falhar, perde a habilidade de lançar magias arcanas permanentemente. Se passar, resiste, mas ainda pode ser alvo da magia no dia seguinte. Nenhum poder mortal é capaz de reverter essa perda. Os clérigos de Wynna dizem que a deusa chora cada vez que este ritual é realizado.

### Manto de Sombras
- **description**
  - nosso: Você fica coberto por um manto de energia sombria. Nesta forma, torna-se incorpóreo (inclui seu equipamento): só pode ser afetado por armas mágicas, magias ou outras criaturas incorpóreas e pode atravessar objetos sólidos, mas não manipulá-los. Contudo, se torna vulnerável à luz direta: se exposto a uma fonte de luz, sofre 1 ponto de dano por rodada.

Você pode gastar uma ação de movimento e 1 PM para “entrar” em uma sombra do seu tamanho ou maior e se teletransportar para outra sombra, também do seu tamanho ou maior, em alcance médio.
  - site: Você fica coberto por um manto de energia sombria. Nesta forma, torna-se incorpóreo (inclui seu equipamento): só pode ser afetado por armas e habilidades mágicas, ou por outras criaturas incorpóreas, e pode atravessar objetos sólidos, mas não manipulá-los. Também não pode atacar criaturas normais (mas ainda pode lançar magias nelas). Além disso, se torna vulnerável à luz direta: se exposto a uma fonte de luz, sofre 1 ponto de dano por rodada. Você pode gastar uma ação de movimento e 1 PM para “entrar” em uma sombra do seu tamanho ou maior e se teletransportar para outra sombra, também do seu tamanho ou maior, em alcance médio.

### Marca da Obediência
- **enhancements[0]**
  - nosso: muda a duração para 1 dia. Se não estiver em combate, a criatura só pode fazer o teste de Vontade a cada hora. Requer 3º círculo.
  - site: muda a duração para um dia. Se não estiver em combate, a criatura só pode fazer o teste de Vontade a cada hora. Requer 3º círculo.
- **enhancements[1]**
  - nosso: sempre que o alvo fizer o teste de Vontade e falhar, a marca causa 3d6 pontos de dano mental. Requer 3º círculo.
  - site: sempre que o alvo fizer o teste de Vontade e falhar, a marca causa 3d6 pontos de dano psíquico. Requer 3º círculo.

### Marionete
- **description**
  - nosso: Esta magia manipula o sistema nervoso do alvo. Ao sofrer a magia, e no início de cada um de seus turnos, a vítima faz um teste de Fortitude. Se passar, a magia é anulada. Se falhar, todas as suas ações físicas naquele turno estarão sob controle do conjurador. A vítima ainda tem consciência de tudo que acontece à sua volta, podendo ver, ouvir e até falar com certo esforço (mas não para lançar magias). Contudo, seu corpo realiza apenas os movimentos que o conjurador deseja. A vítima pode ser manipulada para se movimentar, lutar, usar habilidades de combate... Enfim, qualquer coisa de que seja fisicamente capaz.

Você precisa de linha de efeito para controlar a vítima. Se perder o contato, não poderá controlá-la — mas ela estará paralisada até que o conjurador recupere o controle ou a magia termine.
  - site: Esta magia manipula o sistema nervoso do alvo. Ao sofrer a magia, e no início de cada um de seus turnos, a vítima faz um teste de Fortitude. Se passar, a magia é anulada. Se falhar, todas as suas ações físicas naquele turno estarão sob controle do conjurador. A vítima ainda tem consciência de tudo que acontece à sua volta, podendo ver, ouvir e até falar com certo esforço (mas não para lançar magias). Contudo, seu corpo realiza apenas os movimentos que o conjurador deseja. A vítima pode ser manipulada para se movimentar, lutar, usar habilidades de combate... Enfim, qualquer coisa de que seja fisicamente capaz. Você precisa de linha de efeito para controlar a vítima. Se perder o contato, não poderá controlá-la — mas ela estará paralisada até que o conjurador recupere o controle ou a magia termine.

### Metamorfose
- **enhancements[3]**
  - nosso: muda o alcance para médio, o alvo para 1 criatura e a resistência para Vontade anula. Em vez do normal, transforma o alvo em uma criatura ou objeto inofensivo (ovelha, sapo, galinha, pudim de ameixa etc.). A criatura não pode atacar, falar e lançar magias; seu deslocamento vira 3m e sua Defesa vira 10. Suas outras características não mudam. No início de seus turnos, o alvo pode fazer um teste de Vontade; se passar, retorna à sua forma normal e a magia termina. Requer 3º círculo.
  - site: muda o alcance para médio, o alvo para 1 criatura e a resistência para Vontade anula. Em vez do normal, transforma o alvo em uma criatura ou objeto inofensivo (ovelha, sapo, galinha, pudim de ameixa etc.). A criatura não pode atacar, falar e lançar magias seu deslocamento vira 3m e sua Defesa vira 10. Suas outras características não mudam. No início de seus turnos, o alvo pode fazer um teste de Vontade se passar, retorna à sua forma normal e a magia termina. Requer 3º círculo.
- **description**
  - nosso: Você muda sua aparência e forma — incluindo seu equipamento — para qualquer outra criatura, existente ou imaginada. Independentemente da forma escolhida, você recebe +20 em testes de Enganação para disfarce. Características não mencionadas não mudam.

Se mudar para uma forma humanoide, pode mudar o tipo de dano físico de suas armas (se usa uma maça e transformá-la em espada longa, ela pode causar dano de corte, por exemplo). Se quiser, pode assumir uma forma humanoide com uma categoria de tamanho acima ou abaixo da sua; nesse caso aplique os modificadores em Furtividade e testes de manobra.

Se mudar para outras formas, você pode escolher uma Forma Selvagem do druida (veja a página Druida). Nesse caso você não pode atacar com suas armas, falar ou lançar magias até voltar ao normal, mas recebe uma ou mais armas naturais e os bônus da forma selvagem escolhida.
  - site: Você muda sua aparência e forma — incluindo seu equipamento — para qualquer outra criatura, existente ou imaginada. Independentemente da forma escolhida, você recebe +20 em testes de Enganação para disfarce. Características não mencionadas não mudam. Se mudar para uma forma humanoide, pode mudar o tipo de dano (entre corte, impacto e perfuração) de suas armas (se usa uma maça e transformá-la em espada longa, ela pode causar dano de corte, por exemplo). Se quiser, pode assumir uma forma humanoide com uma categoria de tamanho acima ou abaixo da sua nesse caso aplique os modificadores em Furtividade e testes de manobra. Se mudar para outras formas, você pode escolher uma Forma Selvagem do druida (veja no Capítulo 1). Nesse caso você não pode atacar com suas armas, falar ou lançar magias até voltar ao normal, mas recebe uma ou mais armas naturais e os bônus da forma selvagem escolhida.

### Miasma Mefítico
- **description**
  - nosso: A área é coberta por emanações letais. Criaturas na área sofrem 5d6 pontos de dano de veneno e ficam enjoadas por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoadas.

Truque: muda o alcance para toque, a área para alvo (1 criatura com 0 PV ou menos), a duração para instantânea e a resistência para Fortitude anula. Em vez do normal, você canaliza o Miasma contra uma vítima. Se falhar na resistência, ela morre e você recebe +2 na CD de suas magias por 1 dia. Se passar, fica imune a este truque por um dia.
  - site: A área é coberta por emanações letais. Criaturas na área sofrem 5d6 pontos de dano de ácido e ficam enjoadas por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoadas.

Truque: muda o alcance para toque, a área para alvo (1 criatura com 0 PV ou menos), a duração para instantânea, a resistência para Fortitude anula e adiciona componente material (pó de ônix no valor de T$ 10). Em vez do normal, você canaliza o Miasma contra uma vítima. Se falhar na resistência, ela morre e você recebe +2 na CD de suas magias por um dia. Se passar, fica imune a este truque por um dia.

### Miragem
- **enhancements[1]**
  - nosso: muda a duração para permanente e adiciona componente material (pó de diamante no valor de T$ 1.000). Requer 5º círculo.
  - site: muda a duração para permanente e adiciona componente material (pó de diamante no valor de T$ 1.000). Requer 4º círculo.

### Missão Divina
- **enhancements[0]**
  - nosso: muda o alcance para toque, a duração para permanente e adiciona penalidade de –1 PM. Em vez do normal, você inscreve uma marca (como uma tatuagem) na pele do alvo e escolhe um tipo de ação que ativará a marca. Normalmente, será cometer um crime (roubar, matar...) ou outra coisa contrária às Obrigações & Restrições de sua divindade. Sempre que a marca é ativada, o alvo recebe uma penalidade cumulativa de –2 em todos os testes. Muitas vezes, portar essa marca é um estigma por si só, já que esta magia normalmente é lançada em criminosos ou traidores. Dissipar Magia suprime a marca e suas penalidades por um dia; elas só podem ser totalmente removidas pelo conjurador original ou pela magia Purificação.
  - site: muda o alcance para toque, a duração para permanente e adiciona penalidade de –1 PM. Em vez do normal, você inscreve uma marca (como uma tatuagem) na pele do alvo e escolhe um tipo de ação que ativará a marca. Normalmente, será cometer um crime (roubar, matar...) ou outra coisa contrária às Obrigações & Restrições de sua divindade. Sempre que a marca é ativada, o alvo recebe uma penalidade cumulativa de –2 em todos os testes. Muitas vezes, portar essa marca é um estigma por si só, já que esta magia normalmente é lançada em criminosos ou traidores. Uma magia que dissipe outras suprime a marca e suas penalidades por um dia elas só podem ser totalmente removidas pelo conjurador original ou pela magia Purificação.
- **enhancements[1]**
  - nosso: aumenta a duração para 1 ano ou até ser descarregada.
  - site: muda a duração para 1 ano ou até ser descarregada.
- **description**
  - nosso: Esta magia obriga o alvo a cumprir uma tarefa a sua escolha. Ela dura uma semana ou até o alvo cumprir a tarefa, o que vier primeiro. O alvo pode recusar a missão — mas, no fim de cada dia em que não se esforçar para cumprir a tarefa, deve fazer um teste de Vontade; se falhar, sofre uma penalidade cumulativa de –2 em todos os testes e rolagens.

A Missão Divina não pode forçar uma criatura a um ato suicida, nem designar uma missão impossível (como matar uma criatura que não existe).
  - site: Esta magia obriga o alvo a cumprir uma tarefa a sua escolha. Ela dura uma semana ou até o alvo cumprir a tarefa, o que vier primeiro. O alvo pode recusar a missão — mas, no fim de cada dia em que não se esforçar para cumprir a tarefa, deve fazer um teste de Vontade se falhar, sofre uma penalidade cumulativa de –2 em todos os testes e rolagens. A Missão Divina não pode forçar um ato suicida, nem uma missão impossível (como matar um ser que não existe).

### Montaria Arcana
- **enhancements[0]**
  - nosso: além do normal, criaturas do tipo animal em alcance curto da montaria devem fazer um teste de Vontade. Se passarem, ficam abaladas pela cena; se falharem, ficam apavoradas por 1d4 rodadas, depois abaladas pela cena.
  - site: além do normal, criaturas do tipo animal em alcance curto da montaria devem fazer um teste de Vontade. Se passarem, ficam abaladas pela cenase falharem, ficam apavoradas por 1d4 rodadas, depois abaladas pela cena.
- **enhancements[1]**
  - nosso: muda a duração para permanente e adiciona sacrifício de 1 PM.
  - site: muda a duração para permanente e adiciona penalidade de –3 PM.
- **enhancements[2]**
  - nosso: aumenta o tamanho da montaria em uma categoria. Isso também aumenta o número de criaturas que ela pode carregar — duas para uma criatura Enorme, seis para Colossal. Uma única criatura controla a montaria; as outras apenas são deslocadas.
  - site: aumenta o tamanho da montaria em uma categoria. Isso também aumenta o número de criaturas que ela pode carregar — duas para uma criatura Enorme, seis para Colossal. Uma única criatura controla a montaria as outras apenas são deslocadas.
- **enhancements[3]**
  - nosso: muda a criatura para um aliado montaria mestre. Requer 3º círculo.
  - site: muda o nível do parceiro para mestre. Requer 3º círculo.
- **description**
  - nosso: Esta magia convoca um cavalo de batalha que serve como um aliado montaria veterano. Sua aparência é de um animal negro com crina e cauda cinzentas e cascos feitos de fumaça, mas você pode mudá-la se quiser. Além dos benefícios normais, a Montaria Arcana pode atravessar terreno difícil sem redução em seu deslocamento.
  - site: Montaria Arcana pode atravessar terreno difícil sem redução em seu deslocamento. Você pode usar Misticismo no lugar de Cavalgar para efeitos desta montaria (incluindo ser considerado treinado).

### Névoa
- **enhancements[1]**
  - nosso: você pode escolher criaturas no alcance ao lançar a magia; elas enxergam através do efeito. Requer 2º círculo.
  - site: você pode escolher criaturas no alcance ao lançar a magia elas enxergam através do efeito. Requer 2º círculo.
- **enhancements[2]**
  - nosso: além do normal, a nuvem tem um cheiro horrível. No início de seus turnos, qualquer criatura dentro dela, ou qualquer criatura com faro em alcance curto da nuvem, deve fazer um teste de Fortitude. Se falhar, fica enjoada por uma rodada.
  - site: a nuvem tem um cheiro horrível. No início de seus turnos, qualquer criatura dentro dela, ou qualquer criatura com faro em alcance curto da nuvem, deve fazer um teste de Fortitude. Se falhar, fica enjoada por uma rodada.
- **enhancements[3]**
  - nosso: além do normal, a nuvem tem um tom esverdeado e se torna cáustica. No início de seus turnos, criaturas dentro dela sofrem 2d4 pontos de dano de ácido.
  - site: a nuvem tem um tom esverdeado e se torna cáustica. No início de seus turnos, criaturas dentro dela sofrem 2d4 pontos de dano de ácido.
- **description**
  - nosso: Uma névoa espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — criaturas a até 1,5m têm camuflagem e criaturas a partir de 3m têm camuflagem total. Um vento forte dispersa a névoa em 4 rodadas e um vendaval a dispersa em 1 rodada. Esta magia não funciona sob a água.
  - site: Uma névoa espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — criaturas a até 1,5m têm camuflagem leve e criaturas a partir de 3m têm camuflagem total. Um vento forte dispersa a névoa em 4 rodadas e um vendaval a dispersa em 1 rodada. Esta não funciona sob a água.

### Oração
- **enhancements[0]**
  - nosso: aumenta os bônus em +1, limitado pelo círculo máximo de magia que você pode lançar.
  - site: aumenta os bônus em +1 (bônus máximo limitado pelo círculo máximo de magia que você pode lançar).
- **enhancements[1]**
  - nosso: aumenta as penalidades em –1, limitado pelo círculo máximo de magia que você pode lançar.
  - site: aumenta as penalidades em –1 (penalidade máxima limitada pelo círculo máximo de magia que você pode lançar).
- **description**
  - nosso: Todos os seus aliados no alcance recebem +2 em testes de perícia e rolagens de dano, e todos os seus inimigos no alcance sofrem –2 em testes de perícia e rolagens de dano. Esses bônus e penalidades são cumulativos com outras magias.
  - site: Você e os seus aliados no alcance recebem +2 em testes de perícia e rolagens de dano, e todos os seus inimigos no alcance sofrem –2 em testes de perícia e rolagens de dano. Esse efeito é cumulativo com outras magias. Componente material: T$ 20 por PM gasto em incensos ou outras oferendas.

### Pele de Pedra
- **enhancements[1]**
  - nosso: muda a duração para 1 dia.
  - site: muda a duração para um dia.
- **enhancements[2]**
  - nosso: sua pele ganha aspecto e dureza do aço. Você recebe resistência a dano 10. Requer 4º círculo.
  - site: sua pele ganha aspecto e dureza de aço. Você recebe redução de dano 10. Requer 4º círculo.
- **enhancements[3]**
  - nosso: muda o alcance para toque, o alvo para 1 criatura, a duração para 1d4 rodadas e adiciona Resistência: Fortitude anula. Em vez do efeito normal, a magia transforma o alvo e seu equipamento em uma estátua inerte e sem consciência. A estátua possui os mesmos PV da criatura e resistência a dano 8; se for quebrada, a criatura morrerá. Requer 4º círculo.
  - site: muda o alcance para toque, o alvo para 1 criatura, a duração para 1d4rodadas e adiciona Resistência: Fortitude anula. Em vez do efeito normal, a magia transforma o alvo e seu equipamento em uma estátua inerte e sem consciência. A estátua possui os mesmos PV da criatura e redução de dano 8 se for quebrada, a criatura morrerá. Requer 4º círculo.
- **description**
  - nosso: Sua pele ganha aspecto e dureza de rocha. Você recebe resistência a dano 5.
  - site: Sua pele ganha aspecto e dureza de rocha. Você recebe redução de dano 5.

### Poeira da Podridão
- **enhancements[0]**
  - nosso: aumenta o dano em 1d8+4.
  - site: aumenta o dano em +1d8+4.
- **description**
  - nosso: Você manifesta uma nuvem de poeira carregada de energia negativa, que apodrece lentamente as criaturas na área. Ao lançar a magia, e no início de seus turnos, criaturas na área sofrem 2d8+8 pontos de dano de trevas (Fortitude reduz à metade). Alvos que falharem no teste ficam imunes a magias de cura por uma rodada.
  - site: Você manifesta uma nuvem de poeira carregada de energia negativa, que apodrece lentamente as criaturas na área. Ao lançar a magia, e no início de seus turnos, criaturas na área sofrem 2d8+8 pontos de dano de trevas (Fortitude reduz à metade). Alvos que falharem no teste não podem recuperar PV por uma rodada.

### Possessão
- **enhancements[2]**
  - nosso: muda a duração para permanente, mas destrói seu corpo original no processo. Uma criatura possuída pode fazer um teste de Vontade no começo do dia para retomar seu corpo. Se passar, recobra a consciência (e a sua própria consciência fica inerte). O teste se repete no início de cada dia. Se o corpo de uma criatura possuída morrer e houver outra criatura em alcance curto, você pode tentar possuí-la como uma reação. Enquanto houver novos corpos para possuir, você é imortal!
  - site: muda a duração para permanente, mas destrói seu corpo original no processo. Uma criatura possuída pode fazer um teste de Vontade no começo do dia para retomar seu corpo. Se passar, recobra a consciência (e a sua própria consciência fica inerte). O teste se repete no início de cada dia. Se o corpo de uma criatura possuída morrer e houver outra criatura em alcance curto, você pode tentar possuí-la. Enquanto houver novos corpos para possuir, você é imortal!
- **description**
  - nosso: Você projeta sua consciência no corpo do alvo. Enquanto possuir uma criatura, você assume o controle total do corpo dela. O seu próprio corpo fica inconsciente e a consciência do alvo fica inerte. Em termos de jogo, você continua usando a sua ficha, mas com os atributos físicos e deslocamento da criatura. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune a esta magia por um dia. Caso o corpo da criatura morra enquanto você a possui, a criatura morre e você deve fazer um teste de Vontade contra a CD da sua própria magia. Se passar, sua consciência retorna para o seu corpo (contanto que esteja dentro do alcance). Do contrário, você também morre. Retornar para o seu corpo voluntariamente é uma ação livre
  - site: Você projeta sua consciência no corpo do alvo. Enquanto possuir uma criatura, você assume o controle total do corpo dela. O seu próprio corpo fica inconsciente e a consciência do alvo fica inerte. Em termos de jogo, você continua usando a sua ficha, mas com os atributos físicos e deslocamento da criatura. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune a esta magia por um dia. Caso o corpo da criatura morra enquanto você a possui, a criatura morre e você deve fazer um teste de Vontade contra a CD da sua própria magia. Se passar, sua consciência retorna para o seu corpo (contanto que esteja dentro do alcance). Do contrário, você também morre. Retornar para o seu corpo voluntariamente é uma ação livre.

### Primor Atlético
- **enhancements[2]**
  - nosso: muda a execução para ação de movimento, o alcance para pessoal, o alvo para você e a duração para instantânea. Você salta muito alto e pousa em alcance corpo a corpo de uma criatura em alcance curto. Se fizer um ataque corpo a corpo contra essa criatura nesta rodada, recebe os benefícios e penalidades de uma investida e sua arma tem o dano aumentado em um dado do mesmo tipo durante este ataque.
  - site: muda a execução para ação de movimento, o alcance para pessoal, o alvo para você e a duração para instantânea. Você salta muito alto e pousa em alcance corpo a corpo de uma criatura em alcance curto. Se fizer um ataque corpo a corpo contra essa criatura neste turno, recebe os benefícios e penalidades de uma investida e sua arma causa um dado extra de dano do mesmo tipo durante este ataque.

### Profanar
- **enhancements[1]**
  - nosso: aumenta os bônus para mortos-vivos em +1.
  - site: aumenta os bônus para mortos-vivos em +1. (bônus máximo limitado pelo círculo máximo de magia que você pode lançar).
- **description**
  - nosso: Esta magia enche a área com energia negativa. Efeitos que causam dano de trevas ou canalizam energia negativa têm o dano dobrado dentro da área. Esta magia não pode ser lançada em uma área contendo um símbolo visível dedicado a uma divindade que não a sua. Profanar anula Consagrar.
  - site: Você enche a área com energia negativa. Dano de trevas é maximizado dentro da área. Isso também afeta PV curados em mortos-vivos por esses efeitos. Esta magia não pode ser lançada em uma área contendo um símbolo visível dedicado a uma divindade que não a sua. Profanar anula Consagrar.

### Projetar Consciência
- **description**
  - nosso: Esta magia faz com que sua consciência deixe seu corpo e se transporte instantaneamente para um local ou para perto de uma criatura alvo. Se escolher um local, ele precisa ser conhecido por você. Se escolher uma criatura, você transporta sua consciência até onde a criatura estiver, contanto que estejam no mesmo plano.

Você adquire uma forma fantasmagórica invisível, mas pode se mostrar usando uma ação de movimento. Pode se mover em qualquer direção com deslocamento de voo 18m e, por ser incorpóreo, é capaz de atravessar objetos sólidos, mas fica limitado a se mover dentro dos limites do local, ou dentro de alcance curto da criatura alvo. Você pode ver e ouvir como se estivesse presente no local e pode falar mentalmente com qualquer criatura que possa ver, contanto que tenham um idioma em comum.
  - site: Esta magia faz com que sua consciência deixe seu corpo e se transporte instantaneamente para um local ou para perto de uma criatura. Se escolher um local, ele precisa ser conhecido por você. Se escolher uma criatura, você transporta sua consciência até onde ela estiver, desde que esteja no mesmo plano.

Você adquire uma forma fantasmagórica invisível, mas pode se mostrar usando uma ação de movimento. Pode se mover em qualquer direção com deslocamento de voo 18m e, por ser incorpóreo, é capaz de atravessar objetos sólidos, mas fica limitado a se mover dentro dos limites do local, ou dentro de alcance curto da criatura alvo. Você pode ver e ouvir como se estivesse presente no local e pode falar mentalmente com qualquer criatura que possa ver, contanto que tenham um idioma em comum.

### Proteção Divina
- **enhancements[1]**
  - nosso: muda a execução para reação, o alcance para curto e a duração para 1 rodada.
  - site: muda a execução para reação, o alcance para curto e a duração para 1 rodada. Em vez do normal, o alvo recebe +5 no próximo teste de resistência que fizer (cumulativo com o efeito básico desta magia).
- **enhancements[2]**
  - nosso: muda o alvo para área de círculo com 3m de raio. Todos os aliados dentro do círculo recebem o bônus da magia. Requer 2º círculo.
  - site: muda o alvo para área de esfera com 3m de raio. Todos os aliados dentro do círculo recebem o bônus da. Requer 2º círculo.
- **enhancements[3]**
  - nosso: também torna o alvo imune a efeitos de encantamento. Requer 3º círculo.
  - site: torna o alvo imune a efeitos mentais e de medo. Requer 3º círculo.

### Purificação
- **enhancements[0]**
  - nosso: também cura todo o dano causado por venenos.
  - site: também recupera todos os PV perdidos por veneno.
- **description**
  - nosso: Seu toque purifica a criatura tocada. Esta magia remove uma das seguintes condições: abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, ofuscado, paralisado, pasmo ou surdo.
  - site: Você purifica a criatura tocada, removendo uma condição dela entre abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, ofuscado, paralisado, pasmo ou surdo. [decaído ou fedido (DB #219)]

### Raio do Enfraquecimento
- **enhancements[1]**
  - nosso: em vez do normal, se falhar na resistência o alvo fica inconsciente. Se passar, fica exausto. Requer 3º círculo.
  - site: como acima, mas muda o alvo para criaturas escolhidas. Requer 3º círculo.
- **description**
  - nosso: Você dispara um raio púrpura que drena as forças do alvo. Se falhar na resistência, o alvo fica fatigado. Se passar, fica vulnerável.

Truque: muda o alcance para toque e a resistência para Fortitude anula. Em vez do normal, ao tocar o alvo, sua mão emana um brilho púrpura. O alvo fica fatigado. Note que, como efeitos de magia não acumulam, lançar este truque duas vezes contra o mesmo alvo não irá deixá-lo exausto.
  - site: Você dispara um raio púrpura que drena as forças do alvo. Se falhar na resistência, o alvo fica fatigado. Se passar, fica vulnerável. Note que, como efeitos de magia não acumulam, lançar esta duas vezes contra o mesmo alvo não irá deixá-lo exausto.

Truque: muda o alcance para toque e a resistência para Fortitude anula. Em vez do normal, sua mão emana um brilho púrpura e, ao tocar o alvo, ele fica fatigado.

### Resistência a Energia
- **enhancements[0]**
  - nosso: aumenta a resistência em +5.
  - site: aumenta a redução de dano em +5.
- **enhancements[1]**
  - nosso: muda a duração para 1 dia. Requer 2º círculo.
  - site: muda a duração para um dia. Requer 2º círculo.
- **enhancements[3]**
  - nosso: muda o efeito para resistência a dano de todos os tipos de energia. Requer 3º círculo.
  - site: muda o efeito para redução de dano contra todos os tipos listados na. Requer 3º círculo.
- **enhancements[4]**
  - nosso: muda o efeito para imunidade a um tipo de dano de energia. Requer 4º círculo.
  - site: muda o efeito para imunidade a um tipo listado na magia. Requer 4º círculo.
- **description**
  - nosso: Ao lançar esta magia, escolha entre ácido, eletricidade, fogo, frio, luz ou trevas. O alvo recebe resistência 10 contra a energia escolhida, passando a ignorar os 10 primeiros pontos de dano de cada ataque feito com essa energia.
  - site: Ao lançar esta magia, escolha entre ácido, eletricidade, fogo, frio, luz ou trevas. O alvo recebe redução de dano 10 contra o tipo de dano escolhido.

### Rogar Maldição
- **description**
  - nosso: Você entoa cânticos maléficos que amaldiçoam uma vítima, criando efeitos variados. Ao lançar a magia, escolha entre os seguintes.

Debilidade: o alvo fica esmorecido e não pode se comunicar ou lançar magias. Ainda reconhece seus aliados e pode segui-los e ajudá-los, mas sempre de maneira simplória.

Doença: muda a duração para instantânea. O alvo contrai uma doença a sua escolha, que o afeta imediatamente (sem período de incubação).

Fraqueza: o alvo fica debilitado e lento.

Isolamento: o alvo perde o uso de um de seus cinco sentidos a sua escolha. Se perder a visão, fica cego. Se perder a audição, fica surdo. Se perder o olfato ou paladar, não pode usar a habilidade faro. Se perder o tato, fica caído e não pode se levantar.

Você também pode inventar sua própria maldição, usando esses exemplos como sugestões, mas o mestre tem a palavra final sobre o efeito.
  - site: Você entoa cânticos maléficos que amaldiçoam uma vítima, criando efeitos variados. Ao lançar a magia, escolha entre os seguintes.

Debilidade: o alvo fica esmorecido e não pode se comunicar ou lançar magias. Ainda reconhece seus aliados e pode segui-los e ajudá-los, mas sempre de maneira simplória.

Doença: muda a duração para instantânea. O alvo contrai uma doença a sua escolha, que o afeta imediatamente (sem período de incubação).

Fraqueza: o alvo fica debilitado e lento.

Isolamento: o alvo perde o uso de um de seus cinco sentidos a sua escolha. Se perder a visão, fica cego. Se perder a audição, fica surdo. Se perder o olfato ou paladar, não pode usar a habilidade faro. Se perder o tato, fica caído e não pode se levantar. Você também pode inventar sua própria maldição, usando esses exemplos como sugestões, mas o mestre tem a palavra final sobre o efeito.

### Roubar a Alma
- **description**
  - nosso: Você rouba a alma da vítima, armazenando-a em um objeto. Se o alvo passar no teste de resistência, sente o impacto de sua alma ser puxada para fora do corpo e fica pasmo por 1 rodada. Se falhar, seu corpo fica caído, inconsciente e inerte, enquanto sua alma é transportada para dentro do objeto. O corpo não envelhece nem se decompõe, permanecendo em estase. Ele pode ser atacado e destruído normalmente. O objeto escolhido deve custar T$ 1.000 por nível da criatura. Um objeto que não seja valioso o bastante se quebrará quando a magia for lançada (embora personagens não conheçam o conceito de “nível” dentro do mundo de jogo, podem ter noção do poder geral de uma criatura específica, estimando assim o valor do objeto). Se o objeto for destruído, a magia se esvai. Se o corpo ainda estiver disponível, a alma retorna para ele. Caso contrário, escapa para os Reinos dos Deuses.

Custo adicional: sacrifício de 1 PM.
  - site: Você rouba a alma da vítima, armazenando-a em um objeto. Se o alvo passar no teste de resistência, sente o impacto de sua alma ser puxada para fora do corpo e fica abalado por 1 rodada. Se falhar, seu corpo fica caído, inconsciente e inerte, enquanto sua alma é transportada para dentro do objeto. O corpo não envelhece nem se decompõe, permanecendo em estase. Ele pode ser atacado e destruído normalmente. O objeto escolhido deve custar T$ 1.000 por nível ou ND da criatura e não possuir uma alma presa ou se quebrará quando a magia for lançada (embora personagens não conheçam o conceito de “nível” dentro do mundo de jogo, podem ter noção do poder geral de uma criatura, estimando assim o valor do objeto). Se o objeto for destruído, a magia se esvai. Se o corpo ainda estiver disponível, a alma retorna para ele. Caso contrário, escapa para os Mundos dos Deuses. Custo adicional: sacrifício de 1 PM.

### Salto Dimensional
- **enhancements[2]**
  - nosso: muda a execução para reação. Em vez do normal, você salta para um espaço adjacente (1,5m), recebendo +5 na Defesa e em testes de Reflexos contra um ataque ou efeito que esteja prestes a atingi-lo.
  - site: muda a execução para reação. Em vez do normal, você recebe +5 na Defesa e em testes de Reflexos contra um ataque ou efeito que esteja prestes a atingi-lo. Após a resolução do efeito, salta para um espaço adjacente (1,5m).
- **description**
  - nosso: Esta magia transporta você para outro lugar dentro do alcance. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo simplesmente imaginá-lo. Por exemplo, pode se transportar 3m adiante para ultrapassar uma porta fechada. Uma vez transportadas, criaturas não podem agir até a rodada seguinte. Esta magia não permite que você apareça dentro de um corpo sólido; se o ponto de chegada não tem espaço livre, você ressurge na área vazia mais próxima.
  - site: Esta magia transporta você para outro lugar dentro do alcance. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo simplesmente imaginá-lo. Por exemplo, pode se transportar 3m adiante para ultrapassar uma porta fechada. Uma vez transportadas, criaturas não podem agir até a rodada seguinte. Esta magia não permite que você apareça dentro de um corpo sólido se o ponto de chegada não tem espaço livre, você ressurge na área vazia mais próxima.

### Santuário
- **enhancements[0]**
  - nosso: além do normal, escolha um tipo de criatura entre animal, construto ou morto-vivo. Você não pode ser percebido por criaturas do tipo escolhido, não importando o sentido usado.
  - site: além do normal, escolha um tipo de criatura entre animal, construto ou morto-vivo. Você não pode ser percebido por criaturas não inteligentes (Int –4 ou menor) do tipo escolhido.
- **enhancements[1]**
  - nosso: também protege o alvo contra efeitos de área. Uma criatura que tente atacar uma área que inclua o alvo deve fazer o teste de Vontade; se falhar, não consegue e perde a ação. Ela só pode tentar novamente se o alvo sair da área.
  - site: também protege o alvo contra efeitos de área. Uma criatura que tente atacar uma área que inclua o alvo deve fazer o teste de Vontade se falhar, não consegue e perde a ação. Ela só pode tentar novamente se o alvo sair da área.
- **description**
  - nosso: Qualquer criatura que tente fazer uma ação hostil contra o alvo deve fazer um teste de Vontade. Se falhar, não consegue, perde a ação e não pode tentar novamente até o fim da cena. Santuário não protege o alvo de efeitos de área. Além disso, o próprio alvo também não pode fazer ações hostis, ou a magia é dissipada — mas pode usar outras habilidades e magias de cura e suporte (como Curar Ferimentos, Bênção e assim por diante).
  - site: Qualquer criatura que tente fazer uma ação hostil contra o alvo deve fazer um teste de Vontade. Se falhar, não consegue, perde a ação e não pode tentar novamente até o fim da cena. Santuário não protege o alvo de efeitos de área. Além disso, o próprio alvo também não pode fazer ações hostis (incluindo forçar outras criaturas a atacá-lo), ou a magia é dissipada — mas pode usar habilidades e magias de cura e suporte, como Curar Ferimentos e Bênção.

### Segunda Chance
- **enhancements[2]**
  - nosso: muda o alvo para uma criatura que tenha morrido a até uma rodada. Esta magia pode curá-la.
  - site: muda o alvo para uma criatura que tenha morrido há até uma rodada. Esta magia pode curá-la.
- **description**
  - nosso: Um brilho alaranjado, na forma de asas de fênix, emana do alvo. Ele recupera 200 pontos de vida e se cura de qualquer das seguintes condições: abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, ofuscado, paralisado, pasmo ou surdo.
  - site: Um brilho de luz, na forma de asas de fênix, emana do alvo. Ele recupera 200 pontos de vida e se cura de qualquer das seguintes condições: abalado, apavorado, alquebrado, atordoado, cego, confuso, debilitado, enjoado, envenenado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, ofuscado, paralisado, pasmo ou surdo.

### Selo de Mana
- **enhancements[0]**
  - nosso: muda o alcance para curto e o alvo para criaturas dentro do alcance. Requer 4º círculo.
  - site: muda o alcance para curto e o alvo para criaturas escolhidas dentro do alcance. Requer 4º círculo.
- **description**
  - nosso: Seu toque manifesta um selo mágico na pele do alvo, que atrapalha o fluxo de mana. Pela duração da magia, sempre que o alvo realizar qualquer ação que gaste PM, deve fazer um teste de Vontade; se passar, faz a ação normalmente. Se falhar, a ação não tem efeito (mas os PM são gastos mesmo assim).
  - site: Seu toque manifesta um selo mágico na pele do alvo, que atrapalha o fluxo de mana. Pela duração da magia, sempre que o alvo realizar qualquer ação que gaste PM, deve fazer um teste de Vontade se passar, faz a ação normalmente. Se falhar, a ação não tem efeito (mas os PM são gastos mesmo assim).

### Semiplano
- **enhancements[0]**
  - nosso: adiciona alvo (1 criatura). Você cria uma semiplano labiríntico e expulsa o alvo para ele. A cada rodada, a vítima tem direito a um teste de Inteligência (CD 30), com bônus cumulativo de +1 para cada teste já realizado, para escapar do labirinto. Quando o alvo escapa, a magia termina e o alvo reaparece no plano material no mesmo local onde estava quando a magia foi lançada. Magias como Salto Dimensional e Teletransporte não ajudam a escapar do labirinto, mas Viagem Planar, sim.
  - site: adiciona alvo (1 criatura). Você cria uma semiplano labiríntico e expulsa o alvo para ele. A cada rodada, a vítima tem direito a um teste de Investigação ou Sobrevivência, com bônus cumulativo de +1 para cada teste já realizado, para escapar do labirinto. Quando o alvo escapa, a magia termina e o alvo reaparece no plano material no mesmo local onde estava quando a magia foi lançada. Magias como Salto Dimensional e Teletransporte não ajudam a escapar do labirinto, mas Viagem Planar, sim.
- **enhancements[1]**
  - nosso: muda a duração para permanente e adiciona componente material (diorama do semiplano feito de materiais preciosos no valor de T$ 5.000). Você pode lançar a magia diversas vezes para aumentar as dimensões do semiplano em +30m de lado a cada vez.
  - site: muda a duração para permanente e adiciona componente material (maquete do semiplano feita de materiais preciosos no valor de T$ 5.000). Você pode lançar a magia diversas vezes para aumentar as dimensões do semiplano em +30m de lado a cada vez.
- **description**
  - nosso: Você cria um semiplano — uma dimensão particular. Você pode entrar no semiplano gastando uma ação padrão e 1 PM, desaparecendo do plano material como se tivesse se teletransportado. Você pode levar criaturas voluntárias que esteja tocando, ao custo de 1 PM por criatura extra. Você também pode levar objetos que esteja tocando, ao custo de 1 PM por 200kg. Uma vez no semiplano, você pode gastar uma ação completa para voltar ao plano material, no mesmo local onde estava. Caso conheça a magia Viagem Planar, pode lançá-la para voltar ao plano material em outro local.

Você escolhe a forma e a aparência do semiplano — uma caverna, um asteroide que singra o éter, um palacete de cristal etc. Ele contém ar, luz e calor, mas além disso é vazio. Entretanto, você pode levar itens (mobília, ferramentas etc.) a cada viagem.
  - site: Você cria uma dimensão particular. Você pode entrar no semiplano gastando uma ação padrão e 10 PM, desaparecendo do plano material como se tivesse se teletransportado. Você pode levar criaturas voluntárias que esteja tocando, ao custo de 1 PM por criatura extra. Você também pode levar objetos que esteja tocando, ao custo de 1 PM por objeto Médio ou menor, 2 PM por objeto Grande, 5 PM por Enorme e 10 PM por Colossal. Uma vez no semiplano, pode gastar uma ação completa para voltar ao plano material, no mesmo local onde estava. Caso conheça a Viagem Planar, pode lançá-la para voltar ao plano material em outro local. Você escolhe a forma e a aparência do semiplano — uma caverna, um asteroide que singra o éter, um palacete de cristal etc. Ele contém ar, luz e calor, mas além disso é vazio. Entretanto, você pode levar itens (mobília, ferramentas etc.) a cada viagem.

### Servo Divino
- **enhancements[0]**
  - nosso: muda a duração para 1 dia ou até ser descarregada. O espírito realiza uma tarefa a sua escolha que exija até um dia, e aumenta o custo do pagamento para T$ 500. O resto segue normal.
  - site: muda a duração para um dia ou até ser descarregada. O espírito realiza uma tarefa a sua escolha que exija até um dia. O custo do pagamento aumenta para T$ 500. O resto segue normal.
- **description**
  - nosso: Você pede a sua divindade que envie um espírito para ajudá-lo. Esse espírito realiza uma tarefa a sua escolha que possa ser cumprida em até uma hora — desde algo simples como “use suas asas para nos levar até o topo da montanha” até algo complexo como “escolte esses camponeses até o castelo”. A magia é descarregada quando a criatura cumpre a tarefa, retornando a seu plano natal. O tipo de criatura é escolhido pelo mestre, de acordo com as necessidades da tarefa.

Componente material: um pagamento de T$ 100 ao espírito. A forma de pagamento varia — doações a um templo, um item mágico ou mesmo dinheiro.
  - site: Você pede a sua divindade que envie um espírito para ajudá-lo. Esse espírito realiza uma tarefa a sua escolha que possa ser cumprida em até uma hora — desde algo simples como “use suas asas para nos levar até o topo da montanha” até algo complexo como “escolte esses camponeses até o castelo”. A magia é descarregada quando a criatura cumpre a tarefa, retornando a seu plano natal. O tipo de criatura é escolhido pelo mestre, de acordo com as necessidades da tarefa. Componente material: um pagamento de T$ 100 ao espírito. A forma de pagamento varia — doações a um templo, um item mágico ou mesmo dinheiro.

### Servo Morto-Vivo
- **enhancements[0]**
  - nosso: muda o componente material para pó de ônix negro (T$ 500). Em vez de um zumbi ou esqueleto, cria um carniçal. Ele pode funcionar como um aliado veterano, escolhido entre ajudante, atirador, combatente, fortão ou guardião. O resto segue normal.
  - site: muda o componente material para pó de ônix negro (T$ 500). Em vez de um zumbi ou esqueleto, cria um carniçal. Ele pode funcionar como um parceiro veterano, escolhido entre ajudante, atirador, combatente, fortão ou guardião. O resto segue normal.
- **enhancements[1]**
  - nosso: muda o componente material para pó de ônix negro (T$ 500). Em vez de um zumbi ou esqueleto, cria uma sombra. Ela pode funcionar como um aliado veterano, escolhido entre assassino, combatente ou perseguidor. O restante da magia segue normal.
  - site: muda o componente material para pó de ônix negro (T$ 500). Em vez de um zumbi ou esqueleto, cria uma sombra. Ela pode funcionar como um parceiro veterano, escolhido entre assassino, combatente ou perseguidor. O restante da magia segue normal.
- **enhancements[2]**
  - nosso: muda o componente material para ferramentas de embalsamar (T$ 1.000). Em vez de um zumbi ou esqueleto, cria uma múmia. Ela pode funcionar como um aliado mestre, escolhido entre ajudante, destruidor, guardião ou médico. O restante da magia segue normal. Requer 4º círculo.
  - site: muda o componente material para ferramentas de embalsamar (T$ 1.000). Em vez de um zumbi ou esqueleto, cria uma múmia. Ela pode funcionar como um parceiro mestre, escolhido entre ajudante, destruidor, guardião ou médico. O restante da magia segue normal. Requer 4º círculo.
- **description**
  - nosso: Esta magia transforma o cadáver de um humanoide, animal ou monstro em um esqueleto ou zumbi (conforme o estado de conservação do corpo). O morto-vivo então obedece a todos os seus comandos, mesmo suicidas. Se quiser que o morto-vivo o acompanhe, ele funciona como um aliado iniciante, de um tipo a sua escolha entre ajudante, atirador, combatente, fortão, guardião ou montaria.

Se não quiser usar o morto-vivo como aliado, pode ordenar que ele proteja um local específico, atacando invasores (nesse caso, use as estatísticas de criaturas vistas na página Ameaças). O nível somado de mortos-vivos sob seu comando ao mesmo tempo não pode exceder o seu próprio nível +3, mas você só pode receber os benefícios de um deles como aliado por vez. Eles duram até serem destruídos (um morto-vivo destruído não pode ser reanimado).

Componente material: um ônix negro (T$ 100), inserido na boca ou olho do cadáver.
  - site: Esta magia transforma o cadáver de um humanoide, animal ou monstro em um esqueleto ou zumbi (conforme o estado de conservação do corpo). O morto-vivo então obedece a todos os seus comandos, mesmo suicidas. Se quiser que o morto-vivo o acompanhe, ele funciona como um parceiro iniciante, de um tipo a sua escolha entre ajudante, atirador, combatente, fortão, guardião ou montaria. Uma vez por rodada, quando sofre dano, você pode sacrificar um servo morto-vivo e evitar esse dano. O servo é destruído no processo e não pode ser reanimado Componente material: um ônix negro (T$ 100), inserido na boca ou olho do cadáver.

### Sonho
- **description**
  - nosso: Você entra nos sonhos de uma criatura. Uma vez lá, pode conversar com o alvo até que ele acorde. Se a criatura não estiver dormindo quando você lançar a magia, você pode permanecer em transe até que ela adormeça. Durante o transe você fica indefeso e sem consciência dos arredores. Você pode sair do transe quando quiser, mas a magia termina.
  - site: Você entra nos sonhos de uma criatura. Uma vez lá, pode conversar com ela até que ela acorde. Se o alvo não estiver dormindo quando você lançar a magia, você pode permanecer em transe até que ele adormeça. Durante o transe, você fica indefeso e sem consciência dos arredores. Você pode sair do transe quando quiser, mas magia a termina.

### Sopro da Salvação
- **enhancements[0]**
  - nosso: aumenta a quantidade de cura em 1d8+2.
  - site: aumenta a cura em +1d8+2.
- **description**
  - nosso: Você enche seus pulmões de energia positiva e sopra um cone de poeira reluzente. O sopro afeta apenas seus aliados na área, curando 2d8+4 pontos de vida e removendo uma das seguintes condições de todos os alvos: abalado, atordoado, apavorado, alquebrado, cego, confuso, debilitado, enjoado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, paralisado, pasmo e surdo.
  - site: Você enche seus pulmões de luz e energia positiva e sopra um cone de poeira reluzente. O sopro afeta apenas seus aliados na área, curando 2d8+4 pontos de vida e removendo uma das seguintes condições de todos os alvos: abalado, atordoado, apavorado, alquebrado, cego, confuso, debilitado, enfeitiçado, enjoado, esmorecido, exausto, fascinado, fatigado, fraco, frustrado, lento, paralisado, pasmo e surdo.

### Suporte Ambiental
- **description**
  - nosso: Esta magia garante a sobrevivência em ambientes hostis. O alvo fica imune aos efeitos de calor e frio extremos, pode respirar na água, se respirar ar (ou vice versa) e não sufoca em fumaça densa.
  - site: Esta magia facilita a sobrevivência em ambientes hostis. O alvo fica imune aos efeitos de calor e frio extremos, pode respirar na água se respirar ar (ou vice-versa) e não sufoca em fumaça densa. [O alvo também fica imune a arrefecido, congelado, eletrificado, eletrizado, em chamas e molhado. (DB #219)]

### Teia
- **description**
  - nosso: Teia cria várias camadas de fibras entrelaçadas e pegajosas na área. Qualquer criatura na área que falhar na resistência fica enredada. Uma vítima pode se libertar com uma ação padrão e um teste de Acrobacia ou Atletismo. A área ocupada por Teia é terreno difícil. A Teia é inflamável. Qualquer ataque que cause dano de fogo destrói as teias por onde passar, libertando as criaturas enredadas mas deixando-as em chamas (veja Condições, na página Combate).
  - site: Teia cria várias camadas de fibras entrelaçadas e pegajosas na área. Qualquer criatura na área que falhar na resistência fica enredada. Uma vítima pode se libertar com uma ação padrão e um teste de Acrobacia ou Atletismo. A área ocupada por Teia é terreno difícil. A Teia é inflamável. Qualquer ataque que cause dano de fogo destrói as teias por onde passar, libertando as criaturas enredadas mas deixando-as em chamas.

### Telecinesia
- **enhancements[0]**
  - nosso: aumenta o limite de peso em 100kg.
  - site: aumenta o tamanho máximo da criatura em uma categoria (para Grande, Enorme e Colossal) ou dobra a quantidade de espaços do objeto.
- **description**
  - nosso: Você move objetos ou criaturas se concentrando. Ao lançar a magia, escolha uma das opções a seguir.

Força Contínua: você move uma criatura ou objeto com até 200kg, a até 6m por rodada. Uma criatura pode anular o efeito sobre ela, ou sobre um objeto que possua, passando num teste de Vontade. O peso pode ser movido em qualquer direção dentro do alcance. Ele cai no chão se sair do alcance ou a magia terminar. Duração: sustentada.

Empurrão Violento: nesta versão a energia mágica é expelida de uma única vez e arremessa até 10 objetos, ou um peso total de 200kg, o que for menor. Os objetos devem estar a até 3m uns dos outros.

Objetos arremessados podem atingir criaturas em seu caminho, causando de 1 ponto de dano de impacto por 10kg (objetos macios, sem pontas ou sem fio) até 1d6 pontos de dano por 10kg (objetos duros, pontudos ou afiados). Criaturas atingidas têm direito a um teste de Reflexos para reduzir o dano à metade.

Criaturas dentro da capacidade de peso da magia podem ser arremessadas, mas têm direito a um teste de Vontade para evitar o efeito (em si mesmas ou em objetos que estejam segurando). Uma criatura arremessada contra uma superfície sólida sofre 1d6 pontos de dano de impacto para cada 3m que “voou” no deslocamento (incluindo outras criaturas; nesse caso, ambas sofrem o dano). Duração: instantânea.
  - site: Você move objetos ou criaturas se concentrando. Ao lançar a magia, escolha uma das opções a seguir.

Força Contínua: você move uma criatura Média ou menor, ou objeto de até 10 espaços, a até 6m por rodada. Uma criatura pode anular o efeito sobre ela, ou sobre um objeto que possua, passando num teste de Vontade. O alvo pode ser movido em qualquer direção dentro do alcance. Ele cai no chão se sair do alcance ou a magia terminar. Duração: sustentada

Empurrão Violento: nesta versão a energia mágica é expelida de uma única vez e arremessa até 10 objetos (no máximo 10 espaços). Os objetos devem estar a até 3m uns dos outros.

Objetos arremessados podem atingir criaturas em seu caminho, causando de 1 ponto de dano de impacto por espaço (objetos macios, sem pontas ou sem fio) até 1d6 pontos de dano por espaço (objetos duros, pontudos ou afiados). Criaturas atingidas têm direito a um teste de Reflexos para reduzir o dano à metade.

Criaturas Médias ou menores podem ser arremessadas, mas têm direito a um teste de Vontade para evitar o efeito (em si mesmas ou em objetos que estejam segurando). Uma criatura arremessada contra uma superfície sólida sofre 1d6 pontos de dano de impacto para cada 3m que “voou” no deslocamento (incluindo outras criaturas; nesse caso, ambas sofrem o dano). Duração: instantânea

### Teletransporte
- **description**
  - nosso: Esta magia transporta os alvos para um lugar a sua escolha a até 1.000km. Você precisa fazer um teste de Misticismo, com dificuldade que depende de seu conhecimento sobre o local de destino.

CD 20. Um lugar familiar, que você visita com frequência.

CD 30. Um lugar conhecido, que você já visitou pelo menos uma vez.

CD 40. Um lugar desconhecido, que você nunca visitou e só conhece a partir da descrição de outra pessoa que esteve lá.

Você não pode se teletransportar para um lugar que nunca visitou sem a descrição de alguém. Ou seja, não pode se transportar para a “sala de tesouro do rei” se nunca esteve nela nem falou com alguém que esteve.

Se passar no teste, os alvos chegam ao lugar desejado. Se falhar, os alvos surgem 1d10 x 10km afastados em qualquer direção (se o destino é uma cidade costeira, você pode surgir em alto-mar). Se falhar por 5 ou mais, você chega em um lugar parecido, mas errado. E se você rolar 1 natural no teste a magia falha, mas você gasta PM normalmente e fica atordoado por 1d4 rodadas.
  - site: Esta magia transporta os alvos para um lugar a sua escolha a até 1.000km. Você precisa fazer um teste de Misticismo, com dificuldade que depende de seu conhecimento sobre o local de destino. CD 20. Um lugar familiar, que você visita com frequência. CD 30. Um lugar conhecido, que você já visitou pelo menos uma vez. CD 40. Um lugar que você nunca visitou e só conhece a partir da descrição de outra pessoa que esteve lá. Você não pode se teletransportar para um lugar que nunca visitou sem a descrição de alguém. Ou seja, não pode se transportar para a “sala de tesouro do rei” se nunca esteve nela nem falou com alguém que esteve. Se passar no teste, os alvos chegam ao lugar desejado. Se falhar, os alvos surgem 1d10 x 10km afastados em qualquer direção (se o destino é uma cidade costeira, você pode surgir em alto-mar). Se falhar por 5 ou mais, você chega em um lugar parecido, mas errado. E se você rolar 1 natural no teste a magia falha (mas você gasta os PM) e fica atordoado por 1d4 rodadas.

### Tranca Arcana
- **enhancements[0]**
  - nosso: muda o alcance para curto e a duração para instantânea. Em vez do normal, a magia abre portas, baús e janelas trancadas, presas, barradas ou protegidas por outra Tranca Arcana (neste caso, o efeito é dissipado). Ela também afrouxa grilhões e solta correntes.
  - site: muda o alcance para curto e a duração para instantânea. Em vez do normal, a magia abre portas, baús e janelas trancadas, presas, barradas ou protegidas por Tranca Arcana (o efeito é dissipado) a sua escolha. Ela também afrouxa grilhões e solta correntes.
- **description**
  - nosso: Esta magia tranca uma porta ou outro item que possa ser aberto ou fechado (como um baú, caixa etc.), aumentando a CD de testes de Força ou Ladinagem para abri-lo em +10. Você pode abrir livremente sua própria tranca sem problemas.

Componente material: chave de bronze no valor de T$ 25.

Truque: muda o alcance para curto. Em vez do normal, pode abrir ou fechar um objeto de tamanho Médio ou menor, como uma porta ou baú. Não afeta objetos trancados.
  - site: Esta magia tranca uma porta ou outro item que possa ser aberto ou fechado (como um baú, caixa etc.), aumentando a CD de testes de Força ou Ladinagem para abri-lo em +10. Você pode abrir livremente sua própria tranca sem problemas. Componente material: chave de bronze no valor de T$ 25.

Truque: muda o alcance para curto. Em vez do normal, pode abrir ou fechar um objeto de tamanho Grande ou menor, como uma porta ou baú. Não afeta objetos trancados.

### Transformação de Guerra
- **enhancements[1]**
  - nosso: adiciona componente material (uma barra de adamante no valor de T$ 100). Sua forma de combate ganha um aspecto metálico e sem expressões. Você recebe resistência a dano 15/adamante e imunidade a atordoamento, dano não letal, doenças, encantamento, fadiga, paralisia, necromancia, sangramento, sono, veneno e não precisa respirar.
  - site: adiciona componente material (barra de adamante no valor de T$ 100). Sua forma de combate ganha um aspecto metálico e sem expressões. Além do normal, você recebe redução de dano 10 e imunidade a atordoamento e efeitos de cansaço, encantamento, metabolismo, trevas e veneno, e não precisa respirar.

### Viagem Arbórea
- **description**
  - nosso: Como parte da execução, você entra em uma árvore adjacente que seja maior do que você. Você pode permanecer dentro da árvore, percebendo os arredores de forma normal (mas sem poder fazer ações). Você pode gastar uma ação de movimento para sair da mesma árvore, ou de qualquer outra dentro de 1km. Se estiver dentro de uma árvore que seja destruída, a magia termina e você sofre 10d6 pontos de dano de impacto. Enquanto a magia durar você pode gastar ações de movimento para entrar em outras árvores.
  - site: Como parte da execução, você entra em uma árvore adjacente que seja maior do que você. Você pode permanecer dentro da árvore, percebendo os arredores de forma normal (mas sem poder fazer ações). Você pode gastar uma ação de movimento para sair dessa árvore, ou de qualquer outra dentro de 1km. Se estiver dentro de uma árvore que seja destruída, a magia termina e você sofre 10d6 pontos de dano de impacto. Enquanto a magia durar você pode gastar uma ação de movimento e 1 PM para entrar em outras árvores.

### Viagem Planar
- **description**
  - nosso: Você viaja instantaneamente para outro plano da Criação. Lá, você chega de 10 a 1.000km do destino pretendido (role 1d100 e multiplique por 10km).

Componente material: um bastão de metal precioso em forma de forquilha (no valor de T$ 1.000). O tipo de metal determina para qual plano de existência você será enviado. Os metais que levam a dimensões específicas podem ser difíceis de encontrar, de acordo com o mestre.
  - site: Você viaja instantaneamente para outro plano da Criação. Lá, você chega de 10 a 1.000km do destino pretendido (role 1d100 e multiplique por 10km). Componente material: um bastão de metal precioso em forma de forquilha (no valor de T$ 1.000). O tipo de metal determina para qual plano de existência você será enviado. Os metais que levam a dimensões específicas podem ser difíceis de encontrar, de acordo com o mestre.

### Vidência
- **description**
  - nosso: Através de uma superfície reflexiva (bacia de água benta para clérigos, lago para druidas, bola de cristal para magos, espelho para feiticeiros etc.) você pode ver e ouvir uma criatura escolhida e seus arredores (cerca de 6m em qualquer direção), mesmo que ela se mova. O alvo pode estar a qualquer distância, mas se passar em um teste de Vontade, a magia falha. A vítima recebe bônus ou penalidades em seu teste de resistência, dependendo do conhecimento que você tiver dela.

- Não conhece o alvo: +10.
- Ouviu falar do alvo: +5.
- O alvo está em outro plano ou mundo: +5.
- Já encontrou o alvo pessoalmente: +0.
- Tem uma pintura, escultura ou outra representação do alvo: –2.
- Conhece bem o alvo: –5.
- Tem um pertence pessoal ou peça de roupa do alvo: –5.
- Tem uma parte do corpo do alvo (unhas, cabelos...): –10.
  - site: Através de uma superfície reflexiva (bacia de água benta para clérigos, lago para druidas, bola de cristal para magos, espelho para feiticeiros etc.) você pode ver e ouvir uma criatura escolhida e seus arredores (cerca de 6m em qualquer direção), mesmo que ela se mova. O alvo pode estar a qualquer distância, mas se passar em um teste de Vontade, a magia falha. A vítima recebe bônus ou penalidades em seu teste de resistência, dependendo do conhecimento que você tiver dela.

• Não conhece o alvo: +10.

• Ouviu falar do alvo: +5.

• O alvo está em outro plano ou mundo: +5.

• Já encontrou o alvo pessoalmente: +0.

• Tem uma pintura, escultura ou outra representação do alvo: –2.

• Conhece bem o alvo: –5.

• Tem um pertence pessoal ou peça de roupa do alvo: –5.

• Tem uma parte do corpo do alvo (unhas, cabelos...): –10.

### Visão Mística
- **enhancements[1]**
  - nosso: muda a duração para 1 dia.
  - site: muda a duração para um dia.

### Visão da Verdade
- **enhancements[1]**
  - nosso: além do normal, o alvo fica com sentidos apurados; ele recebe +10 em todos os testes de Percepção.
  - site: além do normal, o alvo fica com sentidos apurados ele recebe +10 em todos os testes de Percepção.
- **enhancements[2]**
  - nosso: além do normal, o alvo escuta falsidades; ele recebe +10 em todos os testes de Intuição.
  - site: além do normal, o alvo escuta falsidades ele recebe +10 em todos os testes de Intuição.
- **description**
  - nosso: Você enxerga a forma real das coisas. Você pode ver através de camuflagem (normal e total), escuridão (normal e mágica) e efeitos de ilusão e transmutação (enxergando a verdade como formas translúcidas ou sobrepostas).
  - site: Você enxerga a forma real das coisas. Você pode ver através de camuflagem e escuridão (normais e mágicas), assim como efeitos de ilusão e transmutação (enxergando a verdade como formas translúcidas ou sobrepostas).

### Vitalidade Fantasma
- **enhancements[0]**
  - nosso: aumenta os PV temporários recebidos em +1d8.
  - site: aumenta os PV temporários recebidos em +1d10. Caso a magia cause dano, em vez disso aumenta o dano causado em +1d10.
- **enhancements[1]**
  - nosso: muda o alvo para área: esfera com 6m de raio centrada em você e a resistência para Fortitude reduz à metade. Em vez do normal, você suga energia das criaturas vivas na área, causando 1d8 pontos de dano de trevas e recebendo PV temporários iguais ao dano total causado. Os PV temporários desaparecem ao final da cena. Requer 2º círculo.
  - site: muda o alvo para Área: esfera com 6m de raio centrada em você e a resistência para Fortitude reduz à metade. Em vez do normal, você suga energia das criaturas vivas na área, causando 1d10 pontos de dano de trevas e recebendo PV temporários iguais ao dano total causado. Os PV temporários desaparecem ao final da cena. Requer 2º círculo.
- **description**
  - nosso: Você suga energia vital da terra, recebendo 2d8 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.
  - site: Você suga energia vital da terra, recebendo 2d10 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.

### Voo
- **enhancements[1]**
  - nosso: muda a duração para 1 dia. Requer 4º círculo.
  - site: muda a duração para um dia. Requer 4º círculo.

### Voz Divina
- **enhancements[0]**
  - nosso: você concede um pouco de vida a um cadáver, suficiente para que ele responda a suas perguntas. O conhecimento do corpo é limitado ao que ele tinha enquanto vivo e suas respostas são curtas e enigmáticas. Um corpo só pode ser alvo desta magia uma vez. Ela também não funciona em um corpo cuja cabeça tenha sido destruída.
  - site: você concede um pouco de vida a um cadáver, suficiente para que ele responda a suas perguntas. O conhecimento do corpo é limitado ao que ele tinha enquanto vivo e suas respostas são curtas e enigmáticas. Um corpo só pode ser alvo desta uma vez. Ela também não funciona em um corpo cuja cabeça tenha sido destruída.
- **enhancements[1]**
  - nosso: você pode falar com plantas (normais ou monstruosas) e rochas. Plantas e rochas têm percepção limitada de seus arredores e normalmente fornecem respostas simplórias.
  - site: você pode falar com plantas (normais ou monstruosas) e rochas. Plantas e rochas têm percepção limitada de seus arredores e normalmente fornecem respostas simplórias.-----

### Âncora Dimensional
- **enhancements[0]**
  - nosso: muda o alcance para médio, a área para círculo de 3m de raio e o alvo para criaturas escolhidas.
  - site: muda o alcance para médio, a área para esfera com 3m de raio e o alvo para criaturas escolhidas.
- **enhancements[1]**
  - nosso: muda o efeito para criar um fio de energia cor de esmeralda que prende o alvo a um ponto no espaço dentro do alcance. O ponto precisa ser fixo, mas não precisa de nenhum apoio ou superfície (pode simplesmente flutuar no ar). O alvo não pode se afastar mais de 3m do ponto, nem fisicamente, nem com movimento planar. O fio possui 20 PV e resistência a dano 30 (mas pode ser dissipado por efeitos que libertam criaturas, como o Julgamento da Liberdade do Paladino).
  - site: muda o efeito para criar um fio de energia cor de esmeralda que prende o alvo a um ponto no espaço dentro do alcance. O ponto precisa ser fixo, mas não precisa de nenhum apoio ou superfície (pode simplesmente flutuar no ar). O alvo não pode se afastar mais de 3m do ponto, nem fisicamente, nem com movimento planar. O fio possui 20 PV e redução de dano 20 (mas pode ser dissipado por efeitos que libertam criaturas, como o Julgamento Divino: Libertação do paladino).
- **enhancements[2]**
  - nosso: como acima, mas em vez de um fio, cria uma corrente de energia, com 20 PV e resistência a dano 40.
  - site: como acima, mas em vez de um fio, cria uma corrente de energia, com 20 PV e redução de dano 40.
- **enhancements[3]**
  - nosso: muda o alvo para área de cubo de 9m, a duração para permanente e adiciona componente material (chave de esmeralda no valor de T$ 2.000). Em vez do normal, nenhum tipo de movimento planar pode entrar ou sair da área.
  - site: muda o alvo para área de cubo de 9m, a duração para permanente e adiciona componente material (chave de esmeralda no valor de T$ 2.000). Em vez do normal, nenhum tipo de movimento planar pode ser feito para entrar ou sair da área.
- **enhancements[4]**
  - nosso: muda o alcance para médio, a área para círculo de 3m de raio e o alvo para criaturas escolhidas. Cria um fio de energia (veja acima) que prende todos os alvos ao centro da área.
  - site: muda o alcance para médio, a área para esfera com 3m de raio e o alvo para criaturas escolhidas. Cria um fio de energia (veja acima) que prende todos os alvos ao centro da área.
- **description**
  - nosso: O alvo é envolvido por um campo de força cor de esmeralda que impede qualquer movimento planar. Isso inclui todas as magias de convocação (como Salto Dimensional e Teletransporte), viagens astrais e a habilidade incorpóreo.
  - site: O alvo é envolvido por um campo de força cor de esmeralda que impede qualquer movimento planar. Isso inclui magias de convocação (como Salto Dimensional e Teletransporte), viagens astrais e a habilidade incorpóreo.
