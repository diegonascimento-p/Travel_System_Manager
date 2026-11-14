import { describe, expect, it, vi } from 'vitest';
import { CalendarAccessError, createGoogleCalendarRepository } from './googleCalendarRepository.js';

const apiUrl = 'https://calendar.test/v3';
const range = { accessToken: 'token-123', timeMin: new Date('2026-10-15T00:00:00Z'), timeMax: new Date('2026-12-15T00:00:00Z') };

const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('googleCalendarRepository.listEvents', () => {
  it('requests the primary calendar events in the window with the access token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const repository = createGoogleCalendarRepository({ apiUrl, fetchFn });

    await repository.listEvents(range);

    const [url, init] = fetchFn.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${apiUrl}/calendars/primary/events`);
    expect(parsed.searchParams.get('timeMin')).toBe('2026-10-15T00:00:00.000Z');
    expect(parsed.searchParams.get('timeMax')).toBe('2026-12-15T00:00:00.000Z');
    expect(parsed.searchParams.get('singleEvents')).toBe('true');
    expect(parsed.searchParams.get('orderBy')).toBe('startTime');
    expect(init.headers.Authorization).toBe('Bearer token-123');
  });

  it('returns title, date and time, and location of every event across pages', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          timeZone: 'America/New_York',
          nextPageToken: 'page-2',
          items: [
            {
              id: 'a',
              summary: 'Client meeting',
              location: '123 Main St',
              start: { dateTime: '2026-11-16T10:00:00-05:00' },
              end: { dateTime: '2026-11-16T11:00:00-05:00' },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            { id: 'b', summary: 'Gone', status: 'cancelled', start: { date: '2026-11-17' } },
            { id: 'c', summary: 'Desk day', start: { date: '2026-11-18' }, end: { date: '2026-11-19' } },
          ],
        }),
      );
    const repository = createGoogleCalendarRepository({ apiUrl, fetchFn });

    const result = await repository.listEvents(range);

    expect(new URL(fetchFn.mock.calls[1][0]).searchParams.get('pageToken')).toBe('page-2');
    expect(result.timeZone).toBe('America/New_York');
    expect(result.events).toEqual([
      {
        id: 'a',
        title: 'Client meeting',
        isAllDay: false,
        start: '2026-11-16T10:00:00-05:00',
        end: '2026-11-16T11:00:00-05:00',
        location: '123 Main St',
      },
      { id: 'c', title: 'Desk day', isAllDay: true, start: '2026-11-18', end: '2026-11-19', location: null },
    ]);
  });

  it('throws a CalendarAccessError when Google rejects the request', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    const repository = createGoogleCalendarRepository({ apiUrl, fetchFn });

    await expect(repository.listEvents(range)).rejects.toMatchObject({ name: 'CalendarAccessError', status: 401 });
    await expect(repository.listEvents(range)).rejects.toBeInstanceOf(CalendarAccessError);
  });
});
