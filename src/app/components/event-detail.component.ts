import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppStoreService } from '../services/app-store.service';
import { CostCategory } from '../models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, NgClass],
  template: `
    @if (event(); as currentEvent) {
      <section class="page-header">
        <div>
          <a routerLink="/events" class="back-link">← Back to events</a>
          <p class="eyebrow">Event dashboard</p>
          <h2>{{ currentEvent.name }}</h2>
          <p class="muted">{{ currentEvent.date }} · Treasurer: {{ currentEvent.treasurer }}</p>
        </div>
      </section>

      <section class="summary-grid stack-lg">
        <article class="summary-card">
          <span>Total event cost</span>
          <strong>{{ store.totalEventCost(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
        <article class="summary-card">
          <span>Cost / person</span>
          <strong>{{ store.costPerPerson(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
        <article class="summary-card">
          <span>Collected</span>
          <strong>{{ store.totalCollected(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
        <article class="summary-card">
          <span>Paid to vendors</span>
          <strong>{{ store.totalOutgoing(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
        <article class="summary-card">
          <span>Cash balance</span>
          <strong>{{ store.balance(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
        <article class="summary-card">
          <span>Remaining to pay</span>
          <strong>{{ store.remainingVendorPayments(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong>
        </article>
      </section>

      <nav class="tabbar card">
        @for (tab of tabs; track tab.id) {
          <button type="button" class="tab-button" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
            {{ tab.label }}
          </button>
        }
      </nav>

      @switch (activeTab()) {
        @case ('summary') {
          <section class="card stack-md">
            <div class="section-header">
              <div>
                <h3>Event basics</h3>
                <p class="muted">Quick edit for the main event fields.</p>
              </div>
            </div>
            <form class="grid-form" (ngSubmit)="saveMeta()">
              <label>
                Event name
                <input [(ngModel)]="meta.name" name="eventName" required />
              </label>
              <label>
                Date
                <input [(ngModel)]="meta.date" name="eventDate" type="date" required />
              </label>
              <label>
                Treasurer
                <input [(ngModel)]="meta.treasurer" name="treasurer" required />
              </label>
              <label class="span-2">
                Description
                <textarea [(ngModel)]="meta.description" name="description" rows="3"></textarea>
              </label>
              <div class="span-2 actions-row">
                <button class="primary-button" type="submit">Save details</button>
              </div>
            </form>
          </section>
        }

        @case ('participants') {
          <section class="stack-lg">
            <article class="card">
              <div class="section-header">
                <div>
                  <h3>Add participant</h3>
                  <p class="muted">Payments stay in this event only.</p>
                </div>
              </div>
              <form class="inline-form" (ngSubmit)="addParticipant()">
                <input [(ngModel)]="participantDraft.name" name="participantName" placeholder="Name" required />
                <input [(ngModel)]="participantDraft.notes" name="participantNotes" placeholder="Notes (optional)" />
                <button class="primary-button" type="submit">Add</button>
              </form>
            </article>

            <article class="card stack-md">
              <div class="section-header">
                <div>
                  <h3>Participants</h3>
                  <p class="muted">Mobile-first list with payment status.</p>
                </div>
              </div>

              @for (participant of currentEvent.participants; track participant.id) {
                <div class="list-row">
                  <div>
                    <div class="list-row__title">{{ participant.name }}</div>
                    <div class="muted small">{{ participant.notes || 'No notes' }}</div>
                  </div>
                  <div class="status-box" [ngClass]="store.participantStatus(currentEvent, participant.id)">
                    {{ store.participantStatus(currentEvent, participant.id) }}
                  </div>
                </div>

                <div class="participant-metrics">
                  <div>
                    <span>Paid</span>
                    <strong>{{ store.participantPaid(currentEvent, participant.id) | currency:'EUR':'symbol':'1.2-2' }}</strong>
                  </div>
                  <div>
                    <span>Pending</span>
                    <strong>{{ store.participantPending(currentEvent, participant.id) | currency:'EUR':'symbol':'1.2-2' }}</strong>
                  </div>
                </div>

                <form class="inline-form compact-form" (ngSubmit)="addPayment(participant.id)">
                  <input [(ngModel)]="paymentDrafts[participant.id].amount" name="amount-{{ participant.id }}" type="number" min="0" step="0.01" placeholder="Amount" required />
                  <input [(ngModel)]="paymentDrafts[participant.id].note" name="note-{{ participant.id }}" placeholder="Initial / extra / note" />
                  <button class="ghost-button" type="submit">Add payment</button>
                  <button class="danger-button" type="button" (click)="removeParticipant(participant.id)">Remove</button>
                </form>
              } @empty {
                <p class="muted">No participants yet.</p>
              }
            </article>
          </section>
        }

        @case ('costs') {
          <section class="stack-lg">
            <article class="card">
              <div class="section-header">
                <div>
                  <h3>Add or edit cost</h3>
                  <p class="muted">Cost per person always uses the real total cost.</p>
                </div>
              </div>
              <form class="grid-form" (ngSubmit)="saveCost()">
                <label>
                  Label
                  <input [(ngModel)]="costDraft.label" name="costLabel" placeholder="Menu / DJ / Decoration" required />
                </label>
                <label>
                  Category
                  <select [(ngModel)]="costDraft.category" name="costCategory">
                    <option value="menu">Menu</option>
                    <option value="music">Music</option>
                    <option value="decoration">Decoration</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Total cost
                  <input [(ngModel)]="costDraft.totalCost" name="costTotal" type="number" min="0" step="0.01" required />
                </label>
                <label class="span-2">
                  Notes
                  <input [(ngModel)]="costDraft.notes" name="costNotes" placeholder="Optional" />
                </label>
                <div class="span-2 actions-row">
                  <button class="primary-button" type="submit">Save cost</button>
                  <button class="ghost-button" type="button" (click)="resetCostDraft()">Clear</button>
                </div>
              </form>
            </article>

            <article class="card stack-md">
              <div class="section-header">
                <div>
                  <h3>Costs</h3>
                  <p class="muted">Tap edit to load an item back into the form.</p>
                </div>
              </div>

              @for (cost of currentEvent.costs; track cost.id) {
                <div class="list-row">
                  <div>
                    <div class="list-row__title">{{ cost.label }}</div>
                    <div class="muted small">{{ cost.category }} · {{ cost.notes || 'No notes' }}</div>
                  </div>
                  <strong>{{ cost.totalCost | currency:'EUR':'symbol':'1.2-2' }}</strong>
                </div>
                <div class="participant-metrics">
                  <div>
                    <span>Cost / person</span>
                    <strong>{{ currentEvent.participants.length ? (cost.totalCost / currentEvent.participants.length) : 0 | currency:'EUR':'symbol':'1.2-2' }}</strong>
                  </div>
                  <div>
                    <span>Actions</span>
                    <strong class="action-links">
                      <button type="button" class="link-button" (click)="editCost(cost.id)">Edit</button>
                      <button type="button" class="link-button danger-link" (click)="removeCost(cost.id)">Delete</button>
                    </strong>
                  </div>
                </div>
              } @empty {
                <p class="muted">No costs yet.</p>
              }
            </article>
          </section>
        }

        @case ('treasury') {
          <section class="stack-lg">
            <article class="card">
              <div class="section-header">
                <div>
                  <h3>Add treasury movement</h3>
                  <p class="muted">Use this for vendor payments or extra money added to the event cashbox.</p>
                </div>
              </div>
              <form class="grid-form" (ngSubmit)="addTreasuryEntry()">
                <label>
                  Label
                  <input [(ngModel)]="treasuryDraft.label" name="treasuryLabel" placeholder="Deposit restaurant / DJ payment" required />
                </label>
                <label>
                  Direction
                  <select [(ngModel)]="treasuryDraft.direction" name="treasuryDirection">
                    <option value="out">Outgoing</option>
                    <option value="in">Incoming extra</option>
                  </select>
                </label>
                <label>
                  Amount
                  <input [(ngModel)]="treasuryDraft.amount" name="treasuryAmount" type="number" min="0" step="0.01" required />
                </label>
                <label class="span-2">
                  Notes
                  <input [(ngModel)]="treasuryDraft.note" name="treasuryNote" placeholder="Optional" />
                </label>
                <div class="span-2 actions-row">
                  <button class="primary-button" type="submit">Save movement</button>
                </div>
              </form>
            </article>

            <article class="summary-grid compact-grid">
              <div class="summary-chip"><span>Collected</span><strong>{{ store.totalCollected(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-chip"><span>Extra incoming</span><strong>{{ store.totalIncomingExtra(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-chip"><span>Outgoing</span><strong>{{ store.totalOutgoing(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-chip"><span>Balance</span><strong>{{ store.balance(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-chip"><span>Remaining vendor payments</span><strong>{{ store.remainingVendorPayments(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
              <div class="summary-chip"><span>Treasurer advance</span><strong>{{ store.treasuryPersonalAdvance(currentEvent) | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
            </article>

            <article class="card stack-md">
              <div class="section-header">
                <div>
                  <h3>Movements</h3>
                </div>
              </div>
              @for (entry of currentEvent.treasuryEntries; track entry.id) {
                <div class="list-row">
                  <div>
                    <div class="list-row__title">{{ entry.label }}</div>
                    <div class="muted small">{{ entry.date }} · {{ entry.notes || 'No notes' }}</div>
                  </div>
                  <div class="treasury-right">
                    <strong [class.outgoing]="entry.direction === 'out'" [class.incoming]="entry.direction === 'in'">
                      {{ entry.direction === 'out' ? '-' : '+' }}{{ entry.amount | currency:'EUR':'symbol':'1.2-2' }}
                    </strong>
                    <button type="button" class="link-button danger-link" (click)="removeTreasuryEntry(entry.id)">Delete</button>
                  </div>
                </div>
              } @empty {
                <p class="muted">No treasury movements yet.</p>
              }
            </article>
          </section>
        }
      }
    } @else {
      <section class="card empty-state">
        <h3>Event not found</h3>
        <p class="muted">The event may have been removed.</p>
        <a routerLink="/events" class="primary-button">Go back</a>
      </section>
    }
  `
})
export class EventDetailComponent {
  readonly store = inject(AppStoreService);
  private readonly route = inject(ActivatedRoute);

