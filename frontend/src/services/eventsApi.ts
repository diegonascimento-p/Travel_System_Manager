import type { Coordinates, EventWithMiles } from "../models/event";

/** Loads the user's events in a calendar year with the miles traveled to each one. */
export async function fetchEventsForYear(
  year: number,
  accessToken: string,
  origin: Coordinates,
): Promise<EventWithMiles[]> {
  const params = new URLSearchParams({
    year: String(year),
    lat: String(origin.latitude),
    lng: String(origin.longitude),
  });
  const response = await fetch(`/api/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Could not load events (status ${response.status})`);
  }
  const body = (await response.json()) as { events: EventWithMiles[] };
  return body.events;
}
