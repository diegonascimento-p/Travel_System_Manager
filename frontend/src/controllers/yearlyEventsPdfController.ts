import type { Coordinates, EventWithMiles } from "../models/event";
import { buildEventsReport, type EventsReport } from "../pdf/eventsReport";

export interface EventsServices {
  getCurrentPosition(): Promise<Coordinates>;
  fetchEventsForYear(year: number, accessToken: string, origin: Coordinates): Promise<EventWithMiles[]>;
  downloadEventsPdf(report: EventsReport): Promise<void>;
}

export type PdfDownloadResult = "downloaded" | "empty";

/**
 * Downloads the miles-traveled PDF for a year. A year without events produces no file.
 */
export async function downloadYearlyEventsPdf(
  year: number,
  accessToken: string,
  services: EventsServices,
): Promise<PdfDownloadResult> {
  const origin = await services.getCurrentPosition();
  const events = await services.fetchEventsForYear(year, accessToken, origin);
  if (events.length === 0) return "empty";
  await services.downloadEventsPdf(buildEventsReport(year, events));
  return "downloaded";
}
