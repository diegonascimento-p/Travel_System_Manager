import { createTrip, fetchMonthlyMileage, fetchTrip, fetchTrips, TripsApiError, updateTrip } from "./tripsApi";

const trip = { id: 1, date: "2026-11-03", origin: "Office", destination: "Acme HQ", distance: 42.5, purpose: "Visit" };
const { id: _id, ...input } = trip;

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("trips API service", () => {
  it("loads a page of trips", async () => {
    const page = { trips: [trip], total: 1, limit: 5, offset: 0 };
    const fetchMock = stubFetch(200, page);

    await expect(fetchTrips(5, 0)).resolves.toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith("/api/trips?limit=5&offset=0", expect.anything());
  });

  it("loads one trip", async () => {
    const fetchMock = stubFetch(200, trip);
    await expect(fetchTrip(1)).resolves.toEqual(trip);
    expect(fetchMock).toHaveBeenCalledWith("/api/trips/1", expect.anything());
  });

  it("loads a month's mileage", async () => {
    const fetchMock = stubFetch(200, { month: "2026-11", totalDistance: 12, tripCount: 2 });
    await expect(fetchMonthlyMileage("2026-11")).resolves.toMatchObject({ totalDistance: 12 });
    expect(fetchMock).toHaveBeenCalledWith("/api/trips/summary?month=2026-11", expect.anything());
  });

  it("creates a trip with a JSON POST", async () => {
    const fetchMock = stubFetch(201, trip);

    await expect(createTrip(input)).resolves.toEqual(trip);

    expect(fetchMock).toHaveBeenCalledWith("/api/trips", {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("updates a trip with a JSON PUT", async () => {
    const fetchMock = stubFetch(200, trip);
    await updateTrip(1, input);
    expect(fetchMock).toHaveBeenCalledWith("/api/trips/1", expect.objectContaining({ method: "PUT", body: JSON.stringify(input) }));
  });

  it("reports the API's field errors", async () => {
    stubFetch(400, { error: "The trip is invalid", fields: { distance: "Distance must be a number." } });

    const error = await createTrip(input).catch((e) => e);

    expect(error).toBeInstanceOf(TripsApiError);
    expect(error).toMatchObject({ status: 400, message: "The trip is invalid", fields: { distance: "Distance must be a number." } });
  });

  it("reports server errors", async () => {
    stubFetch(500, { error: "Could not process the trip request" });
    await expect(fetchTrips(20, 0)).rejects.toMatchObject({ status: 500, message: "Could not process the trip request" });
  });

  it("reports a missing trip", async () => {
    stubFetch(404, { error: "Trip 9 was not found" });
    await expect(fetchTrip(9)).rejects.toMatchObject({ status: 404, message: "The trip was not found." });
  });

  it("reports an unreachable server", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(fetchTrips(20, 0)).rejects.toMatchObject({ status: 0, message: expect.stringContaining("Could not reach") });
  });
});
