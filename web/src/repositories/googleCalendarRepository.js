import { isActiveEvent, toCalendarEvent } from '../models/calendarEvent.js';

const EVENT_FIELDS = 'timeZone,nextPageToken,items(id,status,summary,location,start,end)';
const PAGE_SIZE = 250;

export class CalendarAccessError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CalendarAccessError';
    this.status = status;
  }
}

/**
 * Reads events from the user's primary Google Calendar through the
 * Google Calendar REST API.
 */
export function createGoogleCalendarRepository({ apiUrl, fetchFn = (...args) => fetch(...args) }) {
  async function fetchPage({ accessToken, timeMin, timeMax, pageToken }) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(PAGE_SIZE),
      fields: EVENT_FIELDS,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetchFn(`${apiUrl}/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new CalendarAccessError(`Google Calendar responded with ${response.status}`, response.status);
    }
    return response.json();
  }

  /**
   * @returns {Promise<{timeZone: string | undefined, events: ReturnType<typeof toCalendarEvent>[]}>}
   */
  async function listEvents({ accessToken, timeMin, timeMax }) {
    const items = [];
    let timeZone;
    let pageToken;
    do {
      const page = await fetchPage({ accessToken, timeMin, timeMax, pageToken });
      timeZone ??= page.timeZone;
      items.push(...(page.items ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);

    return { timeZone, events: items.filter(isActiveEvent).map(toCalendarEvent) };
  }

  return { listEvents };
}
