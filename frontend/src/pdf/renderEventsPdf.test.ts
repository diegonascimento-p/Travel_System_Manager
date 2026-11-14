import { downloadEventsPdf } from "./downloadEventsPdf";
import { buildEventsReport } from "./eventsReport";
import { renderEventsPdf } from "./renderEventsPdf";

const report = buildEventsReport(2024, [
  { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", miles: 42 },
]);

describe("renderEventsPdf", () => {
  it("writes the title and each event's date, name and miles into the PDF", () => {
    const pdf = renderEventsPdf(report).output();

    expect(pdf.startsWith("%PDF-")).toBe(true);
    expect(pdf).toContain("(Miles traveled in 2024)");
    expect(pdf).toContain("(15 March 2024)");
    expect(pdf).toContain("(Client visit - Acme)");
    expect(pdf).toContain("(42)");
  });
});

describe("downloadEventsPdf", () => {
  it("makes the browser download the generated PDF under the report's file name", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const dispatch = vi.spyOn(HTMLAnchorElement.prototype, "dispatchEvent").mockReturnValue(true);

    await downloadEventsPdf(report);

    await vi.waitFor(() => expect(dispatch).toHaveBeenCalled());
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe("application/pdf");
    const anchor = dispatch.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("miles-traveled-2024.pdf");
    expect(anchor.href).toBe("blob:report");
    vi.restoreAllMocks();
  });
});
