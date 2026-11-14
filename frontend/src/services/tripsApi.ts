import type { MonthlyMileage, Trip, TripFieldErrors, TripInput, TripPage } from "../models/trip";

/** The trips API answered with an error; `fields` holds its message per invalid trip field. */
export class TripsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: TripFieldErrors = {},
  ) {
    super(message);
  }
}

export interface TripsServices {
  fetchTrips(limit: number, offset: number): Promise<TripPage>;
  fetchTrip(id: number): Promise<Trip>;
  createTrip(input: TripInput): Promise<Trip>;
  updateTrip(id: number, input: TripInput): Promise<Trip>;
  fetchMonthlyMileage(month: string): Promise<MonthlyMileage>;
}

export function fetchTrips(limit: number, offset: number): Promise<TripPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request<TripPage>(`/api/trips?${params}`);
}

export function fetchTrip(id: number): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`);
}

export function createTrip(input: TripInput): Promise<Trip> {
  return request<Trip>("/api/trips", { method: "POST", body: JSON.stringify(input) });
}

export function updateTrip(id: number, input: TripInput): Promise<Trip> {
  return request<Trip>(`/api/trips/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

/** Total miles of a YYYY-MM month. */
export function fetchMonthlyMileage(month: string): Promise<MonthlyMileage> {
  return request<MonthlyMileage>(`/api/trips/summary?${new URLSearchParams({ month })}`);
}

export const defaultTripsServices: TripsServices = {
  fetchTrips,
  fetchTrip,
  createTrip,
  updateTrip,
  fetchMonthlyMileage,
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  } catch {
    throw new TripsApiError("Could not reach the server. Check your connection and try again.", 0);
  }
  if (!response.ok) throw await apiError(response);
  return (await response.json()) as T;
}

async function apiError(response: Response): Promise<TripsApiError> {
  const body = (await response.json().catch(() => ({}))) as { error?: string; fields?: TripFieldErrors };
  const message =
    response.status === 404 ? "The trip was not found." : (body.error ?? `The server answered with status ${response.status}.`);
  return new TripsApiError(message, response.status, body.fields ?? {});
}
