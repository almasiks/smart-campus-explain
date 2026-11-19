import type { ExplainContext } from '@/explain/types';

export const MAX_EXPLANATION_LENGTH = 280;
export const MAX_SENTENCES = 2;

/*
 * Phrase-level checks (contract §c, rules 4–5). Each entry is a whole phrase
 * matched on word boundaries, never a single word, so valid look-alikes such
 * as "is not blocked" or "is not available" are not rejected.
 */

/** An Unavailable explanation must not claim the slot can be taken. */
export const UNAVAILABLE_FORBIDDEN = [
  'is available',
  'is free',
  'is open for booking',
  'can be booked',
  'can book',
  'you can reserve',
  'can be reserved',
];

/** An Available explanation must not claim the slot cannot be taken. */
export const AVAILABLE_FORBIDDEN = [
  'is unavailable',
  'is not available',
  "isn't available",
  'is not free',
  "isn't free",
  'is blocked',
  'is already booked',
  'cannot be booked',
  "can't be booked",
  'overlaps an existing booking',
];

/** No explanation may claim a booking was created. */
export const BOOKING_MADE_FORBIDDEN = [
  'booked for you',
  'has been booked',
  'is now booked',
  'successfully booked',
  'we have booked',
  'i have booked',
  'booking is confirmed',
  'booking confirmed',
  'reservation is confirmed',
  'reservation confirmed',
  'your booking',
  'your reservation',
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(text: string, phrases: readonly string[]): boolean {
  return phrases.some((p) =>
    new RegExp(`(^|[^a-z0-9'])${escapeRegExp(p)}($|[^a-z0-9'])`, 'i').test(text)
  );
}

export function countSentences(text: string): number {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 0).length;
}

const TIME_RE = /\b\d{2}:\d{2}\b/g;
const ROOM_RE = /\broom\s+(\d+)\b/gi;

/** XAC1: every time, room name and number in the text must come from the context. */
export function usesOnlyContextFacts(text: string, ctx: ExplainContext): boolean {
  const times = new Set(
    [ctx.start, ctx.end, ctx.now, ctx.conflict?.start, ctx.conflict?.end].filter(
      (t): t is string => typeof t === 'string'
    )
  );
  const foundTimes = text.match(TIME_RE) ?? [];
  if (foundTimes.some((t) => !times.has(t))) return false;

  const roomId = ctx.room.replace(/^room\s+/i, '');
  for (const m of text.matchAll(ROOM_RE)) {
    if (m[1] !== roomId) return false;
  }

  const numbers = new Set<string>(
    [ctx.durationMinutes, ctx.maxDurationMinutes]
      .filter((n): n is number => typeof n === 'number')
      .map(String)
  );
  for (const n of ctx.room.match(/\d+/g) ?? []) numbers.add(n);

  const withoutTimes = text.replace(TIME_RE, ' ');
  const foundNumbers = withoutTimes.match(/\d+/g) ?? [];
  return foundNumbers.every((n) => numbers.has(n));
}

/** Output validation (contract §c). Untrusted text is only shown if this returns true. */
export function validateExplanation(text: unknown, ctx: ExplainContext): boolean {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length === 0 || t.length > MAX_EXPLANATION_LENGTH) return false;
  if (countSentences(t) > MAX_SENTENCES) return false;
  if (ctx.status === 'Unavailable' && containsPhrase(t, UNAVAILABLE_FORBIDDEN)) return false;
  if (ctx.status === 'Available' && containsPhrase(t, AVAILABLE_FORBIDDEN)) return false;
  if (containsPhrase(t, BOOKING_MADE_FORBIDDEN)) return false;
  return usesOnlyContextFacts(t, ctx);
}
