const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Formats when an event happens, in the calendar's time zone so it matches
 * what the user sees in Google Calendar.
 *
 * Timed events: "Nov 16, 2026, 10:00 AM – 11:00 AM".
 * All-day events: "Nov 16, 2026 · All day" (or a date range for multi-day events).
 */
export function formatEventWhen(event, { locale, timeZone } = {}) {
  return event.isAllDay
    ? formatAllDay(event, locale)
    : formatTimed(event, locale, timeZone);
}

function formatTimed(event, locale, timeZone) {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  });
  const start = new Date(event.start);
  if (!event.end) return formatter.format(start);
  return formatter.formatRange(start, new Date(event.end));
}

function formatAllDay(event, locale) {
  // All-day dates are calendar dates without a time zone; format them in UTC
  // so they never shift to a neighbouring day.
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const start = parseDate(event.start);
  // Google's end date is exclusive: a one-day event ends on the next day.
  const lastDay = event.end ? new Date(parseDate(event.end).getTime() - DAY_MS) : start;
  const dates = lastDay > start ? formatter.formatRange(start, lastDay) : formatter.format(start);
  return `${dates} · All day`;
}

function parseDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
