import type { EventWithMiles } from "../models/event";
import { formatEventDate, formatMiles } from "../utils/format";

export interface EventsReport {
  title: string;
  fileName: string;
  head: string[];
  rows: string[][];
}

/** Builds the content of the yearly miles-traveled report: one row per event, oldest first. */
export function buildEventsReport(year: number, events: EventWithMiles[]): EventsReport {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return {
    title: `Miles traveled in ${year}`,
    fileName: `miles-traveled-${year}.pdf`,
    head: ["Date", "Event", "Miles traveled"],
    rows: sorted.map((event) => [formatEventDate(event.date), event.name, formatMiles(event.miles)]),
  };
}
