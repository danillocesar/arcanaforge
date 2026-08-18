import type { RPGSystem } from './character';

export interface PartyMember {
  uid: string;
  email: string;
  characterIds: string[];
  joinedAt: string;
}

export interface SessionResponse {
  uid: string;
  vote: 'sim' | 'nao';
  respondedAt: string;
}

export interface SessionProposal {
  id: string;
  proposedBy: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm' ou ''
  createdAt: string;
  responses: SessionResponse[];
}

export interface Party {
  id: string;
  name: string;
  system: RPGSystem;
  inviteCode: string;
  ownerUid: string;
  ownerEmail: string;
  members: PartyMember[];
  sessionProposals: SessionProposal[];
}
