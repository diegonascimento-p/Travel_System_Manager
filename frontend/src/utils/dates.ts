const pad = (value: number): string => String(value).padStart(2, "0");

/** The month of a date in the user's local time zone, YYYY-MM. */
export function localMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** The day of a date in the user's local time zone, YYYY-MM-DD. */
export function localDate(date: Date = new Date()): string {
  return `${localMonth(date)}-${pad(date.getDate())}`;
}

/** Formats a YYYY-MM month as "November 2026". */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}
