import { describe, expect, it, vi } from "vitest";
import {
  CalendarAccessError,
  GoogleCalendarEventRepository,
} from "../src/repositories/GoogleCalendarEventRepository.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("GoogleCalendarEventRepository", () => {
  it("maps Google events, follows pages and skips cancelled events", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({
          items: [
            { id: "1", summary: "Client visit - Acme", location: " Acme HQ ", start: { dateTime: "2024-03-15T09:00:00-05:00" } },
            { id: "2", status: "cancelled", summary: "Cancelled", start: { date: "2024-03-16" } },
          ],
          nextPageToken: "next",
        }),
      )
      .mockResolvedValueOnce(json({ items: [{ id: "3", start: { date: "2024-12-31" } }] }));

    const events = await new GoogleCalendarEventRepository(fetchFn).findByDateRange(
      "token",
      "2024-01-01",
      "2024-12-31",
    );

    expect(events).toEqual([
      { id: "1", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ" },
      { id: "3", name: "(No title)", date: "2024-12-31", location: null },
    ]);
    const firstUrl = new URL(String(fetchFn.mock.calls[0][0]));
    expect(firstUrl.searchParams.get("timeMin")).toBe("2023-12-31T00:00:00Z");
    expect(firstUrl.searchParams.get("timeMax")).toBe("2025-01-02T00:00:00Z");
    expect(firstUrl.searchParams.get("singleEvents")).toBe("true");
    expect(fetchFn.mock.calls[0][1]).toEqual({ headers: { Authorization: "Bearer token" } });
    expect(new URL(String(fetchFn.mock.calls[1][0])).searchParams.get("pageToken")).toBe("next");
  });

  it("raises an access error when Google rejects the token", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json({}, 401));
    await expect(
      new GoogleCalendarEventRepository(fetchFn).findByDateRange("bad", "2024-01-01", "2024-12-31"),
    ).rejects.toBeInstanceOf(CalendarAccessError);
  });
});
