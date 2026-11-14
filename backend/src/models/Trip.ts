/** A trip logged for mileage tracking. */
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

/** The editable fields of a trip, already validated. */
export type TripInput = Omit<Trip, "id">;

export interface TripPage {
  trips: Trip[];
  /** Number of trips across all pages. */
  total: number;
}

/** Total miles of the trips in a calendar month. */
export interface MonthlyMileage {
  /** The month, YYYY-MM. */
  month: string;
  totalDistance: number;
  tripCount: number;
}
