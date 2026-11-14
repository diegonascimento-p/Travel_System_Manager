import { useCalendarController } from '../controllers/useCalendarController.js';
import { ConnectCalendar } from './ConnectCalendar.jsx';
import { EventList } from './EventList.jsx';

export function CalendarScreen({ authService, calendarRepository, windowDays }) {
  const calendar = useCalendarController({ authService, calendarRepository, windowDays });

  return (
    <main className="app">
      <header className="app__header">
        <h1>Travel System Manager</h1>
        {calendar.connected && <p className="status status--connected">Google Calendar connected</p>}
      </header>

      {calendar.error && (
        <div role="alert" className="error">
          <p>{calendar.error.message}</p>
          {calendar.error.kind === 'events' && (
            <button type="button" onClick={calendar.reload}>
              Try again
            </button>
          )}
        </div>
      )}

      {!calendar.connected && (
        <ConnectCalendar connecting={calendar.status === 'connecting'} onConnect={calendar.connect} />
      )}

      {calendar.connected && (
        <section aria-busy={calendar.status === 'loading'}>
          <h2>
            Events from the last {windowDays.back} days and the next {windowDays.ahead} days
          </h2>
          {calendar.status === 'loading' ? (
            <p>Loading events…</p>
          ) : (
            !calendar.error && <EventList events={calendar.events} timeZone={calendar.timeZone} />
          )}
        </section>
      )}
    </main>
  );
}
