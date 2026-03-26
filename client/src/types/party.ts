import type { RPGSystem } from './character';

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  members: string[];
}
