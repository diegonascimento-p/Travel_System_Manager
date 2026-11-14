import { useCallback, useEffect, useRef, useState } from 'react';
import { getEventWindow } from '../models/eventWindow.js';

const currentTime = () => new Date();

const INITIAL_STATE = {
  status: 'disconnected', // disconnected | connecting | loading | ready
  connected: false,
  events: [],
  timeZone: undefined,
  error: null, // { kind: 'auth' | 'events', message }
};

/**
 * Coordinates the Google Calendar connection and event loading for the views.
 * Holds no business rules: those live in the models, repository and services.
 */
export function useCalendarController({ authService, calendarRepository, windowDays, now = currentTime }) {
  const [state, setState] = useState(INITIAL_STATE);
  const accessToken = useRef(null);

  useEffect(() => {
    authService.preload().catch(() => {});
  }, [authService]);

  const loadEvents = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const { timeMin, timeMax } = getEventWindow(now(), windowDays.back, windowDays.ahead);
      const { events, timeZone } = await calendarRepository.listEvents({
        accessToken: accessToken.current,
        timeMin,
        timeMax,
      });
      setState((s) => ({ ...s, status: 'ready', events, timeZone }));
    } catch {
      setState((s) => ({
        ...s,
        status: 'ready',
        error: { kind: 'events', message: 'Could not read your Google Calendar events. Please try again.' },
      }));
    }
  }, [calendarRepository, windowDays, now]);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, status: 'connecting', error: null }));
    try {
      accessToken.current = await authService.connect();
    } catch {
      setState({
        ...INITIAL_STATE,
        error: {
          kind: 'auth',
          message: 'Google Calendar was not connected. Access was denied or the connection failed. Please try again.',
        },
      });
      return;
    }
    setState((s) => ({ ...s, connected: true }));
    await loadEvents();
  }, [authService, loadEvents]);

  return { ...state, connect, reload: loadEvents };
}
