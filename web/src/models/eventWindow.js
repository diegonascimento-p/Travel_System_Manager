const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the time range of events to read: from the start of the day
 * `daysBack` days ago until the start of the day `daysAhead + 1` days ahead.
 */
export function getEventWindow(now, daysBack, daysAhead) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    timeMin: new Date(startOfToday.getTime() - daysBack * DAY_MS),
    timeMax: new Date(startOfToday.getTime() + (daysAhead + 1) * DAY_MS),
  };
}
