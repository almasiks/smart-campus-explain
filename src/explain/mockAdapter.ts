import type { ExplainAdapter, ExplainContext } from '@/explain/types';

export const MOCK_MODES = ['ok', 'timeout', 'error', 'nokey'] as const;
export type MockMode = (typeof MOCK_MODES)[number];

/**
 * Test-only failure simulation: reads ?explainMock=<mode>. The value is only
 * compared with the four fixed strings; it is never shown, logged or forwarded.
 * Missing or unknown values mean 'ok'.
 */
export function parseMockMode(search: string): MockMode {
  const value = new URLSearchParams(search).get('explainMock');
  return (MOCK_MODES as readonly string[]).includes(value ?? '')
    ? (value as MockMode)
    : 'ok';
}

/**
 * Friendlier demo wording, one template per reason code (source 'mock').
 * Deliberately different from fallbackText so the two sources are distinguishable.
 * Uses only facts from the context.
 */
export function mockText(ctx: ExplainContext): string {
  const c = ctx;
  switch (c.reasonCode) {
    case 'AVAILABLE':
      return `Good news: ${c.room} is free from ${c.start} to ${c.end}, a ${c.durationMinutes}-minute slot. Remember, this is just a check and nothing is reserved.`;
    case 'RANGE_INVALID':
      return `It looks like ${c.start}–${c.end} is not a usable time range. Try a start time that comes before the end time.`;
    case 'START_NOT_AFTER_NOW':
      return `That slot starts at ${c.start}, but it is already ${c.now}. Try a start time later than ${c.now}.`;
    case 'DURATION_TOO_LONG':
      return `${c.durationMinutes} minutes is a bit too long; slots can last up to ${c.maxDurationMinutes} minutes. Try a shorter time range.`;
    case 'ROOM_BLOCKED':
      return `Sorry, ${c.room} is blocked at the moment, so all requests are turned down. Please check again later.`;
    case 'OVERLAP':
      return c.conflict
        ? `Unfortunately ${c.start}–${c.end} clashes with an existing booking from ${c.conflict.start} to ${c.conflict.end}. Try a different time that does not overlap it.`
        : 'Unfortunately this time clashes with an existing booking.';
    case 'INPUT_INVALID':
      return 'Hmm, those times could not be read. Please type them as HH:MM and check again.';
    default:
      return 'Here is a short summary of the result.';
  }
}

/** Mock adapter. A plain function returning an object literal — no class, no factory registry. */
export function mockAdapter(mode: MockMode = 'ok'): ExplainAdapter {
  return {
    source: 'mock',
    explain(ctx) {
      switch (mode) {
        case 'timeout':
          return new Promise<string>(() => {}); // never settles
        case 'error':
          return Promise.reject(new Error('mock adapter error'));
        case 'nokey':
          return Promise.reject(new Error('explanation service not configured'));
        default:
          return Promise.resolve(mockText(ctx));
      }
    },
  };
}
