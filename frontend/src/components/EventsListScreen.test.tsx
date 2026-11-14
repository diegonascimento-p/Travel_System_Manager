import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EventsServices } from "../controllers/yearlyEventsPdfController";
import type { EventWithMiles } from "../models/event";
import { EventsListScreen } from "./EventsListScreen";

const eventsByYear: Record<number, EventWithMiles[]> = {
  2024: [
    { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", distanceMeters: 67_592, miles: 42 },
    { id: "b", name: "Workshop", date: "2024-06-01", location: "Hall", distanceMeters: 12_070, miles: 7.5 },
    { id: "c", name: "Review", date: "2024-12-31", location: "Office", distanceMeters: 4_828, miles: 3 },
  ],
};

function makeServices(overrides: Partial<EventsServices> = {}) {
  return {
    fetchEventsForYear: vi.fn(async (year: number) => ({ baseAddress: "Home" as string | null, events: eventsByYear[year] ?? [] })),
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
    await screen.findByText(/No events this year|Round trip/);
  });

  it("downloads a PDF listing every event of the selected year", async () => {
    const services = makeServices();
    render(<EventsListScreen accessToken="token" services={services} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2024");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(services.downloadEventsPdf).toHaveBeenCalledTimes(1));
    expect(services.fetchEventsForYear).toHaveBeenCalledWith(2024, "token");
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

    await waitFor(() => expect(services.fetchEventsForYear).toHaveBeenCalledWith(2022, "token"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled());
    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains why the PDF could not be generated", async () => {
    const services = makeServices({
      fetchEventsForYear: vi.fn(async () => {
        throw new Error("Could not load events (status 502)");
      }),
    });
    render(<EventsListScreen accessToken="token" services={services} />);
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    expect(services.downloadEventsPdf).not.toHaveBeenCalled();
  });

  function renderCurrentYear(events: Omit<EventWithMiles, "date">[], unit?: "miles" | "kilometers") {
    const year = new Date().getFullYear();
    const services = makeServices({
      fetchEventsForYear: vi.fn(async () => ({
        baseAddress: "Home" as string | null,
        events: events.map((event, i) => ({ ...event, date: `${year}-03-${String(i + 10)}` })),
      })),
    });
    render(<EventsListScreen accessToken="token" services={services} unit={unit} />);
    return year;
  }

  const rowOf = (name: string) => screen.getByText(name).closest("tr")!;

  it("lists the current year's events with date, name and round-trip distance next to each", async () => {
    const year = renderCurrentYear([
      { id: "x", name: "Client visit - Acme", location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 },
      { id: "y", name: "Office", location: "Office", distanceMeters: 3_218.688, miles: 2 },
    ]);

    expect(await screen.findByText("Client visit - Acme")).toBeInTheDocument();
    expect(screen.getByText(`10 March ${year}`)).toBeInTheDocument();
    expect(rowOf("Client visit - Acme")).toHaveTextContent("10.0 mi");
    expect(rowOf("Office")).toHaveTextContent("2.0 mi");
  });

  it("shows the distance in miles when the unit setting is miles", async () => {
    renderCurrentYear([{ id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 }], "miles");
    await screen.findByText("Acme");
    expect(rowOf("Acme")).toHaveTextContent("10.0 mi");
  });

  it("shows the distance in kilometers when the unit setting is kilometers", async () => {
    renderCurrentYear([{ id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 21_000, miles: 13.05 }], "kilometers");
    await screen.findByText("Acme");
    expect(rowOf("Acme")).toHaveTextContent("21.0 km");
  });

  it("shows no distance for events without a location or whose location cannot be found, and the others normally", async () => {
    renderCurrentYear([
      { id: "n", name: "No location", location: null, distanceMeters: null, miles: null },
      { id: "u", name: "Atlantis trip", location: "Atlantis", distanceMeters: null, miles: null },
      { id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 21_000, miles: 13.05 },
    ], "kilometers");

    await screen.findByText("Acme");
    expect(rowOf("No location").lastElementChild).toHaveTextContent(/^$/);
    expect(rowOf("Atlantis trip").lastElementChild).toHaveTextContent(/^$/);
    expect(rowOf("Acme")).toHaveTextContent("21.0 km");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an event of 10 mi as 16.1 km when the unit is kilometers", async () => {
    renderCurrentYear([{ id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 }], "kilometers");
    await screen.findByText("Acme");
    expect(rowOf("Acme").lastElementChild).toHaveTextContent(/^16\.1 km$/);
  });

  it("shows distances with exactly one decimal place", async () => {
    renderCurrentYear([{ id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 12.345 * 1609.344, miles: 12.345 }], "miles");
    await screen.findByText("Acme");
    expect(rowOf("Acme").lastElementChild).toHaveTextContent(/^12\.3 mi$/);
  });

  it("totals the events' distances in kilometers from the unrounded distances", async () => {
    // 1.04 mi each rounds to 1.7 km, but the total of 3.12 mi is 5.0 km, not 5.1 km.
    renderCurrentYear(
      ["a", "b", "c"].map((id) => ({ id, name: `Event ${id}`, location: "X", distanceMeters: 1.04 * 1609.344, miles: 1.04 })),
      "kilometers",
    );
    await screen.findByText("Event a");
    expect(rowOf("Event a").lastElementChild).toHaveTextContent("1.7 km");
    expect(rowOf("Total").lastElementChild).toHaveTextContent(/^5\.0 km$/);
  });

  it("totals the events' distances in miles, skipping unknown ones", async () => {
    renderCurrentYear([
      { id: "x", name: "Acme", location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 },
      { id: "n", name: "No location", location: null, distanceMeters: null, miles: null },
      { id: "y", name: "Office", location: "Office", distanceMeters: 3_218.688, miles: 2 },
    ], "miles");
    await screen.findByText("Acme");
    expect(rowOf("Total").lastElementChild).toHaveTextContent(/^12\.0 mi$/);
  });

  it("downloads the PDF in the chosen unit", async () => {
    const services = makeServices();
    render(<EventsListScreen accessToken="token" services={services} unit="kilometers" />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2024");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(services.downloadEventsPdf).toHaveBeenCalledTimes(1));
    expect(services.downloadEventsPdf).toHaveBeenCalledWith(
      expect.objectContaining({ rows: expect.arrayContaining([["15 March 2024", "Client visit - Acme", "67.6 km"]]) }),
    );
  });

  it("says which base address the miles are measured from", async () => {
    render(<EventsListScreen accessToken="token" services={makeServices()} />);
    expect(await screen.findByText("Miles from Home.")).toBeInTheDocument();
  });

  it("asks for a base address when none is saved", async () => {
    const services = makeServices({ fetchEventsForYear: vi.fn(async () => ({ baseAddress: null, events: [] })) });
    render(<EventsListScreen accessToken="token" services={services} />);

    expect(await screen.findByRole("link", { name: "Set your base address" })).toHaveAttribute("href", "/settings");
  });
});
