const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formats a YYYY-MM-DD date as "15 March 2024" without shifting it across time zones. */
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Formats miles with at most one decimal, or "N/A" when unknown. */
export function formatMiles(miles: number | null): string {
  if (miles === null) return "N/A";
  return String(Math.round(miles * 10) / 10);
}
