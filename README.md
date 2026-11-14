# Travel System Manager

Tracks the miles traveled for work, calculated from your Google Calendar events: for each
event, the distance from your current position to the event's location.

## Structure

- `backend/` – TypeScript + Express API (`GET /api/events?year=YYYY&lat=..&lng=..`, Google
  access token in the `Authorization: Bearer` header). Reads events from Google Calendar and
  geocodes their locations with the Google Geocoding API.
  Also stores logged trips in SQLite (`DATABASE_PATH`, default `data/travel.db`):
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

## Running locally

1. In Google Cloud, enable the Calendar API and Geocoding API, create an OAuth web client
   (authorized origin `http://localhost:5173`) and an API key.
2. Backend (Node 22.13+, which ships SQLite): `cd backend && npm install && GOOGLE_MAPS_API_KEY=<key> npm run dev`
   (port 3001). The trips database is created and migrated on start.
3. Frontend: `cd frontend && npm install && VITE_GOOGLE_CLIENT_ID=<client id> npm run dev`.
   The dev server proxies `/api` to the backend.

## Tests

Run `npm test` in `backend/` and in `frontend/`.
# Travel System Manager
