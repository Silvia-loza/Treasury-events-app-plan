export type CostCategory = 'menu' | 'music' | 'decoration' | 'other';
export type TreasuryDirection = 'in' | 'out';

export interface Participant {
  id: string;
  name: string;
  notes?: string;
  active: boolean;
}

export interface ParticipantPayment {
  id: string;
  participantId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface CostItem {
  id: string;
  label: string;
  category: CostCategory;
  totalCost: number;
  notes?: string;
}

export interface TreasuryEntry {
  id: string;
  label: string;
  amount: number;
  direction: TreasuryDirection;
  date: string;
  notes?: string;
}

export interface EventModel {
  id: string;
  name: string;
  date: string;
  treasurer: string;
  description?: string;
  participants: Participant[];
  payments: ParticipantPayment[];
  costs: CostItem[];
  treasuryEntries: TreasuryEntry[];
  createdAt: string;
  updatedAt: string;
}
