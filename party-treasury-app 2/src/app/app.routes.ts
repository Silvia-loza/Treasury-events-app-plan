import { Routes } from '@angular/router';
import { EventsListComponent } from './components/events-list.component';
import { EventDetailComponent } from './components/event-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  { path: 'events', component: EventsListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: '**', redirectTo: 'events' }
];
