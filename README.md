# Travel System Manager

Tracks the miles traveled for work, calculated from your Google Calendar events: for each
event, the distance from your current position to the event's location.

## Structure

- `backend/` – TypeScript + Express API (`GET /api/events?year=YYYY&lat=..&lng=..`, Google
  access token in the `Authorization: Bearer` header). Reads events from Google Calendar and
  geocodes their locations with the Google Geocoding API.
- `frontend/` – React + Vite app. Signs in with Google, lists this year's events and lets you
  download a PDF of miles traveled per event for any year from 1900 to today. The PDF is
  generated in the browser.

## Running locally

1. In Google Cloud, enable the Calendar API and Geocoding API, create an OAuth web client
   (authorized origin `http://localhost:5173`) and an API key.
2. Backend: `cd backend && npm install && GOOGLE_MAPS_API_KEY=<key> npm run dev` (port 3001).
3. Frontend: `cd frontend && npm install && VITE_GOOGLE_CLIENT_ID=<client id> npm run dev`.
   The dev server proxies `/api` to the backend.

## Tests

Run `npm test` in `backend/` and in `frontend/`.
