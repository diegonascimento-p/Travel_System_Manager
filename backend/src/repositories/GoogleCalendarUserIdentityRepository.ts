import { CalendarAccessError } from "./GoogleCalendarEventRepository.js";
import type { UserIdentityRepository } from "./UserIdentityRepository.js";

const PRIMARY_CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars/primary";

/**
 * Identifies the user by the id of their primary Google Calendar, which is their account's email.
 * Uses the calendar scope the app already requests, so sign-in does not change.
 */
export class GoogleCalendarUserIdentityRepository implements UserIdentityRepository {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async findUserId(accessToken: string): Promise<string> {
    const response = await this.fetchFn(PRIMARY_CALENDAR_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) {
      throw new CalendarAccessError("Google Calendar access was denied");
    }
    if (!response.ok) {
      throw new Error(`Google Calendar request failed with status ${response.status}`);
    }
    const { id } = (await response.json()) as { id?: string };
    if (!id) throw new Error("Google Calendar did not return the calendar id");
    return id;
  }
}
