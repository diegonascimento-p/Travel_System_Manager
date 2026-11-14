import type { EventWithMiles } from "../models/event";
import { downloadYearlyEventsPdf, type EventsServices } from "./yearlyEventsPdfController";

const origin = { latitude: 1, longitude: 2 };

function servicesReturning(events: EventWithMiles[]) {
  return {
    getCurrentPosition: vi.fn(async () => origin),
    fetchEventsForYear: vi.fn(async () => events),
    downloadEventsPdf: vi.fn(async () => {}),
  } satisfies EventsServices;
}

describe("downloadYearlyEventsPdf", () => {
  it("fetches the year's events from the current position and downloads the PDF", async () => {
    const services = servicesReturning([
      { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", miles: 42 },
    ]);

    await expect(downloadYearlyEventsPdf(2024, "token", services)).resolves.toBe("downloaded");

    expect(services.fetchEventsForYear).toHaveBeenCalledWith(2024, "token", origin);
    expect(services.downloadEventsPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "miles-traveled-2024.pdf",
        rows: [["15 March 2024", "Client visit - Acme", "42"]],
      }),
    );
  });

  it("does nothing when the year has no events", async () => {
    const services = servicesReturning([]);

    await expect(downloadYearlyEventsPdf(2022, "token", services)).resolves.toBe("empty");

    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
  });
});
