import { describe, expect, it } from 'vitest';
import { checkAvailability, type Booking, type Room } from '@/availability';

const NOW = 540; // 09:00
const OPEN_ROOM: Room = { name: 'Room 301', blocked: false };
const BLOCKED_ROOM: Room = { name: 'Room 301', blocked: true };
const BOOKINGS: Booking[] = [{ start: 600, end: 660 }]; // 10:00-11:00

describe('checkAvailability', () => {
  it('rejects start equal to end (AC1)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 720, end: 720 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });

  it('rejects start after end (AC1)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 780, end: 720 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });

  it('rejects a start in the past (AC1)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 510, end: 570 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });

  it('rejects a start equal to now (AC1)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: NOW, end: 570 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });

  it('rejects a duration over 120 minutes (AC2)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 660, end: 781 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC2' });
  });

  it('accepts a duration of exactly 120 minutes (AC2)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 660, end: 780 }, NOW);
    expect(result).toEqual({ status: 'Available' });
  });

  it('rejects every request when the room is blocked (AC3)', () => {
    const result = checkAvailability(BLOCKED_ROOM, BOOKINGS, { start: 780, end: 840 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC3' });
  });

  it('rejects a request overlapping an existing booking (AC4)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 570, end: 630 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC4' });
  });

  it('accepts a request that only touches an existing booking endpoint (AC4)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 660, end: 720 }, NOW);
    expect(result).toEqual({ status: 'Available' });
  });

  it('does not modify the bookings array', () => {
    const bookings: Booking[] = [
      { start: 600, end: 660 },
      { start: 780, end: 840 },
    ];
    const copy = structuredClone(bookings);
    checkAvailability(OPEN_ROOM, bookings, { start: 570, end: 630 }, NOW);
    checkAvailability(OPEN_ROOM, bookings, { start: 660, end: 720 }, NOW);
    expect(bookings).toEqual(copy);
  });

  it('rejects NaN times instead of reporting Available (AC1, R1 regression)', () => {
    expect(checkAvailability(OPEN_ROOM, BOOKINGS, { start: NaN, end: 700 }, NOW)).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
    expect(checkAvailability(OPEN_ROOM, BOOKINGS, { start: 700, end: NaN }, NOW)).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });

  it('rejects non-integer minutes (AC1, R1 regression)', () => {
    const result = checkAvailability(OPEN_ROOM, BOOKINGS, { start: 660.5, end: 700.5 }, NOW);
    expect(result).toMatchObject({ status: 'Unavailable', rule: 'AC1' });
  });
});
