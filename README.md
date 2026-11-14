# Travel System Manager

Tracks the miles traveled for work, calculated from your Google Calendar events: for each
event, the Google Maps round-trip driving distance from your saved base address to the event's location and back.

## Structure

- `backend/` – TypeScript + Express API (Google access token in the `Authorization: Bearer` header):
  - `GET /api/events?year=YYYY` – the year's Google Calendar events with `distanceMeters` (and
    `miles`), the round-trip driving distance from the user's base address to the event's location
    and back (two Google Distance Matrix legs). It is calculated when the events are loaded, saved
    in the `event_mileage` table, and recalculated when the base address or the event's location
    changes. Both are null when no base address is saved, the event has no location, or the location
    cannot be found; when Google Maps fails as a whole nothing is saved and it is retried next load.
  - `GET /api/settings`, `PUT /api/settings` (`{ "baseAddress": "..." }`) – the base address saved
    on the user's profile, keyed by their Google account. It is checked with the Geocoding API;
    an empty value clears it.
  Also stores logged trips and user profiles in SQLite (`DATABASE_PATH`, default `data/travel.db`):
  - `GET /api/trips?limit=20&offset=0` – trips newest first, with `total` for paging
  - `GET /api/trips/:id`, `POST /api/trips`, `PUT /api/trips/:id` – read, create, update a trip
    (`date` YYYY-MM-DD, `origin`, `destination`, `distance` in miles, `purpose`; all required)
  - `GET /api/trips/summary?month=YYYY-MM` – total miles and trip count of a month

  Schema changes are versioned SQL files in `backend/migrations/`, applied in order on start.
- `frontend/` – React + Vite app with a sidebar layout styled after the Lovable HireFlow
  template: a dashboard (this month's miles and the 5 most recent trips), a trips list and an
  add/edit trip form. The "Calendar events" screen signs in with Google, lists this year's
  events and lets you download a PDF of miles traveled per event for any year from 1900 to
  today. The PDF is generated in the browser.
  The "Settings" screen holds the "Base address" the miles are measured from.

## Running locally

1. In Google Cloud, enable the Calendar API, Geocoding API and Distance Matrix API, create an OAuth web client
   (authorized origin `http://localhost:5173`) and an API key.
2. Backend (Node 22.13+, which ships SQLite): `cd backend && npm install && GOOGLE_MAPS_API_KEY=<key> npm run dev`
   (port 3001). The trips database is created and migrated on start.
3. Frontend: `cd frontend && npm install && VITE_GOOGLE_CLIENT_ID=<client id> npm run dev`.
   The dev server proxies `/api` to the backend.

## Tests

Run `npm test` in `backend/` and in `frontend/`.
# Travel System Manager
