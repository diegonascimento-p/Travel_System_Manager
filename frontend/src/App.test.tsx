import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { Trip } from "./models/trip";
import { setGoogleAccessToken } from "./services/googleSession";
import { localDate, localMonth } from "./utils/dates";

/** Answers the app's fetch calls like the trips API, keeping trips in memory. */
function fakeTripsBackend(initial: Trip[] = [], settings: Record<string, unknown> = { baseAddress: null, distanceUnit: "miles" }) {
  const trips = [...initial];
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  const newestFirst = () => [...trips].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  return vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input, "http://localhost");
    const method = init.method ?? "GET";
    if (url.pathname === "/api/settings") {
      if (method === "PUT") Object.assign(settings, JSON.parse(String(init.body)));
      return json(200, { ...settings });
    }
    if (url.pathname === "/api/events") {
      const event = { id: "e1", name: "Client visit", date: localDate(), location: "Acme HQ", distanceMeters: 16_093.44, miles: 10 };
      return json(200, { baseAddress: settings.baseAddress, events: [event] });
    }
    const id = Number(url.pathname.split("/")[3]);
    if (url.pathname === "/api/trips/summary") {
      const month = url.searchParams.get("month")!;
      const inMonth = trips.filter((t) => t.date.startsWith(month));
      return json(200, { month, totalDistance: inMonth.reduce((s, t) => s + t.distance, 0), tripCount: inMonth.length });
    }
    if (url.pathname === "/api/trips" && method === "GET") {
      const limit = Number(url.searchParams.get("limit"));
      const offset = Number(url.searchParams.get("offset"));
      return json(200, { trips: newestFirst().slice(offset, offset + limit), total: trips.length, limit, offset });
    }
    if (url.pathname === "/api/trips" && method === "POST") {
      const trip = { id: trips.length + 1, ...JSON.parse(String(init.body)) };
      trips.push(trip);
      return json(201, trip);
    }
    const index = trips.findIndex((t) => t.id === id);
    if (index < 0) return json(404, { error: "not found" });
    if (method === "PUT") trips[index] = { id, ...JSON.parse(String(init.body)) };
    return json(200, trips[index]);
  });
}

const navLink = (name: string) => within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name });

function openApp(path: string) {
  window.history.replaceState(null, "", path);
  return render(<App />);
}

afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("adds a trip through the API, then shows it in the trips list and on the dashboard", async () => {
    const backend = fakeTripsBackend();
    vi.stubGlobal("fetch", backend);
    openApp("/trips/new");

    await userEvent.type(screen.getByLabelText("Origin"), "Office");
    await userEvent.type(screen.getByLabelText("Destination"), "Acme HQ");
    await userEvent.type(screen.getByLabelText("Distance (miles)"), "42.5");
    await userEvent.type(screen.getByLabelText("Purpose"), "Client visit");
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    const table = await screen.findByRole("table", { name: "All trips" });
    expect(screen.getByRole("heading", { level: 1, name: "Trips" })).toBeInTheDocument();
    expect(within(table).getByText("Acme HQ")).toBeInTheDocument();
    expect(backend).toHaveBeenCalledWith("/api/trips", expect.objectContaining({ method: "POST" }));

    const nav = screen.getByRole("navigation", { name: "Main" });
    await userEvent.click(within(nav).getByRole("link", { name: "Dashboard" }));

    const miles = await screen.findByRole("region", { name: "Distance this month" });
    expect(within(miles).getByText("42.5 mi")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Recent trips" })).getByText("Client visit")).toBeInTheDocument();
  });

  it("opens the Add trip form from the dashboard's red Add trip button", async () => {
    vi.stubGlobal("fetch", fakeTripsBackend());
    openApp("/");

    await userEvent.click(within(screen.getByRole("banner")).getByRole("link", { name: "Add trip" }));

    expect(window.location.pathname).toBe("/trips/new");
    expect(screen.getByRole("heading", { level: 1, name: "Add trip" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save trip" })).toBeInTheDocument();
  });

  it("edits a trip from the trips list and shows the saved changes", async () => {
    const today = localDate();
    vi.stubGlobal(
      "fetch",
      fakeTripsBackend([{ id: 1, date: today, origin: "Office", destination: "Acme HQ", distance: 10, purpose: "Visit" }]),
    );
    openApp("/trips");

    await userEvent.click(await screen.findByRole("link", { name: /Edit trip from Office to Acme HQ/ }));
    const destination = await screen.findByLabelText("Destination");
    await userEvent.clear(destination);
    await userEvent.type(destination, "Depot");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const table = await screen.findByRole("table", { name: "All trips" });
    expect(within(table).getByText("Depot")).toBeInTheDocument();
    expect(within(table).queryByText("Acme HQ")).not.toBeInTheDocument();
  });

  it("shows an error state instead of data when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad gateway", { status: 502 })));
    openApp("/");

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load the dashboard");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("asks the API for the current month in the user's time zone", async () => {
    const backend = fakeTripsBackend();
    vi.stubGlobal("fetch", backend);
    openApp("/");

    await screen.findByRole("region", { name: "Distance this month" });
    expect(backend).toHaveBeenCalledWith(`/api/trips/summary?month=${localMonth()}`, expect.anything());
  });

  it("saves the distance unit to the account and shows every distance in it, also after signing in again", async () => {
    const settings = { baseAddress: "Home" as string | null, distanceUnit: "miles" };
    const backend = fakeTripsBackend(
      [{ id: 1, date: localDate(), origin: "Office", destination: "Acme HQ", distance: 10, purpose: "Visit" }],
      settings,
    );
    vi.stubGlobal("fetch", backend);
    act(() => setGoogleAccessToken("first-login"));
    openApp("/trips");
    expect(await within(await screen.findByRole("table", { name: "All trips" })).findByText("10.0 mi")).toBeInTheDocument();

    await userEvent.click(navLink("Settings"));
    const unit = await screen.findByRole("combobox", { name: "Distance unit" });
    expect(unit).toHaveDisplayValue("Miles");
    await userEvent.selectOptions(unit, "Kilometers");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.");
    expect(settings).toEqual({ baseAddress: "Home", distanceUnit: "kilometers" });

    await userEvent.click(navLink("Dashboard"));
    const total = await screen.findByRole("region", { name: "Distance this month" });
    expect(await within(total).findByText("16.1 km")).toBeInTheDocument();

    await userEvent.click(navLink("Calendar events"));
    const event = (await screen.findByText("Client visit")).closest("tr")!;
    expect(event.lastElementChild).toHaveTextContent(/^16\.1 km$/);
    expect(screen.getByText("Total").closest("tr")!.lastElementChild).toHaveTextContent(/^16\.1 km$/);

    // Log out and back in: the unit is loaded from the account again.
    act(() => setGoogleAccessToken(null));
    act(() => setGoogleAccessToken("second-login"));
    expect((await screen.findByText("Client visit")).closest("tr")!.lastElementChild).toHaveTextContent(/^16\.1 km$/);
    await userEvent.click(navLink("Settings"));
    expect(await screen.findByRole("combobox", { name: "Distance unit" })).toHaveDisplayValue("Kilometers");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Distance unit" }), "Miles");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("status");
    await userEvent.click(navLink("Calendar events"));
    expect((await screen.findByText("Client visit")).closest("tr")!.lastElementChild).toHaveTextContent(/^10\.0 mi$/);
  });

  it("shows a not found page for unknown addresses", () => {
    vi.stubGlobal("fetch", fakeTripsBackend());
    openApp("/candidates");
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  });
});
