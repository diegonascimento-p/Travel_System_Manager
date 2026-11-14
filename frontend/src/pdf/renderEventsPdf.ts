import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { EventsReport } from "./eventsReport";

/** Renders the report into a PDF document. */
export function renderEventsPdf(report: EventsReport): jsPDF {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(report.title, 14, 18);
  autoTable(doc, {
    startY: 26,
    head: [report.head],
    body: report.rows,
    columnStyles: { 2: { halign: "right" } },
  });
  return doc;
}
