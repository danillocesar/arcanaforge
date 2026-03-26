export interface ClasseDef {
  id: string;
  nome: string;
  icone: string;
}

export const CLASSES_TORMENTA: ClasseDef[] = [
  { id: 'arcanista', nome: 'Arcanista', icone: 'arcanista.svg' },
  { id: 'barbaro', nome: 'Bárbaro', icone: 'barbaro.svg' },
  { id: 'bardo', nome: 'Bardo', icone: 'bardo.svg' },
  { id: 'bucaneiro', nome: 'Bucaneiro', icone: 'bucaneiro.svg' },
  { id: 'cacador', nome: 'Caçador', icone: 'cacador.svg' },
  { id: 'cavaleiro', nome: 'Cavaleiro', icone: 'cavaleiro.svg' },
  { id: 'clerigo', nome: 'Clérigo', icone: 'clerigo.svg' },
  { id: 'druida', nome: 'Druida', icone: 'druida.svg' },
  { id: 'guerreiro', nome: 'Guerreiro', icone: 'guerreiro.svg' },
  { id: 'inventor', nome: 'Inventor', icone: 'inventor.svg' },
  { id: 'ladino', nome: 'Ladino', icone: 'ladino.svg' },
  { id: 'lutador', nome: 'Lutador', icone: 'lutador.svg' },
  { id: 'nobre', nome: 'Nobre', icone: 'nobre.svg' },
  { id: 'paladino', nome: 'Paladino', icone: 'paladino.svg' },
  { id: 'onimusha', nome: 'Onimusha', icone: 'onimusha.png' },
  { id: 'shugenja', nome: 'Shugenja', icone: 'shugenja.png' },
];

const classeMap = new Map(
  CLASSES_TORMENTA.map((c) => [c.nome.toLowerCase(), c]),
);

export function getClasseIconUrl(nomeClasse: string): string {
  if (!nomeClasse) return '';
  const def = classeMap.get(nomeClasse.toLowerCase());
  return def ? `/assets/classes/${def.icone}` : '';
}
