import { useState } from 'react';
import { useCharacterContextOptional } from '../contexts/CharacterContext';
import { isSectionKeyActive, SECTION_ID_LEGACY_PT } from '../data/constants';

/**
 * Estado aberto/fechado de uma seção colapsável. Com personagem em contexto o
 * estado mora em `character.collapsedSections` — persiste por personagem e
 * sobrevive ao reload; fora dele (ex.: preview sem ficha) cai pra estado local.
 */
export function useCollapsedSection(
  id: string,
  defaultCollapsed = false,
): [boolean, () => void] {
  const charCtx = useCharacterContextOptional();
  const isControlled = charCtx?.character != null;

  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);

  const collapsed = isControlled
    ? isSectionKeyActive(charCtx!.character!.collapsedSections, id)
    : localCollapsed;

  const toggle = () => {
    if (!isControlled) {
      setLocalCollapsed((c) => !c);
      return;
    }
    charCtx!.updateCharacter((f) => {
      const was = isSectionKeyActive(f.collapsedSections, id);
      const next = { ...f.collapsedSections };
      // Remove a chave equivalente em PT antes de gravar a nova, pra não sobrar
      // duas fontes de verdade pro mesmo id depois da migração de nomes.
      Object.entries(SECTION_ID_LEGACY_PT).forEach(([pt, en]) => {
        if (en === id) delete next[pt];
      });
      next[id] = !was;
      return { ...f, collapsedSections: next };
    });
  };

  return [collapsed, toggle];
}
