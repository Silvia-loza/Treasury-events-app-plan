import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AppStoreService } from "./services/app-store.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Party Treasury</p>
        </div>
      </header>

      <main class="page">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  private readonly store = inject(AppStoreService);

  constructor() {
    this.store.seedDemoIfEmpty();
  }
}
