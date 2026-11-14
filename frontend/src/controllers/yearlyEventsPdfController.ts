import type { Coordinates, EventWithMiles } from "../models/event";
import type { DistanceUnit } from "../models/settings";
import { buildEventsReport, type EventsReport } from "../pdf/eventsReport";

export interface EventsServices {
  getCurrentPosition(): Promise<Coordinates>;
  fetchEventsForYear(year: number, accessToken: string, origin: Coordinates): Promise<EventWithMiles[]>;
  downloadEventsPdf(report: EventsReport): Promise<void>;
}

export type PdfDownloadResult = "downloaded" | "empty";

/**
 * Downloads the distance-traveled PDF for a year, with distances in the unit. A year without events produces no file.
 */
export async function downloadYearlyEventsPdf(
  year: number,
  accessToken: string,
  services: EventsServices,
  unit: DistanceUnit = "mi",
): Promise<PdfDownloadResult> {
  const origin = await services.getCurrentPosition();
  const events = await services.fetchEventsForYear(year, accessToken, origin);
  if (events.length === 0) return "empty";
  await services.downloadEventsPdf(buildEventsReport(year, events, unit));
  return "downloaded";
}
