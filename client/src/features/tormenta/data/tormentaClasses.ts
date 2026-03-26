export interface ClassDef {
  id: string;
  name: string;
  icon: string;
}

export const TORMENTA_CLASSES: ClassDef[] = [
  { id: 'arcanista', name: 'Arcanista', icon: 'arcanista.svg' },
  { id: 'barbaro', name: 'Bárbaro', icon: 'barbaro.svg' },
  { id: 'bardo', name: 'Bardo', icon: 'bardo.svg' },
  { id: 'bucaneiro', name: 'Bucaneiro', icon: 'bucaneiro.svg' },
  { id: 'cacador', name: 'Caçador', icon: 'cacador.svg' },
  { id: 'cavaleiro', name: 'Cavaleiro', icon: 'cavaleiro.svg' },
  { id: 'clerigo', name: 'Clérigo', icon: 'clerigo.svg' },
  { id: 'druida', name: 'Druida', icon: 'druida.svg' },
  { id: 'guerreiro', name: 'Guerreiro', icon: 'guerreiro.svg' },
  { id: 'inventor', name: 'Inventor', icon: 'inventor.svg' },
  { id: 'ladino', name: 'Ladino', icon: 'ladino.svg' },
  { id: 'lutador', name: 'Lutador', icon: 'lutador.svg' },
  { id: 'nobre', name: 'Nobre', icon: 'nobre.svg' },
  { id: 'paladino', name: 'Paladino', icon: 'paladino.svg' },
  { id: 'onimusha', name: 'Onimusha', icon: 'onimusha.png' },
  { id: 'shugenja', name: 'Shugenja', icon: 'shugenja.png' },
];

const classMap = new Map(
  TORMENTA_CLASSES.map((c) => [c.name.toLowerCase(), c]),
);

export function getClassIconUrl(className: string): string {
  if (!className) return '';
  const def = classMap.get(className.toLowerCase());
  return def ? `/assets/classes/${def.icon}` : '';
}
