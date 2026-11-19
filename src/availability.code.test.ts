import { describe, expect, it } from 'vitest';
import { checkAvailability, type Booking, type Room } from '@/availability';

// Practice #11: reason codes added to Unavailable results. Existing test files are unchanged.
const NOW = 540; // 09:00
const OPEN_ROOM: Room = { name: 'Room 301', blocked: false };
const BLOCKED_ROOM: Room = { name: 'Room 301', blocked: true };
const BOOKINGS: Booking[] = [{ start: 600, end: 660 }]; // 10:00-11:00

const check = (start: number, end: number, room: Room = OPEN_ROOM) =>
  checkAvailability(room, BOOKINGS, { start, end }, NOW);

describe('checkAvailability reason codes', () => {
  it('returns RANGE_INVALID with AC1 for start >= end and non-integer/NaN times', () => {
    expect(check(720, 720)).toMatchObject({ rule: 'AC1', code: 'RANGE_INVALID' });
    expect(check(780, 720)).toMatchObject({ rule: 'AC1', code: 'RANGE_INVALID' });
    expect(check(NaN, 700)).toMatchObject({ rule: 'AC1', code: 'RANGE_INVALID' });
    expect(check(660.5, 700.5)).toMatchObject({ rule: 'AC1', code: 'RANGE_INVALID' });
  });

  it('keeps the rule order: a past start with end < start is RANGE_INVALID, not START_NOT_AFTER_NOW', () => {
    expect(check(500, 400)).toMatchObject({ rule: 'AC1', code: 'RANGE_INVALID' });
  });

  it('returns START_NOT_AFTER_NOW with AC1 for start <= now', () => {
    expect(check(510, 570)).toMatchObject({ rule: 'AC1', code: 'START_NOT_AFTER_NOW' });
    expect(check(NOW, 570)).toMatchObject({ rule: 'AC1', code: 'START_NOT_AFTER_NOW' });
  });

  it('returns DURATION_TOO_LONG with AC2', () => {
    expect(check(660, 781)).toMatchObject({ rule: 'AC2', code: 'DURATION_TOO_LONG' });
  });

  it('returns ROOM_BLOCKED with AC3', () => {
    expect(check(780, 840, BLOCKED_ROOM)).toMatchObject({ rule: 'AC3', code: 'ROOM_BLOCKED' });
  });

  it('returns OVERLAP with AC4 and a copy of the conflicting booking', () => {
    const result = check(570, 630);
    expect(result).toMatchObject({
      rule: 'AC4',
      code: 'OVERLAP',
      conflict: { start: 600, end: 660 },
    });
    if (result.status !== 'Unavailable') throw new Error('expected Unavailable');
    expect(result.conflict).not.toBe(BOOKINGS[0]);
  });

  it('adds conflict only to OVERLAP results', () => {
    for (const r of [check(720, 720), check(510, 570), check(660, 781), check(780, 840, BLOCKED_ROOM)]) {
      expect(r).not.toHaveProperty('conflict');
    }
  });

  it('leaves the Available result exactly { status: "Available" }', () => {
    const result = check(660, 720);
    expect(result).toEqual({ status: 'Available' });
    expect(Object.keys(result)).toEqual(['status']);
  });
});
