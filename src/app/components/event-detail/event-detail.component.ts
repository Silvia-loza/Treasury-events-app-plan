import { CurrencyPipe, NgClass } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CostCategory } from "../../models";
import { AppStoreService } from "../../services/app-store.service";

@Component({
  selector: "app-event-detail",
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, NgClass],
  templateUrl: "./event-detail.component.html",
})
export class EventDetailComponent {
  readonly store = inject(AppStoreService);
  private readonly route = inject(ActivatedRoute);

  readonly eventId = this.route.snapshot.paramMap.get("id") ?? "";
  readonly event = computed(() => this.store.getEventById(this.eventId));
  readonly activeTab = signal<
    "summary" | "participants" | "costs" | "treasury"
  >("summary");
  readonly tabs = [
    { id: "summary", label: "Summary" },
    { id: "participants", label: "Participants" },
    { id: "costs", label: "Costs" },
    { id: "treasury", label: "Treasury" },
  ] as const;

  readonly meta = {
    name: "",
    date: "",
    treasurer: "",
    description: "",
  };

  readonly participantDraft = { name: "", notes: "" };
  readonly paymentDrafts: Record<
    string,
    { amount: number | null; note: string }
  > = {};
  readonly costDraft: {
    id?: string;
    label: string;
    category: CostCategory;
    totalCost: number | null;
    notes: string;
  } = {
    label: "",
    category: "menu",
    totalCost: null,
    notes: "",
  };
  readonly treasuryDraft: {
    label: string;
    amount: number | null;
    direction: "in" | "out";
    note: string;
  } = {
    label: "",
    amount: null,
    direction: "out",
    note: "",
  };

  constructor() {
    const currentEvent = this.event();
    if (currentEvent) {
      this.syncMeta(currentEvent);
      currentEvent.participants.forEach((participant) =>
        this.ensurePaymentDraft(participant.id),
      );
    }
  }

  saveMeta(): void {
    this.store.updateEventMeta(this.eventId, this.meta);
  }

  addParticipant(): void {
    this.store.addParticipant(
      this.eventId,
      this.participantDraft.name,
      this.participantDraft.notes,
    );
    const refreshed = this.event();
    if (refreshed) {
      this.syncMeta(refreshed);
      refreshed.participants.forEach((participant) =>
        this.ensurePaymentDraft(participant.id),
      );
    }
    this.participantDraft.name = "";
    this.participantDraft.notes = "";
  }

  removeParticipant(participantId: string): void {
    this.store.removeParticipant(this.eventId, participantId);
  }

  addPayment(participantId: string): void {
    const draft = this.paymentDrafts[participantId];
    if (!draft?.amount) return;
    this.store.addPayment(
      this.eventId,
      participantId,
      Number(draft.amount),
      draft.note,
    );
    draft.amount = null;
    draft.note = "";
  }

  saveCost(): void {
    if (!this.costDraft.label.trim() || this.costDraft.totalCost === null)
      return;
    this.store.upsertCost(this.eventId, {
      id: this.costDraft.id,
      label: this.costDraft.label,
      category: this.costDraft.category,
      totalCost: Number(this.costDraft.totalCost),
      notes: this.costDraft.notes,
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
    this.costDraft.notes = item.notes || "";
  }

  removeCost(costId: string): void {
    this.store.removeCost(this.eventId, costId);
  }

  resetCostDraft(): void {
    this.costDraft.id = undefined;
    this.costDraft.label = "";
    this.costDraft.category = "menu";
    this.costDraft.totalCost = null;
    this.costDraft.notes = "";
  }

  addTreasuryEntry(): void {
    if (!this.treasuryDraft.label.trim() || !this.treasuryDraft.amount) return;
    this.store.addTreasuryEntry(this.eventId, {
      label: this.treasuryDraft.label,
      amount: Number(this.treasuryDraft.amount),
      direction: this.treasuryDraft.direction,
      note: this.treasuryDraft.note,
    });
    this.treasuryDraft.label = "";
    this.treasuryDraft.amount = null;
    this.treasuryDraft.direction = "out";
    this.treasuryDraft.note = "";
  }

  removeTreasuryEntry(entryId: string): void {
    this.store.removeTreasuryEntry(this.eventId, entryId);
  }

  private syncMeta(
    currentEvent: NonNullable<ReturnType<typeof this.event>>,
  ): void {
    this.meta.name = currentEvent.name;
    this.meta.date = currentEvent.date;
    this.meta.treasurer = currentEvent.treasurer;
    this.meta.description = currentEvent.description || "";
  }

  private ensurePaymentDraft(participantId: string): void {
    if (!this.paymentDrafts[participantId]) {
      this.paymentDrafts[participantId] = { amount: null, note: "" };
    }
  }
}
