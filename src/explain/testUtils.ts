// Test helpers only (imported by *.test.ts files, never by the app).
import { checkAvailability, type AvailabilityResult } from '@/availability';
import { INITIAL_BOOKINGS, INITIAL_NOW, ROOM_NAME } from '@/data/fixtures';
import { buildContext } from '@/explain/context';
import type { ExplainContext, ReasonCode } from '@/explain/types';

export function submittedFor(start: number, end: number, blocked = false) {
  const outcome = checkAvailability(
    { name: ROOM_NAME, blocked },
    INITIAL_BOOKINGS,
    { start, end },
    INITIAL_NOW
  );
  return { start, end, outcome };
}

/** Mirrors the INPUT result App.tsx builds when HH:MM parsing fails. */
export const INPUT_SUBMITTED: { start: number; end: number; outcome: AvailabilityResult } = {
  start: -1,
  end: -1,
  outcome: {
    status: 'Unavailable',
    rule: 'INPUT',
    code: 'INPUT_INVALID',
    reason: 'Please enter valid times in HH:MM format (e.g. 09:30).',
  },
};

/** One real context per reason code, built from the fixtures (now = 09:00, booking 10:00–11:00). */
export const CONTEXTS: Record<ReasonCode, ExplainContext> = {
  AVAILABLE: buildContext(ROOM_NAME, submittedFor(660, 720), INITIAL_NOW),
  RANGE_INVALID: buildContext(ROOM_NAME, submittedFor(720, 660), INITIAL_NOW),
  START_NOT_AFTER_NOW: buildContext(ROOM_NAME, submittedFor(480, 510), INITIAL_NOW),
  DURATION_TOO_LONG: buildContext(ROOM_NAME, submittedFor(660, 781), INITIAL_NOW),
  ROOM_BLOCKED: buildContext(ROOM_NAME, submittedFor(780, 840, true), INITIAL_NOW),
  OVERLAP: buildContext(ROOM_NAME, submittedFor(630, 690), INITIAL_NOW),
  INPUT_INVALID: buildContext(ROOM_NAME, INPUT_SUBMITTED, INITIAL_NOW),
};

export const REASON_CODES = Object.keys(CONTEXTS) as ReasonCode[];
