import type { CalendarEvent } from "../models/Event.js";

export interface EventRepository {
  /**
   * Returns the user's events whose start falls between the two dates (inclusive, YYYY-MM-DD).
   * Implementations may return events slightly outside the range; callers filter by local date.
   */
  findByDateRange(accessToken: string, from: string, to: string): Promise<CalendarEvent[]>;
}
