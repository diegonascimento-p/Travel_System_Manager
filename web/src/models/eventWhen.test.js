import { describe, expect, it } from 'vitest';
import { formatEventWhen } from './eventWhen.js';

const options = { locale: 'en-US', timeZone: 'America/New_York' };
const normalize = (text) => text.replace(/\s/g, ' ');

describe('formatEventWhen', () => {
  it('shows the date and start and end time of a timed event in the calendar time zone', () => {
    const text = formatEventWhen(
      { isAllDay: false, start: '2026-11-16T15:00:00Z', end: '2026-11-16T16:30:00Z' },
      options,
    );

    expect(normalize(text)).toMatch(/Nov 16, 2026, 10:00( AM)?\s*–\s*11:30 AM/);
  });

  it('shows only the start when a timed event has no end', () => {
    const text = formatEventWhen({ isAllDay: false, start: '2026-11-16T15:00:00Z' }, options);

    expect(normalize(text)).toBe('Nov 16, 2026, 10:00 AM');
  });

  it('shows a one-day all-day event as its date and "All day"', () => {
    const text = formatEventWhen({ isAllDay: true, start: '2026-11-16', end: '2026-11-17' }, options);

    expect(normalize(text)).toBe('Nov 16, 2026 · All day');
  });

  it('shows a multi-day all-day event as an inclusive date range', () => {
    const text = formatEventWhen({ isAllDay: true, start: '2026-11-16', end: '2026-11-19' }, options);

    expect(normalize(text)).toMatch(/^Nov 16\s*–\s*18, 2026 · All day$/);
  });
});
