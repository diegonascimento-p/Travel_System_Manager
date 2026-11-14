export const UNTITLED_EVENT = '(No title)';

/**
 * Maps a Google Calendar API event resource to the app's CalendarEvent model.
 *
 * @param {object} item Google Calendar event resource.
 * @returns {{id: string, title: string, isAllDay: boolean, start: string, end: string, location: string | null}}
 */
export function toCalendarEvent(item) {
  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  return {
    id: item.id,
    title: normalizeText(item.summary) ?? UNTITLED_EVENT,
    isAllDay,
    start: isAllDay ? item.start.date : item.start?.dateTime,
    end: isAllDay ? item.end?.date : item.end?.dateTime,
    location: normalizeText(item.location),
  };
}

export function hasLocation(event) {
  return event.location !== null;
}

export function isActiveEvent(item) {
  return item.status !== 'cancelled' && Boolean(item.start);
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
