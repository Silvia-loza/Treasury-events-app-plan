import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStoreService } from './services/app-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Party Treasury</p>
          <h1>Shared event treasury</h1>
        </div>
        <a routerLink="/events" routerLinkActive="active-link" class="ghost-button">Events</a>
      </header>

      <main class="page">
        <router-outlet />
      </main>
    </div>
  `
})
export class AppComponent {
  private readonly store = inject(AppStoreService);

  constructor() {
    this.store.seedDemoIfEmpty();
  }
}
