import { describe, expect, it } from 'vitest';
import { getEventWindow } from './eventWindow.js';

describe('getEventWindow', () => {
  it('spans from the start of the day N days back to the end of the day N days ahead', () => {
    const { timeMin, timeMax } = getEventWindow(new Date(2026, 10, 14, 15, 30), 30, 30);

    expect(timeMin).toEqual(new Date(2026, 9, 15));
    expect(timeMax).toEqual(new Date(2026, 11, 15));
  });
});
