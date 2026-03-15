import { Injectable, computed, signal } from '@angular/core';
import { EventModel, Participant, ParticipantPayment, CostItem, TreasuryEntry } from '../models';

const STORAGE_KEY = 'party-treasury-events-v1';

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sampleEvent(): EventModel {
  const participants: Participant[] = [
    'Claudia', 'María', 'Yesmi', 'Nandi', 'Tamara', 'Antonio', 'Xandru', 'Suárez'
  ].map((name) => ({ id: uid('p'), name, active: true }));

  const payments: ParticipantPayment[] = participants.slice(0, 7).map((participant) => ({
    id: uid('pay'),
    participantId: participant.id,
    amount: 15,
    date: today(),
    note: 'Pago inicial'
  }));

  const costs: CostItem[] = [
    { id: uid('cost'), label: 'Menú', category: 'menu', totalCost: 40 * participants.length, notes: '40 € por persona' },
    { id: uid('cost'), label: 'DJ / Música', category: 'music', totalCost: 0, notes: '' },
    { id: uid('cost'), label: 'Decoración', category: 'decoration', totalCost: 0, notes: '' },
    { id: uid('cost'), label: 'Otros', category: 'other', totalCost: 0, notes: '' }
  ];

  const treasuryEntries: TreasuryEntry[] = [
    { id: uid('treasury'), label: 'Depósito restaurante', amount: 200, direction: 'out', date: today(), notes: 'Sale de la caja del evento' }
  ];

  const now = new Date().toISOString();
  return {
    id: uid('event'),
    name: 'Cumple 25 de abril',
    date: today(),
    treasurer: 'Silvia',
    description: 'Evento de ejemplo para que empieces a tocar la app.',
    participants,
    payments,
    costs,
    treasuryEntries,
    createdAt: now,
    updatedAt: now
  };
}

@Injectable({ providedIn: 'root' })
export class AppStoreService {
  readonly events = signal<EventModel[]>(this.load());

  readonly eventsSorted = computed(() =>
    [...this.events()].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  );

  createEvent(payload: { name: string; date: string; treasurer: string; description?: string }): EventModel {
    const now = new Date().toISOString();
    const event: EventModel = {
      id: uid('event'),
      name: payload.name.trim(),
      date: payload.date,
      treasurer: payload.treasurer.trim(),
      description: payload.description?.trim() || '',
      participants: [],
      payments: [],
      costs: [
        { id: uid('cost'), label: 'Menú', category: 'menu', totalCost: 0, notes: '' },
        { id: uid('cost'), label: 'DJ / Música', category: 'music', totalCost: 0, notes: '' },
        { id: uid('cost'), label: 'Decoración', category: 'decoration', totalCost: 0, notes: '' },
        { id: uid('cost'), label: 'Otros', category: 'other', totalCost: 0, notes: '' }
      ],
      treasuryEntries: [],
      createdAt: now,
      updatedAt: now
    };

    this.events.update((events) => [...events, event]);
    this.persist();
    return event;
  }

  updateEventMeta(eventId: string, patch: Partial<Pick<EventModel, 'name' | 'date' | 'treasurer' | 'description'>>): void {
    this.patchEvent(eventId, (event) => ({ ...event, ...patch, updatedAt: new Date().toISOString() }));
  }

  removeEvent(eventId: string): void {
    this.events.update((events) => events.filter((event) => event.id !== eventId));
    this.persist();
  }

  getEventById(eventId: string): EventModel | undefined {
    return this.events().find((event) => event.id === eventId);
  }

