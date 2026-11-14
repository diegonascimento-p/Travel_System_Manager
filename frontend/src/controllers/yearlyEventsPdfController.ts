import type { YearEvents } from "../models/event";
import { buildEventsReport, type EventsReport } from "../pdf/eventsReport";

export interface EventsServices {
  fetchEventsForYear(year: number, accessToken: string): Promise<YearEvents>;
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
  const { events } = await services.fetchEventsForYear(year, accessToken);
  if (events.length === 0) return "empty";
  await services.downloadEventsPdf(buildEventsReport(year, events));
  return "downloaded";
}
