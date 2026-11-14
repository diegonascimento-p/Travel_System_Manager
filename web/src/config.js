export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

/** Days before and after today for which events are read. */
export const EVENT_WINDOW_DAYS_BACK = 30;
export const EVENT_WINDOW_DAYS_AHEAD = 30;
