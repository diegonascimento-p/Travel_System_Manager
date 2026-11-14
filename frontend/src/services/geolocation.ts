import type { Coordinates } from "../models/event";

/** Asks the browser for the user's current position, reusing a recent fix when available. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Your browser cannot share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error("Allow location access to calculate miles traveled.")),
      { maximumAge: 10 * 60 * 1000, timeout: 15000 },
    );
  });
}
