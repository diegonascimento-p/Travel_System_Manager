import { describe, expect, it } from 'vitest';
import { hasLocation, isActiveEvent, toCalendarEvent, UNTITLED_EVENT } from './calendarEvent.js';

describe('toCalendarEvent', () => {
  it('reads title, date and time, and location of a timed event', () => {
    const event = toCalendarEvent({
      id: 'e1',
      summary: 'Client meeting',
      location: '123 Main St',
      start: { dateTime: '2026-11-16T10:00:00-05:00' },
      end: { dateTime: '2026-11-16T11:00:00-05:00' },
    });

    expect(event).toEqual({
      id: 'e1',
      title: 'Client meeting',
      isAllDay: false,
      start: '2026-11-16T10:00:00-05:00',
      end: '2026-11-16T11:00:00-05:00',
      location: '123 Main St',
    });
  });

  it('reads the dates of an all-day event', () => {
    const event = toCalendarEvent({ id: 'e2', summary: 'Trade fair', start: { date: '2026-11-16' }, end: { date: '2026-11-17' } });

    expect(event).toMatchObject({ isAllDay: true, start: '2026-11-16', end: '2026-11-17' });
  });

  it.each([undefined, '', '   '])('treats location %j as no location', (location) => {
    const event = toCalendarEvent({ id: 'e3', summary: 'Call', location, start: { dateTime: '2026-11-16T10:00:00Z' } });

    expect(event.location).toBeNull();
    expect(hasLocation(event)).toBe(false);
  });

  it('trims the location', () => {
    const event = toCalendarEvent({ id: 'e4', location: '  123 Main St ', start: { dateTime: '2026-11-16T10:00:00Z' } });

    expect(event.location).toBe('123 Main St');
    expect(hasLocation(event)).toBe(true);
  });

  it('uses a placeholder for events without a title', () => {
    expect(toCalendarEvent({ id: 'e5', start: { dateTime: '2026-11-16T10:00:00Z' } }).title).toBe(UNTITLED_EVENT);
  });
});

describe('isActiveEvent', () => {
  it('excludes cancelled events', () => {
    expect(isActiveEvent({ status: 'cancelled', start: { date: '2026-11-16' } })).toBe(false);
    expect(isActiveEvent({ status: 'confirmed', start: { date: '2026-11-16' } })).toBe(true);
  });
});
