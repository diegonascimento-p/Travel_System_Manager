import { hasLocation } from '../models/calendarEvent.js';
import { formatEventWhen } from '../models/eventWhen.js';

export const NO_LOCATION_LABEL = 'No location';

export function EventListItem({ event, timeZone }) {
  const withLocation = hasLocation(event);
  return (
    <li className="event" data-testid="event">
      <h3 className="event__title">{event.title}</h3>
      <time className="event__when" dateTime={event.start}>
        {formatEventWhen(event, { timeZone })}
      </time>
      {withLocation ? (
        <p className="event__location">{event.location}</p>
      ) : (
        <p className="event__location event__location--missing">
          <span className="badge">{NO_LOCATION_LABEL}</span>
        </p>
      )}
    </li>
  );
}
