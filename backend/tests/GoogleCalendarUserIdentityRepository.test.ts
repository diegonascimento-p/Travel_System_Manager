import { describe, expect, it, vi } from "vitest";
import { CalendarAccessError } from "../src/repositories/GoogleCalendarEventRepository.js";
import { GoogleCalendarUserIdentityRepository } from "../src/repositories/GoogleCalendarUserIdentityRepository.js";

describe("GoogleCalendarUserIdentityRepository", () => {
  it("identifies the user by their primary calendar id", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "me@example.com" })));

    await expect(new GoogleCalendarUserIdentityRepository(fetchFn).findUserId("token")).resolves.toBe("me@example.com");

    expect(fetchFn).toHaveBeenCalledWith("https://www.googleapis.com/calendar/v3/calendars/primary", {
      headers: { Authorization: "Bearer token" },
    });
  });

  it("reports a rejected token as a calendar access error", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(new GoogleCalendarUserIdentityRepository(fetchFn).findUserId("bad")).rejects.toBeInstanceOf(
      CalendarAccessError,
    );
  });
});