  addParticipant(eventId: string, name: string, notes = ''): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.patchEvent(eventId, (event) => ({
      ...event,
      participants: [...event.participants, { id: uid('p'), name: trimmed, notes: notes.trim(), active: true }],
      updatedAt: new Date().toISOString()
    }));
  }

  removeParticipant(eventId: string, participantId: string): void {
    this.patchEvent(eventId, (event) => ({
      ...event,
      participants: event.participants.filter((participant) => participant.id !== participantId),
      payments: event.payments.filter((payment) => payment.participantId !== participantId),
      updatedAt: new Date().toISOString()
    }));
  }

  addPayment(eventId: string, participantId: string, amount: number, note = ''): void {
    if (!amount || amount <= 0) return;
    this.patchEvent(eventId, (event) => ({
      ...event,
      payments: [
        ...event.payments,
        { id: uid('pay'), participantId, amount: round2(amount), date: today(), note: note.trim() }
      ],
      updatedAt: new Date().toISOString()
    }));
  }

  removePayment(eventId: string, paymentId: string): void {
    this.patchEvent(eventId, (event) => ({
      ...event,
      payments: event.payments.filter((payment) => payment.id !== paymentId),
      updatedAt: new Date().toISOString()
    }));
  }

  upsertCost(eventId: string, payload: Partial<CostItem> & Pick<CostItem, 'label' | 'category' | 'totalCost'>): void {
    this.patchEvent(eventId, (event) => {
      const existing = payload.id ? event.costs.find((cost) => cost.id === payload.id) : undefined;
      const nextItem: CostItem = existing
        ? { ...existing, ...payload, totalCost: round2(Number(payload.totalCost || 0)) }
        : {
            id: uid('cost'),
            label: payload.label.trim(),
            category: payload.category,
            totalCost: round2(Number(payload.totalCost || 0)),
            notes: payload.notes?.trim() || ''
          };

      const costs = existing
        ? event.costs.map((cost) => (cost.id === existing.id ? nextItem : cost))
        : [...event.costs, nextItem];

      return { ...event, costs, updatedAt: new Date().toISOString() };
    });
  }

  removeCost(eventId: string, costId: string): void {
    this.patchEvent(eventId, (event) => ({
      ...event,
      costs: event.costs.filter((cost) => cost.id !== costId),
      updatedAt: new Date().toISOString()
    }));
  }

  addTreasuryEntry(eventId: string, payload: { label: string; amount: number; direction: 'in' | 'out'; note?: string }): void {
    if (!payload.amount || payload.amount <= 0) return;
    this.patchEvent(eventId, (event) => ({
      ...event,
      treasuryEntries: [
        ...event.treasuryEntries,
        {
          id: uid('treasury'),
          label: payload.label.trim(),
          amount: round2(payload.amount),
          direction: payload.direction,
          date: today(),
          notes: payload.note?.trim() || ''
        }
      ],
      updatedAt: new Date().toISOString()
    }));
  }

  removeTreasuryEntry(eventId: string, entryId: string): void {
    this.patchEvent(eventId, (event) => ({
      ...event,
      treasuryEntries: event.treasuryEntries.filter((entry) => entry.id !== entryId),
      updatedAt: new Date().toISOString()
    }));
  }

  activeParticipantsCount(event: EventModel): number {
    return event.participants.filter((participant) => participant.active).length;
  }

  totalEventCost(event: EventModel): number {
    return round2(event.costs.reduce((sum, cost) => sum + Number(cost.totalCost || 0), 0));
  }

  totalCollected(event: EventModel): number {
    return round2(event.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  }

  totalOutgoing(event: EventModel): number {
    return round2(
      event.treasuryEntries
        .filter((entry) => entry.direction === 'out')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    );
  }

  totalIncomingExtra(event: EventModel): number {
    return round2(
      event.treasuryEntries
        .filter((entry) => entry.direction === 'in')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    );
  }

  totalCashIn(event: EventModel): number {
    return round2(this.totalCollected(event) + this.totalIncomingExtra(event));
  }

  balance(event: EventModel): number {
    return round2(this.totalCashIn(event) - this.totalOutgoing(event));
  }

  remainingVendorPayments(event: EventModel): number {
    return round2(Math.max(0, this.totalEventCost(event) - this.totalOutgoing(event)));
  }

  costPerPerson(event: EventModel): number {
    const participants = this.activeParticipantsCount(event);
    return participants ? round2(this.totalEventCost(event) / participants) : 0;
  }

  participantPaid(event: EventModel, participantId: string): number {
    return round2(
      event.payments
        .filter((payment) => payment.participantId === participantId)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    );
  }

  participantPending(event: EventModel, participantId: string): number {
    return round2(Math.max(0, this.costPerPerson(event) - this.participantPaid(event, participantId)));
  }

  participantStatus(event: EventModel, participantId: string): 'paid' | 'partial' | 'pending' {
    const paid = this.participantPaid(event, participantId);
    const cost = this.costPerPerson(event);
    if (cost === 0 || paid >= cost) return 'paid';
    if (paid > 0) return 'partial';
    return 'pending';
  }

  treasuryPersonalAdvance(event: EventModel): number {
    return round2(Math.max(0, this.totalOutgoing(event) - this.totalCashIn(event)));
  }

  seedDemoIfEmpty(): void {
    if (this.events().length > 0) return;
    this.events.set([sampleEvent()]);
    this.persist();
  }

  private load(): EventModel[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as EventModel[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events()));
  }

  private patchEvent(eventId: string, updater: (event: EventModel) => EventModel): void {
    this.events.update((events) => events.map((event) => (event.id === eventId ? updater(event) : event)));
    this.persist();
  }
}
