# Travel System Manager

Tracks the miles traveled for work, calculated from your Google Calendar events: for each
event, the round-trip driving distance from your saved base address to the event's location and back,
calculated with the free OpenStreetMap services (no Google Maps key or Google Cloud billing needed).

## Structure

- `backend/` – TypeScript + Express API (Google access token in the `Authorization: Bearer` header):
  - `GET /api/events?year=YYYY` – the year's Google Calendar events with `distanceMeters` (and
    `miles`), the round-trip driving distance from the user's base address to the event's location
    and back (two OSRM driving legs between the Nominatim coordinates of both addresses). It is calculated when the events are loaded, saved
    in the `event_mileage` table, and recalculated when the base address or the event's location
    changes. Both are null when no base address is saved, the event has no location, or the location
    cannot be found or routed; when Nominatim or OSRM fails or times out nothing is saved and it is
    retried on the next load.
  - `GET /api/settings`, `PUT /api/settings` (`{ "baseAddress": "...", "distanceUnit": "miles" | "kilometers" }`)
    – the settings saved on the user's profile, keyed by their Google account. The base address is
    checked with Nominatim and rejected (400) when it cannot be found; an empty value clears it. The distance unit defaults to `miles`
    and is kept when omitted; it only changes how distances are shown, never how they are stored.
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
  The "Settings" screen holds the "Base address" the miles are measured from and the "Distance
  unit" (Miles or Kilometers, Miles by default) saved on the Google account's profile; every
  distance, including calendar event mileage, totals, trips and the PDF, is shown in it with one
  decimal place and the `mi` / `km` label (1 mile = 1.609344 km).

## Running locally

1. In Google Cloud, enable the Calendar API and create an OAuth web client (authorized origin
   `http://localhost:5173`) for signing in and reading calendar events. No Google Maps API, API key or
   billing account is needed.
2. Backend (Node 22.13+, which ships SQLite): `cd backend && npm install && npm run dev`
   (port 3001). The trips database is created and migrated on start. No environment variable is
   required; see `backend/.env.example` for the optional ones.

### Maps (OpenStreetMap)

Addresses are geocoded with [Nominatim](https://nominatim.org) and driving distances come from the
[OSRM](https://project-osrm.org) public server; both are free and need no key. Following
[Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/) the backend
sends at most one Nominatim request per second, identifies itself with a User-Agent and caches
every looked-up address in memory (the cache is cleared on restart; calculated event mileage is
saved in the database, so addresses are rarely looked up again). Optional variables:

- `MAPS_USER_AGENT` – the User-Agent sent to Nominatim and OSRM. Set it to your app name and a contact
  URL or email when you deploy it. Defaults to `TravelSystemManager/0.1 (+<repository URL>)`.
- `NOMINATIM_URL`, `OSRM_URL` – base URLs of other (for example self-hosted) servers. Default to
  `https://nominatim.openstreetmap.org` and `https://router.project-osrm.org`.

The public servers are meant for light use; for heavy traffic, host your own and set the URLs.
3. Frontend: `cd frontend && npm install && VITE_GOOGLE_CLIENT_ID=<client id> npm run dev`.
   The dev server proxies `/api` to the backend.

## Tests

Run `npm test` in `backend/` and in `frontend/`.
# Travel System Manager