  readonly eventId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly event = computed(() => this.store.getEventById(this.eventId));
  readonly activeTab = signal<'summary' | 'participants' | 'costs' | 'treasury'>('summary');
  readonly tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'participants', label: 'Participants' },
    { id: 'costs', label: 'Costs' },
    { id: 'treasury', label: 'Treasury' }
  ] as const;

  readonly meta = {
    name: '',
    date: '',
    treasurer: '',
    description: ''
  };

  readonly participantDraft = { name: '', notes: '' };
  readonly paymentDrafts: Record<string, { amount: number | null; note: string }> = {};
  readonly costDraft: { id?: string; label: string; category: CostCategory; totalCost: number | null; notes: string } = {
    label: '',
    category: 'menu',
    totalCost: null,
    notes: ''
  };
  readonly treasuryDraft: { label: string; amount: number | null; direction: 'in' | 'out'; note: string } = {
    label: '',
    amount: null,
    direction: 'out',
    note: ''
  };

  constructor() {
    const currentEvent = this.event();
    if (currentEvent) {
      this.syncMeta(currentEvent);
      currentEvent.participants.forEach((participant) => this.ensurePaymentDraft(participant.id));
    }
  }

  saveMeta(): void {
    this.store.updateEventMeta(this.eventId, this.meta);
  }

  addParticipant(): void {
    this.store.addParticipant(this.eventId, this.participantDraft.name, this.participantDraft.notes);
    const refreshed = this.event();
    if (refreshed) {
      this.syncMeta(refreshed);
      refreshed.participants.forEach((participant) => this.ensurePaymentDraft(participant.id));
    }
    this.participantDraft.name = '';
    this.participantDraft.notes = '';
  }

  removeParticipant(participantId: string): void {
    this.store.removeParticipant(this.eventId, participantId);
  }

  addPayment(participantId: string): void {
    const draft = this.paymentDrafts[participantId];
    if (!draft?.amount) return;
    this.store.addPayment(this.eventId, participantId, Number(draft.amount), draft.note);
    draft.amount = null;
    draft.note = '';
  }

  saveCost(): void {
    if (!this.costDraft.label.trim() || this.costDraft.totalCost === null) return;
    this.store.upsertCost(this.eventId, {
      id: this.costDraft.id,
      label: this.costDraft.label,
      category: this.costDraft.category,
      totalCost: Number(this.costDraft.totalCost),
      notes: this.costDraft.notes
    });
    this.resetCostDraft();
  }

  editCost(costId: string): void {
    const currentEvent = this.event();
    const item = currentEvent?.costs.find((cost) => cost.id === costId);
    if (!item) return;
    this.costDraft.id = item.id;
    this.costDraft.label = item.label;
    this.costDraft.category = item.category;
    this.costDraft.totalCost = item.totalCost;
    this.costDraft.notes = item.notes || '';
  }

  removeCost(costId: string): void {
    this.store.removeCost(this.eventId, costId);
  }

  resetCostDraft(): void {
    this.costDraft.id = undefined;
    this.costDraft.label = '';
    this.costDraft.category = 'menu';
    this.costDraft.totalCost = null;
    this.costDraft.notes = '';
  }

  addTreasuryEntry(): void {
    if (!this.treasuryDraft.label.trim() || !this.treasuryDraft.amount) return;
    this.store.addTreasuryEntry(this.eventId, {
      label: this.treasuryDraft.label,
      amount: Number(this.treasuryDraft.amount),
      direction: this.treasuryDraft.direction,
      note: this.treasuryDraft.note
    });
    this.treasuryDraft.label = '';
    this.treasuryDraft.amount = null;
    this.treasuryDraft.direction = 'out';
    this.treasuryDraft.note = '';
  }

  removeTreasuryEntry(entryId: string): void {
    this.store.removeTreasuryEntry(this.eventId, entryId);
  }

  private syncMeta(currentEvent: NonNullable<ReturnType<typeof this.event>>): void {
    this.meta.name = currentEvent.name;
    this.meta.date = currentEvent.date;
    this.meta.treasurer = currentEvent.treasurer;
    this.meta.description = currentEvent.description || '';
  }

  private ensurePaymentDraft(participantId: string): void {
    if (!this.paymentDrafts[participantId]) {
      this.paymentDrafts[participantId] = { amount: null, note: '' };
    }
  }
}
