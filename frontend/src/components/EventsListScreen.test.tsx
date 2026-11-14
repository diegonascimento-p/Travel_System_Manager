import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EventsServices } from "../controllers/yearlyEventsPdfController";
import type { EventWithMiles } from "../models/event";
import { EventsListScreen } from "./EventsListScreen";

const eventsByYear: Record<number, EventWithMiles[]> = {
  2024: [
    { id: "a", name: "Client visit - Acme", date: "2024-03-15", location: "Acme HQ", miles: 42 },
    { id: "b", name: "Workshop", date: "2024-06-01", location: "Hall", miles: 7.5 },
    { id: "c", name: "Review", date: "2024-12-31", location: "Office", miles: 3 },
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
    await screen.findByText(/No events this year|Miles traveled/);
  });

  it("downloads a PDF listing every event of the selected year", async () => {
    const services = makeServices();
    render(<EventsListScreen accessToken="token" services={services} />);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2024");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));

    await waitFor(() => expect(services.downloadEventsPdf).toHaveBeenCalledTimes(1));
    expect(services.fetchEventsForYear).toHaveBeenCalledWith(2024, "token");
    expect(services.downloadEventsPdf).toHaveBeenCalledWith({
      title: "Miles traveled in 2024",
      fileName: "miles-traveled-2024.pdf",
      head: ["Date", "Event", "Miles traveled"],
      rows: [
        ["15 March 2024", "Client visit - Acme", "42"],
        ["1 June 2024", "Workshop", "7.5"],
        ["31 December 2024", "Review", "3"],
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

  it("lists the current year's events with date, name and miles", async () => {
    const year = new Date().getFullYear();
    eventsByYear[year] = [
      { id: "x", name: "Client visit - Acme", date: `${year}-03-15`, location: "Acme HQ", miles: 42 },
    ];
    render(<EventsListScreen accessToken="token" services={makeServices()} />);

    expect(await screen.findByText("Client visit - Acme")).toBeInTheDocument();
    expect(screen.getByText(`15 March ${year}`)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    delete eventsByYear[year];
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
