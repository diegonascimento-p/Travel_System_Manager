import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeTripsServices, trip } from "../testing/fakeTripsServices";
import { DashboardScreen } from "./DashboardScreen";

const today = new Date(2026, 10, 14);

describe("DashboardScreen", () => {
  it("totals the miles of the current month's trips only", async () => {
    const services = fakeTripsServices([
      trip(1, "2026-10-31", { distance: 100 }),
      trip(2, "2026-11-01", { distance: 12.5 }),
      trip(3, "2026-11-14", { distance: 30 }),
    ]);
    render(<DashboardScreen services={services} today={today} />);

    const miles = await screen.findByRole("region", { name: "Miles this month" });
    expect(within(miles).getByText("42.5 mi")).toBeInTheDocument();
    expect(within(miles).getByText("November 2026")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Trips this month" })).getByText("2")).toBeInTheDocument();
    expect(services.fetchMonthlyMileage).toHaveBeenCalledWith("2026-11");
  });

  it("lists the five most recent trips, newest first", async () => {
    const services = fakeTripsServices([
      trip(1, "2026-11-01"),
      trip(2, "2026-11-09"),
      trip(3, "2026-10-20"),
      trip(4, "2026-11-12"),
      trip(5, "2026-09-02"),
      trip(6, "2026-11-13"),
    ]);
    render(<DashboardScreen services={services} today={today} />);

    const recent = await screen.findByRole("region", { name: "Recent trips" });
    const rows = within(recent).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual([
      "13 November 2026",
      "12 November 2026",
      "9 November 2026",
      "1 November 2026",
      "20 October 2026",
    ]);
    expect(services.fetchTrips).toHaveBeenCalledWith(5, 0);
    expect(within(recent).getByRole("link", { name: "View all" })).toHaveAttribute("href", "/trips");
  });

  it("shows zero miles when the month has no trips", async () => {
    render(<DashboardScreen services={fakeTripsServices([trip(1, "2026-10-31")])} today={today} />);

    const miles = await screen.findByRole("region", { name: "Miles this month" });
    expect(within(miles).getByText("0 mi")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("invites to log a first trip when there are none", async () => {
    render(<DashboardScreen services={fakeTripsServices()} today={today} />);
    expect(await screen.findByText("No trips yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an error state when the API fails and loads again on retry", async () => {
    const services = fakeTripsServices([trip(1, "2026-11-02", { distance: 8 })]);
    services.fetchMonthlyMileage.mockRejectedValueOnce(new Error("The server answered with status 500."));
    render(<DashboardScreen services={services} today={today} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load the dashboard");
    expect(alert).toHaveTextContent("The server answered with status 500.");
    expect(screen.queryByText(/mi$/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    const miles = await screen.findByRole("region", { name: "Miles this month" });
    expect(within(miles).getByText("8 mi")).toBeInTheDocument();
  });

  it("is framed by the sidebar navigation and header", async () => {
    render(<DashboardScreen services={fakeTripsServices()} today={today} />);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Trips",
      "Add trip",
      "Calendar events",
      "Settings",
    ]);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Add trip" })).toHaveAttribute("href", "/trips/new");
    await screen.findByText("No trips yet");
  });
});
