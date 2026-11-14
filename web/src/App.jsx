import {
  EVENT_WINDOW_DAYS_AHEAD,
  EVENT_WINDOW_DAYS_BACK,
  GOOGLE_CALENDAR_API_URL,
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CLIENT_ID,
} from './config.js';
import { createGoogleCalendarRepository } from './repositories/googleCalendarRepository.js';
import { createGoogleAuthService } from './services/googleAuthService.js';
import { CalendarScreen } from './views/CalendarScreen.jsx';

const authService = createGoogleAuthService({ clientId: GOOGLE_CLIENT_ID, scope: GOOGLE_CALENDAR_SCOPE });
const calendarRepository = createGoogleCalendarRepository({ apiUrl: GOOGLE_CALENDAR_API_URL });
const windowDays = { back: EVENT_WINDOW_DAYS_BACK, ahead: EVENT_WINDOW_DAYS_AHEAD };

export function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <main className="app">
        <h1>Travel System Manager</h1>
        <p role="alert" className="error">
          Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID (see .env.example).
        </p>
      </main>
    );
  }
  return <CalendarScreen authService={authService} calendarRepository={calendarRepository} windowDays={windowDays} />;
}
