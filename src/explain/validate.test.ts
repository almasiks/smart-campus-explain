import { describe, expect, it } from 'vitest';
import { countSentences, validateExplanation } from '@/explain/validate';
import { fallbackText, GENERIC_FALLBACK_TEXT } from '@/explain/fallback';
import { mockText } from '@/explain/mockAdapter';
import { CONTEXTS, REASON_CODES } from '@/explain/testUtils';

const A = CONTEXTS.AVAILABLE; // Room 301, 11:00–12:00, 60 min, now 09:00
const U = CONTEXTS.ROOM_BLOCKED; // Room 301, 13:00–14:00, Unavailable

describe('validateExplanation: basic rules', () => {
  it('accepts a short factual text', () => {
    expect(validateExplanation('Room 301 is free from 11:00 to 12:00.', A)).toBe(true);
  });

  it('rejects non-strings, empty and whitespace-only text', () => {
    expect(validateExplanation(undefined, A)).toBe(false);
    expect(validateExplanation(42, A)).toBe(false);
    expect(validateExplanation('', A)).toBe(false);
    expect(validateExplanation('   ', A)).toBe(false);
  });

  it('rejects text longer than 280 characters', () => {
    expect(validateExplanation('a'.repeat(280), A)).toBe(true);
    expect(validateExplanation('a'.repeat(281), A)).toBe(false);
  });

  it('rejects more than 2 sentences; colons in times do not count', () => {
    expect(countSentences('It is 11:00. Then 12:00.')).toBe(2);
    expect(validateExplanation('One. Two.', A)).toBe(true);
    expect(validateExplanation('One. Two. Three.', A)).toBe(false);
    expect(validateExplanation('One! Two? Three.', A)).toBe(false);
  });
});

describe('validateExplanation: contradictions (phrase-level)', () => {
  it('rejects an Unavailable text that says the room can be booked', () => {
    expect(validateExplanation('Room 301 is available.', U)).toBe(false);
    expect(validateExplanation('Room 301 can be booked.', U)).toBe(false);
    expect(validateExplanation('Good news, you can book it.', U)).toBe(false);
    expect(validateExplanation('The slot is free.', U)).toBe(false);
  });

  it('rejects an Available text that says the room cannot be booked', () => {
    expect(validateExplanation('Room 301 is blocked.', A)).toBe(false);
    expect(validateExplanation('Room 301 is not available.', A)).toBe(false);
    expect(validateExplanation('This time cannot be booked.', A)).toBe(false);
    expect(validateExplanation('Room 301 is already booked.', A)).toBe(false);
  });

  it('accepts valid look-alikes (no single-word matching)', () => {
    expect(validateExplanation('The room is not blocked and the time is free.', A)).toBe(true);
    expect(validateExplanation('Room 301 is not available for this request.', U)).toBe(true);
    expect(validateExplanation('Availability was checked; the room is blocked.', U)).toBe(true);
    expect(validateExplanation('This is free text about a blocked room.', A)).toBe(true);
  });

  it('rejects any claim that a booking was made, for both statuses', () => {
    expect(validateExplanation('Room 301 has been booked for you.', A)).toBe(false);
    expect(validateExplanation('Your booking is confirmed.', A)).toBe(false);
    expect(validateExplanation('Reservation confirmed.', U)).toBe(false);
    expect(validateExplanation('This is only a check; no booking was made.', A)).toBe(true);
  });
});

describe('validateExplanation: XAC1 facts only', () => {
  it('rejects times that are not in the context', () => {
    expect(validateExplanation('Room 301 is free from 11:00 to 13:00.', A)).toBe(false);
    expect(validateExplanation('Come back at 09:00.', A)).toBe(true); // now is in the context
  });

  it('rejects other room names', () => {
    expect(validateExplanation('Room 302 is free from 11:00 to 12:00.', A)).toBe(false);
    expect(validateExplanation('The room is free from 11:00 to 12:00.', A)).toBe(true);
  });

  it('rejects numbers that are not in the context (durations, limits, room number)', () => {
    expect(validateExplanation('Room 301 is free for 60 minutes.', A)).toBe(true);
    expect(validateExplanation('Room 301 is free for 90 minutes.', A)).toBe(false);
    expect(validateExplanation('Slots can last up to 120 minutes.', A)).toBe(true);
    expect(validateExplanation('Slots can last up to 150 minutes.', A)).toBe(false);
    expect(validateExplanation('Floor 3 is quiet.', A)).toBe(false);
    expect(validateExplanation('The request lasts 121 minutes.', CONTEXTS.DURATION_TOO_LONG)).toBe(true);
    expect(validateExplanation('The request lasts 122 minutes.', CONTEXTS.DURATION_TOO_LONG)).toBe(false);
  });

  it('allows no numbers at all for INPUT_INVALID', () => {
    expect(validateExplanation('Please use the HH:MM format.', CONTEXTS.INPUT_INVALID)).toBe(true);
    expect(validateExplanation('Please use 24-hour times.', CONTEXTS.INPUT_INVALID)).toBe(false);
  });
});

describe('fallback and mock texts', () => {
  it.each(REASON_CODES)('fallback text for %s passes the validator', (code) => {
    expect(validateExplanation(fallbackText(CONTEXTS[code]), CONTEXTS[code])).toBe(true);
  });

  it.each(REASON_CODES)('mock text for %s passes the validator', (code) => {
    expect(validateExplanation(mockText(CONTEXTS[code]), CONTEXTS[code])).toBe(true);
  });

  it.each(REASON_CODES)('mock text differs from fallback text for %s', (code) => {
    expect(mockText(CONTEXTS[code])).not.toBe(fallbackText(CONTEXTS[code]));
  });

  it('generic fallback passes the validator for both statuses', () => {
    expect(validateExplanation(GENERIC_FALLBACK_TEXT, A)).toBe(true);
    expect(validateExplanation(GENERIC_FALLBACK_TEXT, U)).toBe(true);
  });
});
