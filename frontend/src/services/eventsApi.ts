import type { YearEvents } from "../models/event";

/** Loads the user's events in a calendar year with the miles from their base address to each one. */
export async function fetchEventsForYear(year: number, accessToken: string): Promise<YearEvents> {
  const params = new URLSearchParams({ year: String(year) });
  const response = await fetch(`/api/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Could not load events (status ${response.status})`);
  }
  const { baseAddress, events } = (await response.json()) as YearEvents;
  return { baseAddress, events };
}
