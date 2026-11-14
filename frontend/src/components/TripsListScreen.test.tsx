import { render, screen, within } from "@testing-library/react";
import { renderWithUnit } from "../testing/fakeSettingsServices";
import { fakeTripsServices, trip } from "../testing/fakeTripsServices";
import { TripsListScreen } from "./TripsListScreen";

describe("TripsListScreen", () => {
  it("shows the trips in a table with date, origin, destination, distance and purpose", async () => {
    const services = fakeTripsServices([
      trip(1, "2026-11-03", { origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Client visit" }),
      trip(2, "2026-11-10", { origin: "Home", destination: "Depot", distance: 7, purpose: "Pickup" }),
    ]);
    render(<TripsListScreen page={1} services={services} />);

    const table = await screen.findByRole("table", { name: "All trips" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Date", "Origin", "Destination", "Distance", "Purpose", "Actions"]);
    const rows = within(table).getAllByRole("row").slice(1);
    expect(within(rows[0]).getAllByRole("cell").map((c) => c.textContent).slice(0, 5)).toEqual([
      "10 November 2026",
      "Home",
      "Depot",
      "7.0 mi",
      "Pickup",
    ]);
    expect(within(rows[1]).getAllByRole("cell").map((c) => c.textContent).slice(0, 5)).toEqual([
      "3 November 2026",
      "Office",
      "Acme HQ",
      "42.5 mi",
      "Client visit",
    ]);
    expect(within(rows[1]).getByRole("link", { name: /Edit trip from Office to Acme HQ/ })).toHaveAttribute(
      "href",
      "/trips/1/edit",
    );
    expect(table).toHaveClass("data-table");
  });

  it("shows each trip's distance in kilometers when Kilometers is selected", async () => {
    const services = fakeTripsServices([trip(1, "2026-11-03", { distance: 10 })]);
    renderWithUnit(<TripsListScreen page={1} services={services} />, "kilometers");

    const table = await screen.findByRole("table", { name: "All trips" });
    expect(await within(table).findByText("16.1 km")).toBeInTheDocument();
  });

  it("pages through trips 20 at a time", async () => {
    const trips = Array.from({ length: 45 }, (_, i) => trip(i + 1, `2026-01-${String((i % 28) + 1).padStart(2, "0")}`));
    const services = fakeTripsServices(trips);
    render(<TripsListScreen page={2} services={services} />);

    expect(await screen.findByText("Showing 21–40 of 45 trips")).toBeInTheDocument();
    expect(services.fetchTrips).toHaveBeenCalledWith(20, 20);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(21);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/trips");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/trips?page=3");
  });

  it("shows an empty state without trips", async () => {
    render(<TripsListScreen page={1} services={fakeTripsServices()} />);
    expect(await screen.findByText("No trips yet")).toBeInTheDocument();
  });

  it("shows an error state when the API fails", async () => {
    const services = fakeTripsServices([trip(1, "2026-11-03")]);
    services.fetchTrips.mockRejectedValue(new Error("Could not reach the server."));
    render(<TripsListScreen page={1} services={services} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the trips");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
