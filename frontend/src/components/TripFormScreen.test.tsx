import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripsApiError } from "../services/tripsApi";
import { fakeTripsServices, trip } from "../testing/fakeTripsServices";
import { TripFormScreen } from "./TripFormScreen";

const today = new Date(2026, 10, 14);

async function fill(fields: Partial<Record<"Date" | "Origin" | "Destination" | "Distance (miles)" | "Purpose", string>>) {
  for (const [label, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(label);
    await userEvent.clear(input);
    if (value) await userEvent.type(input, value);
  }
}

beforeEach(() => window.history.replaceState(null, "", "/trips/new"));

describe("TripFormScreen (add)", () => {
  it("creates the trip through the API and goes to the trips list", async () => {
    const services = fakeTripsServices();
    render(<TripFormScreen services={services} today={today} />);
    expect(screen.getByLabelText("Date")).toHaveValue("2026-11-14");

    await fill({ Origin: "Office", Destination: "Acme HQ", "Distance (miles)": "42.5", Purpose: "Client visit" });
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    await waitFor(() => expect(window.location.pathname).toBe("/trips"));
    expect(services.createTrip).toHaveBeenCalledWith({
      date: "2026-11-14",
      origin: "Office",
      destination: "Acme HQ",
      distance: 42.5,
      purpose: "Client visit",
    });
  });

  it("does not save with required fields missing", async () => {
    const services = fakeTripsServices();
    render(<TripFormScreen services={services} today={today} />);

    await fill({ Origin: "Office" });
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please fix the highlighted fields.");
    expect(screen.getByText("Destination is required.")).toBeInTheDocument();
    expect(screen.getByText("Distance is required.")).toBeInTheDocument();
    expect(screen.getByText("Purpose is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Distance (miles)")).toHaveFocus();
    expect(services.createTrip).not.toHaveBeenCalled();
  });

  it("does not save a non-numeric distance", async () => {
    const services = fakeTripsServices();
    render(<TripFormScreen services={services} today={today} />);

    await fill({ Origin: "Office", Destination: "Acme HQ", "Distance (miles)": "far", Purpose: "Visit" });
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(screen.getByText("Distance must be a number.")).toBeInTheDocument();
    expect(services.createTrip).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/trips/new");
  });

  it("shows an error and keeps the entered values when the API fails", async () => {
    const services = fakeTripsServices();
    services.createTrip.mockRejectedValueOnce(new TripsApiError("Could not reach the server.", 0));
    render(<TripFormScreen services={services} today={today} />);

    await fill({ Origin: "Office", Destination: "Acme HQ", "Distance (miles)": "3", Purpose: "Visit" });
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the trip");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the server.");
    expect(screen.getByLabelText("Origin")).toHaveValue("Office");
    expect(screen.getByRole("button", { name: "Save trip" })).toBeEnabled();
    expect(window.location.pathname).toBe("/trips/new");
  });

  it("shows the API's message next to the field it rejected", async () => {
    const services = fakeTripsServices();
    services.createTrip.mockRejectedValueOnce(
      new TripsApiError("The trip is invalid", 400, { distance: "Distance must be at most 100000 miles." }),
    );
    render(<TripFormScreen services={services} today={today} />);

    await fill({ Origin: "Office", Destination: "Acme HQ", "Distance (miles)": "3", Purpose: "Visit" });
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(await screen.findByText("Distance must be at most 100000 miles.")).toBeInTheDocument();
  });
});

describe("TripFormScreen (edit)", () => {
  it("loads the trip, saves every changed field through the API and goes to the trips list", async () => {
    const services = fakeTripsServices([
      trip(7, "2026-11-03", { origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Client visit" }),
    ]);
    render(<TripFormScreen tripId={7} services={services} today={today} />);

    expect(await screen.findByLabelText("Origin")).toHaveValue("Office");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-11-03");
    expect(screen.getByLabelText("Distance (miles)")).toHaveValue("42.5");
    expect(screen.getByRole("heading", { level: 1, name: "Edit trip" })).toBeInTheDocument();

    await fill({ Date: "2026-11-05", Origin: "Home", Destination: "Depot", "Distance (miles)": "7", Purpose: "Pickup" });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(window.location.pathname).toBe("/trips"));
    expect(services.updateTrip).toHaveBeenCalledWith(7, {
      date: "2026-11-05",
      origin: "Home",
      destination: "Depot",
      distance: 7,
      purpose: "Pickup",
    });
  });

  it("shows an error state when the trip cannot be loaded", async () => {
    const services = fakeTripsServices();
    services.fetchTrip.mockRejectedValueOnce(new TripsApiError("The trip was not found.", 404));
    render(<TripFormScreen tripId={99} services={services} today={today} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The trip was not found.");
    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
  });
});
