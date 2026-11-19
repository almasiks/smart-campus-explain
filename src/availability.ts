import { toHHMM, MINUTES_IN_DAY } from '@/time';

export { toHHMM, MINUTES_IN_DAY } from '@/time';

export type Booking = { start: number; end: number };

export type Room = { name: string; blocked: boolean };

export type AvailabilityRequest = { start: number; end: number };

export type AvailabilityResult =
  | { status: 'Available' }
  | { status: 'Unavailable'; rule: string; reason: string };

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
      reason: `Times must satisfy 00:00 <= start < end <= 24:00. You entered ${toHHMM(
        start
      )} to ${toHHMM(end)}.`,
    };
  }
  if (start <= now) {
    return {
      status: 'Unavailable',
      rule: 'AC1',
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
      reason: `Booking duration is ${duration} minutes, which exceeds the 120-minute maximum.`,
    };
  }
  if (room.blocked) {
    return {
      status: 'Unavailable',
      rule: 'AC3',
      reason: `The room is currently blocked. All availability requests are rejected while blocked.`,
    };
  }
  for (const b of bookings) {
    if (overlaps({ start, end }, b)) {
      return {
        status: 'Unavailable',
        rule: 'AC4',
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