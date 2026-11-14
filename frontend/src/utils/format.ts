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

const distanceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** Formats a distance in miles with at most one decimal and thousands separators, e.g. "1,234.5 mi". */
export function formatDistance(miles: number): string {
  return `${distanceFormat.format(miles)} mi`;
}
