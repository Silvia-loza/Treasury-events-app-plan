import { Routes } from "@angular/router";
import { EventDetailComponent } from "./components/event-detail/event-detail.component";
import { EventsListComponent } from "./components/events-list/events-list.component";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "events" },
  { path: "events", component: EventsListComponent },
  { path: "events/:id", component: EventDetailComponent },
  { path: "**", redirectTo: "events" },
];
