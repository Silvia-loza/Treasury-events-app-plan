import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AppStoreService } from "../../services/app-store.service";

@Component({
  selector: "app-events-list",
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: "./events-list.component.html",
})
export class EventsListComponent {
  readonly store = inject(AppStoreService);
  readonly events = computed(() => this.store.eventsSorted());

  readonly showForm = signal(false);

  readonly draft = {
    name: "",
    date: new Date().toISOString().slice(0, 10),
    treasurer: "",
    description: "",
  };

  toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  createEvent(): void {
    if (
      !this.draft.name.trim() ||
      !this.draft.date ||
      !this.draft.treasurer.trim()
    )
      return;
    this.store.createEvent(this.draft);
    this.draft.name = "";
    this.draft.treasurer = "";
    this.draft.description = "";
    this.showForm.set(false); // Hide form after creating
  }
}
