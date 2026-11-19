import { MAX_DURATION, type AvailabilityResult } from '@/availability';
import { MINUTES_IN_DAY, parseHHMM, toHHMM } from '@/time';
import { ROOM_NAME } from '@/data/fixtures';
import type { ExplainContext, ExplainRule, ReasonCode } from '@/explain/types';

/** Expected status and rule for each reason code (contract §b). */
const EXPECTED: Record<ReasonCode, { status: ExplainContext['status']; rule: ExplainRule }> = {
  AVAILABLE: { status: 'Available', rule: null },
  RANGE_INVALID: { status: 'Unavailable', rule: 'AC1' },
  START_NOT_AFTER_NOW: { status: 'Unavailable', rule: 'AC1' },
  DURATION_TOO_LONG: { status: 'Unavailable', rule: 'AC2' },
  ROOM_BLOCKED: { status: 'Unavailable', rule: 'AC3' },
  OVERLAP: { status: 'Unavailable', rule: 'AC4' },
  INPUT_INVALID: { status: 'Unavailable', rule: 'INPUT' },
};

const MAX_FIELD_LENGTH = 16;

/**
 * Builds the minimal explanation context from a checker result that is
 * already displayed. Pure: reads its arguments, never mutates them.
 */
export function buildContext(
  room: string,
  submitted: { start: number; end: number; outcome: AvailabilityResult },
  now: number
): ExplainContext {
  const { outcome } = submitted;
  const reasonCode: ReasonCode =
    outcome.status === 'Available' ? 'AVAILABLE' : outcome.code;
  const hasTimes = reasonCode !== 'INPUT_INVALID';
  const hasDuration = hasTimes && reasonCode !== 'RANGE_INVALID';
  const conflict =
    outcome.status === 'Unavailable' && outcome.conflict
      ? { start: toHHMM(outcome.conflict.start), end: toHHMM(outcome.conflict.end) }
      : null;

  return {
    room,
    start: hasTimes ? toHHMM(submitted.start) : null,
    end: hasTimes ? toHHMM(submitted.end) : null,
    status: outcome.status,
    // rule is a plain string in AvailabilityResult; validateContext checks it.
    rule: outcome.status === 'Available' ? null : (outcome.rule as ExplainRule),
    reasonCode,
    now: toHHMM(now),
    durationMinutes: hasDuration ? submitted.end - submitted.start : null,
    maxDurationMinutes: MAX_DURATION,
    conflict,
  };
}

function isShortString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= MAX_FIELD_LENGTH;
}

function isTime(v: unknown): boolean {
  return isShortString(v) && /^\d{2}:\d{2}$/.test(v) && parseHHMM(v, true) !== null;
}

/** Runtime guard applied before any adapter call (contract §b, XAC3). */
export function validateContext(ctx: ExplainContext): boolean {
  if (typeof ctx !== 'object' || ctx === null) return false;
  if (!isShortString(ctx.room) || ctx.room !== ROOM_NAME) return false;
  if (!Object.prototype.hasOwnProperty.call(EXPECTED, ctx.reasonCode)) return false;

  const expected = EXPECTED[ctx.reasonCode];
  if (ctx.status !== expected.status || ctx.rule !== expected.rule) return false;
  if (!isTime(ctx.now)) return false;
  if (ctx.maxDurationMinutes !== MAX_DURATION) return false;

  if (ctx.reasonCode === 'INPUT_INVALID') {
    if (ctx.start !== null || ctx.end !== null) return false;
  } else if (!isTime(ctx.start) || !isTime(ctx.end)) {
    return false;
  }

  if (ctx.reasonCode === 'INPUT_INVALID' || ctx.reasonCode === 'RANGE_INVALID') {
    if (ctx.durationMinutes !== null) return false;
  } else if (
    !Number.isInteger(ctx.durationMinutes) ||
    (ctx.durationMinutes as number) < 0 ||
    (ctx.durationMinutes as number) > MINUTES_IN_DAY
  ) {
    return false;
  }

  if (ctx.reasonCode === 'OVERLAP') {
    if (!ctx.conflict || !isTime(ctx.conflict.start) || !isTime(ctx.conflict.end)) {
      return false;
    }
  } else if (ctx.conflict !== null) {
    return false;
  }

  return true;
}
