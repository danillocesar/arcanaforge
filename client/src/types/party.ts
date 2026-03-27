import type { RPGSystem } from './character';

export interface PartyMember {
  uid: string;
  email: string;
  characterIds: string[];
  joinedAt: string;
}

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  inviteCode: string;
  ownerUid: string;
  ownerEmail: string;
  members: PartyMember[];
}
