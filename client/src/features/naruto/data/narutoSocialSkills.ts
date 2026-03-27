import type { NarutoAttributeId } from '../../../types/narutoCharacter';

export type SocialBase = 'carisma' | 'manipulacao';

export interface NarutoSocialSkillConfig {
  id: string;
  name: string;
  base: SocialBase;
  halfSkillId?: string;          // id from narutoSkills to use floor(total/2)
  halfAttributeId?: NarutoAttributeId;  // or raw attribute to use floor(value/2)
}

export const NARUTO_SOCIAL_SKILLS: NarutoSocialSkillConfig[] = [
  { id: 'atuacao',          name: 'Atuação',             base: 'carisma',     halfSkillId: 'arte' },
  { id: 'barganhar',        name: 'Barganhar',           base: 'carisma',     halfAttributeId: 'per' },
  { id: 'obterInformacao',  name: 'Obter Informações',   base: 'carisma',     halfAttributeId: 'int' },
  { id: 'intimidar',        name: 'Intimidar',           base: 'manipulacao', halfAttributeId: 'per' },
  { id: 'blefar',           name: 'Blefar',              base: 'manipulacao', halfAttributeId: 'int' },
  { id: 'mudarAtitude',     name: 'Mudar Atitude',       base: 'manipulacao', halfAttributeId: 'per' },
];
