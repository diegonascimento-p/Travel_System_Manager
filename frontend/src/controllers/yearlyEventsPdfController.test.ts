import type { EventWithMiles } from "../models/event";
import { downloadYearlyEventsPdf, type EventsServices } from "./yearlyEventsPdfController";

function servicesReturning(events: EventWithMiles[]) {
  return {
    fetchEventsForYear: vi.fn(async () => ({ baseAddress: "Home", events })),
    downloadEventsPdf: vi.fn(async () => {}),
  } satisfies EventsServices;
}

describe("downloadYearlyEventsPdf", () => {
  it("fetches the year's events from the base address and downloads the PDF", async () => {
    const services = servicesReturning([
      { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", distanceMeters: 67_592, miles: 42 },
    ]);

    await expect(downloadYearlyEventsPdf(2024, "token", services)).resolves.toBe("downloaded");

    expect(services.fetchEventsForYear).toHaveBeenCalledWith(2024, "token");
    expect(services.downloadEventsPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "distance-traveled-2024.pdf",
        rows: [["15 March 2024", "Client visit - Acme", "42.0 mi"]],
      }),
    );
  });

  it("writes the distances in the chosen unit", async () => {
    const services = servicesReturning([
      { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 },
    ]);

    await downloadYearlyEventsPdf(2024, "token", services, "kilometers");

    expect(services.downloadEventsPdf).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [["15 March 2024", "Client visit - Acme", "16.1 km"]] }),
    );
  });

  it("does nothing when the year has no events", async () => {
    const services = servicesReturning([]);

    await expect(downloadYearlyEventsPdf(2022, "token", services)).resolves.toBe("empty");

    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
  });
});
