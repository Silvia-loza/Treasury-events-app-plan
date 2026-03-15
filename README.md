# Party Treasury App

A simple mobile-first Angular app to manage event finances.

## What it does
- Create multiple events
- Assign a treasurer
- Add participants
- Register participant payments
- Add event costs (menu, DJ, decoration, other)
- Add treasury movements (outgoing vendor payments or extra incoming money)
- See total event cost, cost per person, cash balance, remaining vendor payments, and each participant's pending amount

## Tech
- Angular 21
- Standalone components
- Angular signals for state
- LocalStorage persistence (no backend yet)

## Requirements
Angular currently documents Node.js **v20.19.0 or newer** for local setup.

## Run locally
```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Project structure
- `src/app/services/app-store.service.ts` → all app state + localStorage persistence
- `src/app/components/events-list.component.ts` → event list + create event form
- `src/app/components/event-detail.component.ts` → event dashboard with tabs
- `src/app/models.ts` → core types

## Notes
- This is intentionally simple so you can keep building on top of it.
- Data is stored locally in the browser under `party-treasury-events-v1`.
- There is a seeded demo event to help you start fast.

## Good next steps
- Add edit/delete for payments with a nicer UI
- Add filters for paid / pending participants
- Add export to Excel / CSV / PDF
- Add Firebase or Supabase for sync across devices
- Split some costs only among selected participants (for example, tardeo vs dinner)
