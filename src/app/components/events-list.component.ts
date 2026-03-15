import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppStoreService } from '../services/app-store.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Events</p>
        <h2>Manage multiple celebrations</h2>
        <p class="muted">Create events, assign a treasurer, and track participants, payments, costs, and treasury totals.</p>
      </div>
    </section>

    <section class="card stack-lg">
      <div class="section-header">
        <div>
          <h3>Create event</h3>
          <p class="muted">This is the only form you need to start a new event.</p>
        </div>
      </div>

      <form class="grid-form" (ngSubmit)="createEvent()">
        <label>
          Event name
          <input [(ngModel)]="draft.name" name="name" placeholder="Birthday dinner" required />
        </label>

        <label>
          Date
          <input [(ngModel)]="draft.date" name="date" type="date" required />
        </label>

        <label>
          Treasurer
          <input [(ngModel)]="draft.treasurer" name="treasurer" placeholder="Silvia" required />
        </label>

        <label class="span-2">
          Description
          <textarea [(ngModel)]="draft.description" name="description" rows="3" placeholder="Optional notes"></textarea>
        </label>

        <div class="span-2 actions-row">
          <button class="primary-button" type="submit">Create event</button>
        </div>
      </form>
    </section>

    <section class="stack-lg">
      <div class="section-header">
        <div>
          <h3>Your events</h3>
          <p class="muted">Tap an event to open the mobile dashboard.</p>
        </div>
      </div>

      <div class="stack-md">
        @for (event of events(); track event.id) {
          <article class="card event-card">
            <div class="event-card__top">
              <div>
                <h3>{{ event.name }}</h3>
                <p class="muted">{{ event.date }} · Treasurer: {{ event.treasurer }}</p>
              </div>
              <a class="primary-button" [routerLink]="['/events', event.id]">Open</a>
            </div>

            <div class="summary-grid compact-grid">
              <div class="summary-chip">
                <span>Participants</span>
                <strong>{{ store.activeParticipantsCount(event) }}</strong>
              </div>
              <div class="summary-chip">
                <span>Cost / person</span>
                <strong>{{ store.costPerPerson(event) | currency:'EUR':'symbol':'1.2-2' }}</strong>
              </div>
              <div class="summary-chip">
                <span>Collected</span>
                <strong>{{ store.totalCollected(event) | currency:'EUR':'symbol':'1.2-2' }}</strong>
              </div>
              <div class="summary-chip">
                <span>Remaining</span>
                <strong>{{ store.remainingVendorPayments(event) | currency:'EUR':'symbol':'1.2-2' }}</strong>
              </div>
            </div>
          </article>
        } @empty {
          <article class="card empty-state">
            <h3>No events yet</h3>
            <p class="muted">Create the first one using the form above.</p>
          </article>
        }
      </div>
    </section>
  `
})
export class EventsListComponent {
  readonly store = inject(AppStoreService);
  readonly events = computed(() => this.store.eventsSorted());

  readonly draft = {
    name: '',
    date: new Date().toISOString().slice(0, 10),
    treasurer: '',
    description: ''
  };

  createEvent(): void {
    if (!this.draft.name.trim() || !this.draft.date || !this.draft.treasurer.trim()) return;
    this.store.createEvent(this.draft);
    this.draft.name = '';
    this.draft.treasurer = '';
    this.draft.description = '';
  }
}
