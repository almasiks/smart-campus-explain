import { describe, expect, it } from 'vitest';
import {
  checkAvailability,
  overlaps,
  type Booking,
} from '@/availability';
import {
  parseHHMM,
  toHHMM,
  MINUTES_IN_DAY,
} from '@/time';
import {
  ROOM_NAME,
  INITIAL_NOW,
  INITIAL_BLOCKED,
  INITIAL_BOOKINGS,
} from '@/data/fixtures';

describe('parseHHMM', () => {
  it('parses a valid 24-hour time', () => {
    expect(parseHHMM('09:30')).toBe(570);
    expect(parseHHMM('00:00')).toBe(0);
    expect(parseHHMM('23:59')).toBe(1439);
  });

  it('rejects 24:00 unless allowMidnight is true', () => {
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('24:00', true)).toBe(MINUTES_IN_DAY);
  });

  it('rejects out-of-range hours and minutes', () => {
    expect(parseHHMM('25:00')).toBeNull();
    expect(parseHHMM('12:60')).toBeNull();
    expect(parseHHMM('-1:30')).toBeNull();
  });

  it('rejects malformed strings', () => {
    expect(parseHHMM('9:3')).toBeNull();
    expect(parseHHMM('abc')).toBeNull();
    expect(parseHHMM('')).toBeNull();
    expect(parseHHMM('0930')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(parseHHMM('  09:30  ')).toBe(570);
  });
});

describe('toHHMM', () => {
  it('formats minutes since midnight', () => {
    expect(toHHMM(0)).toBe('00:00');
    expect(toHHMM(570)).toBe('09:30');
    expect(toHHMM(1439)).toBe('23:59');
  });

  it('renders midnight-end as 24:00', () => {
    expect(toHHMM(MINUTES_IN_DAY)).toBe('24:00');
  });
});

describe('overlaps', () => {
  const booking: Booking = { start: 600, end: 660 }; // 10:00 - 11:00

  it('returns true when intervals overlap', () => {
    expect(overlaps({ start: 570, end: 630 }, booking)).toBe(true);
    expect(overlaps({ start: 610, end: 650 }, booking)).toBe(true);
  });

  it('returns false when intervals only touch at an endpoint (AC4)', () => {
    expect(overlaps({ start: 540, end: 600 }, booking)).toBe(false);
    expect(overlaps({ start: 660, end: 720 }, booking)).toBe(false);
  });

  it('returns true when one interval fully contains the other', () => {
    expect(overlaps({ start: 580, end: 700 }, booking)).toBe(true);
    expect(overlaps({ start: 610, end: 650 }, booking)).toBe(true);
  });

  it('returns false for disjoint intervals', () => {
    expect(overlaps({ start: 700, end: 760 }, { start: 800, end: 860 })).toBe(false);
  });
});

describe('fixtures (AC5)', () => {
  it('exposes the expected room name', () => {
    expect(ROOM_NAME).toBe('Room 301');
  });

  it('exposes the expected initial now (09:00)', () => {
    expect(INITIAL_NOW).toBe(540);
  });

  it('exposes the expected initial blocked state', () => {
    expect(INITIAL_BLOCKED).toBe(false);
  });

  it('exposes the expected initial bookings', () => {
    expect(INITIAL_BOOKINGS).toEqual([{ start: 600, end: 660 }]);
  });

  it('does not mutate fixtures when checkAvailability runs on them', () => {
    const snapshot = structuredClone(INITIAL_BOOKINGS);
    const room = { name: ROOM_NAME, blocked: INITIAL_BLOCKED };
    checkAvailability(room, INITIAL_BOOKINGS, { start: 570, end: 630 }, INITIAL_NOW); // overlap
    checkAvailability(room, INITIAL_BOOKINGS, { start: 660, end: 720 }, INITIAL_NOW); // touching
    expect(INITIAL_BOOKINGS).toEqual(snapshot);
  });
});
