/** A trip logged for mileage tracking, as returned by the trips API. */
export interface Trip {
  id: number;
  /** Date of the trip, YYYY-MM-DD. */
  date: string;
  origin: string;
  destination: string;
  /** Distance traveled, in miles. */
  distance: number;
  purpose: string;
}

/** The fields sent to the API to create or update a trip. */
export type TripInput = Omit<Trip, "id">;

export interface TripPage {
  trips: Trip[];
  /** Number of trips across all pages. */
  total: number;
  limit: number;
  offset: number;
}

/** Total miles of the trips dated in a month. */
export interface MonthlyMileage {
  /** YYYY-MM */
  month: string;
  totalDistance: number;
  tripCount: number;
}

export type TripField = keyof TripInput;
export type TripFieldErrors = Partial<Record<TripField, string>>;
