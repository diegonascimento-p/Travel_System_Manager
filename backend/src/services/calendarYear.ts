export const MIN_YEAR = 1900;

/** True when the year is a whole number between 1900 and the current year. */
export function isSupportedYear(year: number, today: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= today.getFullYear();
}

/** First and last day (YYYY-MM-DD) of a calendar year. */
export function yearBounds(year: number): { from: string; to: string } {
  const padded = String(year).padStart(4, "0");
  return { from: `${padded}-01-01`, to: `${padded}-12-31` };
}

/** True when a YYYY-MM-DD date falls in the given calendar year. */
export function isInYear(isoDate: string, year: number): boolean {
  return isoDate.slice(0, 4) === String(year).padStart(4, "0");
}
