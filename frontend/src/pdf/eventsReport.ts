import type { EventWithMiles } from "../models/event";
import { DEFAULT_DISTANCE_UNIT, type DistanceUnit } from "../models/distanceUnit";
import { formatDistance } from "../utils/distance";
import { formatEventDate } from "../utils/format";

export interface EventsReport {
  title: string;
  fileName: string;
  head: string[];
  rows: string[][];
}

/**
 * Builds the content of the yearly distance-traveled report: one row per event, oldest first,
 * with distances in the unit.
 */
export function buildEventsReport(year: number, events: EventWithMiles[], unit: DistanceUnit = DEFAULT_DISTANCE_UNIT): EventsReport {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return {
    title: `Distance traveled in ${year}`,
    fileName: `distance-traveled-${year}.pdf`,
    head: ["Date", "Event", "Distance traveled"],
    rows: sorted.map((event) => [formatEventDate(event.date), event.name, formatDistance(event.miles, unit)]),
  };
}
