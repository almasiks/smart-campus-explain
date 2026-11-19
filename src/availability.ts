import { toHHMM, MINUTES_IN_DAY } from '@/time';

export { toHHMM, MINUTES_IN_DAY } from '@/time';

export type Booking = { start: number; end: number };

export type Room = { name: string; blocked: boolean };

export type AvailabilityRequest = { start: number; end: number };

/**
 * Stable reason code for an Unavailable result (Practice #11, Explain feature).
 * Set in the same return statement as `rule`, so the two cannot drift apart.
 * 'INPUT_INVALID' is never returned by checkAvailability; only the UI sets it
 * when the HH:MM input cannot be parsed (rule 'INPUT').
 */
export type UnavailableCode =
  | 'RANGE_INVALID'
  | 'START_NOT_AFTER_NOW'
  | 'DURATION_TOO_LONG'
  | 'ROOM_BLOCKED'
  | 'OVERLAP'
  | 'INPUT_INVALID';

export type AvailabilityResult =
  | { status: 'Available' }
  | {
      status: 'Unavailable';
      rule: string;
      reason: string;
      code: UnavailableCode;
      /** Copy of the first conflicting booking; only present for OVERLAP (AC4). */
      conflict?: Booking;
    };

export const MAX_DURATION = 120;

export function overlaps(a: Booking, b: Booking): boolean {
  return a.start < b.end && b.start < a.end;
}

export function checkAvailability(
  room: Room,
  bookings: readonly Booking[],
  request: AvailabilityRequest,
  now: number
): AvailabilityResult {
  const { start, end } = request;
  

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > MINUTES_IN_DAY ||
    start >= end
  ) {
    return {
      status: 'Unavailable',
      rule: 'AC1',
      code: 'RANGE_INVALID',
      reason: `Times must satisfy 00:00 <= start < end <= 24:00. You entered ${toHHMM(
        start
      )} to ${toHHMM(end)}.`,
    };
  }
  if (start <= now) {
    return {
      status: 'Unavailable',
      rule: 'AC1',
      code: 'START_NOT_AFTER_NOW',
      reason: `Start time must be strictly after "now" (${toHHMM(
        now
      )}). ${toHHMM(start)} is not after now.`,
    };
  }
  const duration = end - start;
  if (duration > MAX_DURATION) {
    return {
      status: 'Unavailable',
      rule: 'AC2',
      code: 'DURATION_TOO_LONG',
      reason: `Booking duration is ${duration} minutes, which exceeds the 120-minute maximum.`,
    };
  }
  if (room.blocked) {
    return {
      status: 'Unavailable',
      rule: 'AC3',
      code: 'ROOM_BLOCKED',
      reason: `The room is currently blocked. All availability requests are rejected while blocked.`,
    };
  }
  for (const b of bookings) {
    if (overlaps({ start, end }, b)) {
      return {
        status: 'Unavailable',
        rule: 'AC4',
        code: 'OVERLAP',
        conflict: { start: b.start, end: b.end },
        reason: `The requested time (${toHHMM(start)}–${toHHMM(
          end
        )}) overlaps an existing booking (${toHHMM(b.start)}–${toHHMM(
          b.end
        )}).`,
      };
    }
  }
  return { status: 'Available' };
}