import type { EventsReport } from "./eventsReport";

/**
 * Generates the PDF in the browser and saves it. The PDF library is loaded on demand
 * so it stays out of the initial bundle.
 */
export async function downloadEventsPdf(report: EventsReport): Promise<void> {
  const { renderEventsPdf } = await import("./renderEventsPdf");
  renderEventsPdf(report).save(report.fileName);
}
