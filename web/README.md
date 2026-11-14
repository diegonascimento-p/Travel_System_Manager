# Travel System Manager — web app

React (Vite) web app for tracking work travel. This first version connects to
Google Calendar and lists the user's saved events with their title, date and
time, and location.

## Setup

1. In Google Cloud Console, enable the **Google Calendar API** and create an
   **OAuth 2.0 Client ID** of type *Web application*. Add the app's origin
   (for example `http://localhost:5173`) under *Authorized JavaScript origins*.
2. Copy `.env.example` to `.env.local` and set `VITE_GOOGLE_CLIENT_ID`.
3. Install and run:

```sh
npm install
npm run dev     # development server
npm test        # unit and integration tests
npm run build   # production build in dist/
```

## How it works

- The app has no backend. Google Identity Services issues a short-lived access
  token with the read-only scope `calendar.readonly`; it is kept in memory only.
- Events are read from the user's **primary** calendar, from 30 days ago to 30
  days ahead (see `src/config.js`), each time the user connects.
- Structure (MVC):
  - `src/models` — event model and pure business rules (mapping, time window, formatting)
  - `src/repositories` — Google Calendar API data access
  - `src/services` — Google OAuth connection
  - `src/controllers` — React hook coordinating connection and loading
  - `src/views` — React components
