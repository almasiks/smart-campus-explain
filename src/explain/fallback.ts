import type { ExplainContext } from '@/explain/types';

/** Shown when the context itself is invalid, so no fact can be trusted. */
export const GENERIC_FALLBACK_TEXT =
  'No explanation can be shown right now. Please rely on the status shown above.';

/**
 * Deterministic, neutral fallback sentence per reason code (source 'fallback').
 * Uses only facts from the context. Never throws.
 */
export function fallbackText(ctx: ExplainContext): string {
  const c = ctx;
  switch (c.reasonCode) {
    case 'AVAILABLE':
      return `${c.room} is free from ${c.start} to ${c.end} (${c.durationMinutes} minutes). This is only a check, not a booking.`;
    case 'RANGE_INVALID':
      return `The requested time ${c.start}–${c.end} is not a valid range, because the start must be before the end within the same day.`;
    case 'START_NOT_AFTER_NOW':
      return `The requested start ${c.start} is not later than the current time ${c.now}. Choose a start time after ${c.now}.`;
    case 'DURATION_TOO_LONG':
      return `The requested duration of ${c.durationMinutes} minutes is longer than the ${c.maxDurationMinutes}-minute maximum.`;
    case 'ROOM_BLOCKED':
      return `${c.room} is blocked right now, so every request is rejected.`;
    case 'OVERLAP':
      return c.conflict
        ? `The requested time ${c.start}–${c.end} overlaps an existing booking from ${c.conflict.start} to ${c.conflict.end}.`
        : GENERIC_FALLBACK_TEXT;
    case 'INPUT_INVALID':
      return 'The times could not be read. Please enter the start and end times in the HH:MM format.';
    default:
      return GENERIC_FALLBACK_TEXT;
  }
}
