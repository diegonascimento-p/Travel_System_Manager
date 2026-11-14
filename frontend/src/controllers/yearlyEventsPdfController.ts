import { DEFAULT_DISTANCE_UNIT, type DistanceUnit } from "../models/distanceUnit";
import type { YearEvents } from "../models/event";
import { buildEventsReport, type EventsReport } from "../pdf/eventsReport";

export interface EventsServices {
  fetchEventsForYear(year: number, accessToken: string): Promise<YearEvents>;
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
  unit: DistanceUnit = DEFAULT_DISTANCE_UNIT,
): Promise<PdfDownloadResult> {
  const { events } = await services.fetchEventsForYear(year, accessToken);
  if (events.length === 0) return "empty";
  await services.downloadEventsPdf(buildEventsReport(year, events, unit));
  return "downloaded";
}
