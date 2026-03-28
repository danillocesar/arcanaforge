import { apiFetch, assertOk } from './http';

export interface NarutoClanOption {
  id: string;
  name: string;
  icon: string;
  system: string;
  active: boolean;
}

export async function apiFetchNarutoClans(): Promise<NarutoClanOption[]> {
  const res = await apiFetch('/api/naruto/clans');
  await assertOk(res);
  return res.json();
}

export interface NarutoTechTemplateOption {
  id: string;
  name: string;
  unlockLevel: number;
  category: string;
  action: string;
  range: string;
  baseDamage: string;
  duration: string;
  target: string;
  chakraCost: string;
  description: string;
  evolutions: string;
  availableFor: string[];
  dealsDamage: boolean;
  source: string;
  sourceDetail: string;
}

export async function apiFetchNarutoTechTemplates(): Promise<NarutoTechTemplateOption[]> {
  const res = await apiFetch('/api/naruto/technique-templates');
  await assertOk(res);
  return res.json();
}
