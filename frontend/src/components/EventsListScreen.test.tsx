import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EventsServices } from "../controllers/yearlyEventsPdfController";
import type { EventWithMiles } from "../models/event";
import { renderWithUnit } from "../testing/fakeSettingsServices";
import { EventsListScreen } from "./EventsListScreen";

const origin = { latitude: 1, longitude: 2 };

const eventsByYear: Record<number, EventWithMiles[]> = {
  2024: [
    { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", miles: 42 },
    { id: "b", name: "Workshop", date: "2024-06-01", location: "Hall", miles: 7.5 },
    { id: "c", name: "Review", date: "2024-12-31", location: "Office", miles: 3 },
  ],
};

function makeServices(overrides: Partial<EventsServices> = {}) {
  return {
    getCurrentPosition: vi.fn(async () => origin),
    fetchEventsForYear: vi.fn(async (year: number) => eventsByYear[year] ?? []),
    downloadEventsPdf: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("EventsListScreen", () => {
  it("shows a Download PDF button with a year selector next to it", async () => {
    render(<EventsListScreen accessToken="token" services={makeServices()} />);

    const select = screen.getByRole("combobox", { name: "Year" });
    const button = screen.getByRole("button", { name: "Download PDF" });
    expect(select.closest(".download-pdf")).toBe(button.closest(".download-pdf"));
    expect(select).toHaveValue(String(new Date().getFullYear()));
    expect(screen.getByRole("option", { name: "1900" })).toBeInTheDocument();
    await screen.findByText(/No events this year|Distance traveled/);
  });

  it("downloads a PDF listing every event of the selected year", async () => {
    const services = makeServices();
    render(<EventsListScreen accessToken="token" services={services} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2024");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(services.downloadEventsPdf).toHaveBeenCalledTimes(1));
    expect(services.fetchEventsForYear).toHaveBeenCalledWith(2024, "token", origin);
    expect(services.downloadEventsPdf).toHaveBeenCalledWith({
      title: "Distance traveled in 2024",
      fileName: "distance-traveled-2024.pdf",
      head: ["Date", "Event", "Distance traveled"],
      rows: [
        ["15 March 2024", "Client visit - Acme", "42.0 mi"],
        ["1 June 2024", "Workshop", "7.5 mi"],
        ["31 December 2024", "Review", "3.0 mi"],
      ],
    });
  });

  it("does nothing for a year without events", async () => {
    const services = makeServices();
    render(<EventsListScreen accessToken="token" services={services} />);
    await screen.findByText(/No events this year/);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2022");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(services.fetchEventsForYear).toHaveBeenCalledWith(2022, "token", origin));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled());
    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains why the PDF could not be generated", async () => {
    const services = makeServices({
      getCurrentPosition: vi.fn(async () => {
        throw new Error("Allow location access to calculate miles traveled.");
      }),
    });
    render(<EventsListScreen accessToken="token" services={services} />);
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
  });

  it("lists the current year's events with date, name and miles", async () => {
    const year = new Date().getFullYear();
    eventsByYear[year] = [
      { id: "x", name: "Client visit - Acme", date: `${year}-03-15`, location: "Acme HQ", miles: 42 },
    ];
    render(<EventsListScreen accessToken="token" services={makeServices()} />);

    expect(await screen.findByText("Client visit - Acme")).toBeInTheDocument();
    expect(screen.getByText(`15 March ${year}`)).toBeInTheDocument();
    expect(screen.getAllByText("42.0 mi")).toHaveLength(2); // the event and the total
    delete eventsByYear[year];
  });

  describe("distance unit", () => {
    const year = new Date().getFullYear();
    beforeEach(() => {
      eventsByYear[year] = [
        { id: "x", name: "Client visit", date: `${year}-03-15`, location: "Acme HQ", miles: 10 },
        { id: "y", name: "Workshop", date: `${year}-04-01`, location: "Hall", miles: 12.345 },
        { id: "z", name: "Call", date: `${year}-05-01`, location: null, miles: null },
      ];
    });
    afterEach(() => {
      delete eventsByYear[year];
    });

    const distanceCells = async () => {
      const table = await screen.findByRole("table");
      return within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell").at(-1)!.textContent);
    };

    it("shows each event's mileage converted to km (1 mi = 1.609344 km) with the 'km' label, and the total", async () => {
      renderWithUnit(<EventsListScreen accessToken="token" services={makeServices()} />, "km");

      await screen.findByText("16.1 km");
      // 10 mi = 16.09 km, 12.345 mi = 19.87 km; the total converts the unrounded sum: 22.345 mi = 35.96 km.
      expect(await distanceCells()).toEqual(["16.1 km", "19.9 km", "N/A", "36.0 km"]);
      expect(within(screen.getByRole("table")).getByRole("rowheader", { name: "Total" })).toBeInTheDocument();
    });

    it("shows each event's mileage in miles with one decimal and the 'mi' label, and the total", async () => {
      renderWithUnit(<EventsListScreen accessToken="token" services={makeServices()} />, "mi");

      await screen.findByText("12.3 mi");
      expect(await distanceCells()).toEqual(["10.0 mi", "12.3 mi", "N/A", "22.3 mi"]);
    });

    it("downloads the PDF in the chosen unit", async () => {
      const services = makeServices();
      renderWithUnit(<EventsListScreen accessToken="token" services={services} />, "km");
      await screen.findByText("16.1 km");

      await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

      await waitFor(() => expect(services.downloadEventsPdf).toHaveBeenCalledTimes(1));
      const report = vi.mocked(services.downloadEventsPdf).mock.calls[0][0];
      expect(report.rows.map((row) => row[2])).toEqual(["16.1 km", "19.9 km", "N/A"]);
    });
  });
});
