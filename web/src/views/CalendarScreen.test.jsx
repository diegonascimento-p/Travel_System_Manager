// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createGoogleCalendarRepository } from '../repositories/googleCalendarRepository.js';
import { CalendarAuthError } from '../services/googleAuthService.js';
import { CalendarScreen } from './CalendarScreen.jsx';

const windowDays = { back: 30, ahead: 30 };

const googleEvents = [
  {
    id: 'a',
    summary: 'Client meeting',
    location: '123 Main St',
    start: { dateTime: '2026-11-16T10:00:00-05:00' },
    end: { dateTime: '2026-11-16T11:00:00-05:00' },
  },
  {
    id: 'b',
    summary: 'Site visit',
    location: '9 Harbor Rd',
    start: { dateTime: '2026-11-17T14:00:00-05:00' },
    end: { dateTime: '2026-11-17T15:00:00-05:00' },
  },
  {
    id: 'c',
    summary: 'Team call',
    start: { dateTime: '2026-11-18T09:00:00-05:00' },
    end: { dateTime: '2026-11-18T09:30:00-05:00' },
  },
];

function setup({ auth = vi.fn().mockResolvedValue('token-123'), fetchFn } = {}) {
  const authService = { preload: vi.fn().mockResolvedValue(), connect: auth };
  const fetch =
    fetchFn ??
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ timeZone: 'America/New_York', items: googleEvents }),
    });
  const calendarRepository = createGoogleCalendarRepository({ apiUrl: 'https://calendar.test/v3', fetchFn: fetch });
  render(<CalendarScreen authService={authService} calendarRepository={calendarRepository} windowDays={windowDays} />);
  return { authService, fetch, user: userEvent.setup() };
}

const eventItem = (title) => screen.getByRole('heading', { name: title }).closest('li');

describe('CalendarScreen', () => {
  it('shows the calendar as connected after the user grants access', async () => {
    const { user, authService } = setup();
    expect(screen.queryByText('Google Calendar connected')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));

    expect(authService.connect).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Google Calendar connected')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect Google Calendar' })).not.toBeInTheDocument();
  });

  it('retrieves the saved events once the connection completes', async () => {
    const { user, fetch } = setup();

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));
    await screen.findByRole('list', { name: 'Calendar events' });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token-123');
  });

  it('lists every event with its title, date and time, and location', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));
    const list = await screen.findByRole('list', { name: 'Calendar events' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    const meeting = eventItem('Client meeting');
    expect(meeting).toHaveTextContent('123 Main St');
    expect(meeting.textContent.replace(/\s/g, ' ')).toMatch(/Nov 16, 2026, 10:00( AM)?\s*–\s*11:00 AM/);
    const visit = eventItem('Site visit');
    expect(visit).toHaveTextContent('9 Harbor Rd');
    expect(visit.textContent.replace(/\s/g, ' ')).toMatch(/Nov 17, 2026, 2:00( PM)?\s*–\s*3:00 PM/);
  });

  it('keeps events without a location in the list and marks only them as having no location', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));
    await screen.findByRole('list', { name: 'Calendar events' });

    expect(within(eventItem('Team call')).getByText('No location')).toBeInTheDocument();
    expect(within(eventItem('Client meeting')).queryByText('No location')).not.toBeInTheDocument();
    expect(screen.getAllByText('No location')).toHaveLength(1);
  });

  it('shows an error and lets the user retry when access is denied', async () => {
    const auth = vi
      .fn()
      .mockRejectedValueOnce(new CalendarAuthError('denied', 'access_denied'))
      .mockResolvedValueOnce('token-123');
    const { user } = setup({ auth });

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Google Calendar was not connected');
    expect(screen.queryByText('Google Calendar connected')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));
    expect(await screen.findByText('Google Calendar connected')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when events cannot be read', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: googleEvents }) });
    const { user } = setup({ fetchFn });

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read your Google Calendar events');

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list', { name: 'Calendar events' })).toBeInTheDocument();
  });

  it('shows a message when there are no events', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ items: [] }) });
    const { user } = setup({ fetchFn });

    await user.click(screen.getByRole('button', { name: 'Connect Google Calendar' }));

    expect(await screen.findByText('No events found in this period.')).toBeInTheDocument();
  });
});
