import { EventListItem } from './EventListItem.jsx';

export function EventList({ events, timeZone }) {
  if (events.length === 0) {
    return <p className="empty">No events found in this period.</p>;
  }
  return (
    <ul className="events" aria-label="Calendar events">
      {events.map((event) => (
        <EventListItem key={event.id} event={event} timeZone={timeZone} />
      ))}
    </ul>
  );
}
