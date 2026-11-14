export const FIRST_YEAR = 1900;

/** Years the user can pick, newest first: the current year down to 1900. */
export function selectableYears(today: Date = new Date()): number[] {
  const years: number[] = [];
  for (let year = today.getFullYear(); year >= FIRST_YEAR; year--) years.push(year);
  return years;
}
