import type { CalendarEvent } from "../models/Event.js";
import type { EventRepository } from "./EventRepository.js";

const CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GoogleEventDate {
  date?: string;
  dateTime?: string;
}

interface GoogleEvent {
  id: string;
  status?: string;
  summary?: string;
  location?: string;
  start?: GoogleEventDate;
}

interface GoogleEventsPage {
  items?: GoogleEvent[];
  nextPageToken?: string;
}

export class CalendarAccessError extends Error {}

/** Reads events from the user's primary Google Calendar using their OAuth access token. */
export class GoogleCalendarEventRepository implements EventRepository {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async findByDateRange(accessToken: string, from: string, to: string): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];
    let pageToken: string | undefined;
    do {
      const page = await this.fetchPage(accessToken, from, to, pageToken);
      for (const item of page.items ?? []) {
        const event = toCalendarEvent(item);
        if (event) events.push(event);
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
    return events;
  }

  private async fetchPage(
    accessToken: string,
    from: string,
    to: string,
    pageToken?: string,
  ): Promise<GoogleEventsPage> {
    const url = new URL(CALENDAR_EVENTS_URL);
    // Widen by one day on each side so time zones never drop events; callers filter by local date.
    url.searchParams.set("timeMin", `${shiftDate(from, -1)}T00:00:00Z`);
    url.searchParams.set("timeMax", `${shiftDate(to, 2)}T00:00:00Z`);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "2500");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await this.fetchFn(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      throw new CalendarAccessError("Google Calendar access was denied");
    }
    if (!response.ok) {
      throw new Error(`Google Calendar request failed with status ${response.status}`);
    }
    return (await response.json()) as GoogleEventsPage;
  }
}

function toCalendarEvent(item: GoogleEvent): CalendarEvent | null {
  if (item.status === "cancelled") return null;
  // All-day events use `date`; timed events use an RFC 3339 `dateTime` whose first 10
  // characters are the date in the event's own time zone.
  const start = item.start?.date ?? item.start?.dateTime;
  if (!start) return null;
  return {
    id: item.id,
    name: item.summary ?? "(No title)",
    date: start.slice(0, 10),
    location: item.location?.trim() || null,
  };
}

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
