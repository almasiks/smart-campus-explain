import { describe, expect, it } from 'vitest';
import { validateContext } from '@/explain/context';
import type { ExplainContext } from '@/explain/types';
import { CONTEXTS, REASON_CODES } from '@/explain/testUtils';

describe('buildContext', () => {
  it('builds AVAILABLE with times, duration and no rule/conflict', () => {
    expect(CONTEXTS.AVAILABLE).toEqual({
      room: 'Room 301',
      start: '11:00',
      end: '12:00',
      status: 'Available',
      rule: null,
      reasonCode: 'AVAILABLE',
      now: '09:00',
      durationMinutes: 60,
      maxDurationMinutes: 120,
      conflict: null,
    });
  });

  it('distinguishes the two AC1 cases by reason code', () => {
    expect(CONTEXTS.RANGE_INVALID).toMatchObject({ rule: 'AC1', reasonCode: 'RANGE_INVALID' });
    expect(CONTEXTS.START_NOT_AFTER_NOW).toMatchObject({
      rule: 'AC1',
      reasonCode: 'START_NOT_AFTER_NOW',
      start: '08:00',
      now: '09:00',
      durationMinutes: 30,
    });
  });

  it('sets durationMinutes = null for RANGE_INVALID (contract amendment A1)', () => {
    expect(CONTEXTS.RANGE_INVALID).toMatchObject({
      start: '12:00',
      end: '11:00',
      durationMinutes: null,
    });
  });

  it('builds DURATION_TOO_LONG and ROOM_BLOCKED with their facts', () => {
    expect(CONTEXTS.DURATION_TOO_LONG).toMatchObject({ rule: 'AC2', durationMinutes: 121 });
    expect(CONTEXTS.ROOM_BLOCKED).toMatchObject({ rule: 'AC3', reasonCode: 'ROOM_BLOCKED' });
  });

  it('builds OVERLAP with the conflicting booking as HH:MM', () => {
    expect(CONTEXTS.OVERLAP).toMatchObject({
      rule: 'AC4',
      start: '10:30',
      end: '11:30',
      conflict: { start: '10:00', end: '11:00' },
    });
  });

  it('builds INPUT_INVALID without any times or duration (no raw input forwarded)', () => {
    expect(CONTEXTS.INPUT_INVALID).toMatchObject({
      rule: 'INPUT',
      start: null,
      end: null,
      durationMinutes: null,
      conflict: null,
    });
  });
});

describe('validateContext', () => {
  it('accepts every context built from the real checker', () => {
    for (const code of REASON_CODES) {
      expect(validateContext(CONTEXTS[code]), code).toBe(true);
    }
  });

  const bad = (base: ExplainContext, patch: Record<string, unknown>) =>
    validateContext({ ...base, ...patch } as ExplainContext);
  const A = CONTEXTS.AVAILABLE;

  it('rejects a room other than the fixture room', () => {
    expect(bad(A, { room: 'Room 302' })).toBe(false);
    expect(bad(A, { room: '' })).toBe(false);
    expect(bad(A, { room: 'Room 301 and more text' })).toBe(false);
  });

  it('rejects malformed or out-of-range times', () => {
    expect(bad(A, { start: '9:00' })).toBe(false);
    expect(bad(A, { end: '24:30' })).toBe(false);
    expect(bad(A, { now: '25:00' })).toBe(false);
    expect(bad(A, { start: null })).toBe(false);
    expect(bad(A, { start: 'x'.repeat(17) })).toBe(false);
  });

  it('rejects unknown reason codes and inconsistent status/rule', () => {
    expect(bad(A, { reasonCode: 'SOMETHING' })).toBe(false);
    expect(bad(A, { status: 'Unavailable' })).toBe(false);
    expect(bad(A, { rule: 'AC1' })).toBe(false);
    expect(bad(CONTEXTS.OVERLAP, { rule: 'AC3' })).toBe(false);
  });

  it('rejects invalid durations', () => {
    expect(bad(A, { durationMinutes: 60.5 })).toBe(false);
    expect(bad(A, { durationMinutes: -1 })).toBe(false);
    expect(bad(A, { durationMinutes: 1441 })).toBe(false);
    expect(bad(A, { durationMinutes: null })).toBe(false);
    expect(bad(CONTEXTS.RANGE_INVALID, { durationMinutes: -60 })).toBe(false);
    expect(bad(A, { maxDurationMinutes: 60 })).toBe(false);
  });

  it('requires conflict exactly for OVERLAP', () => {
    expect(bad(CONTEXTS.OVERLAP, { conflict: null })).toBe(false);
    expect(bad(CONTEXTS.OVERLAP, { conflict: { start: '1000', end: '11:00' } })).toBe(false);
    expect(bad(A, { conflict: { start: '10:00', end: '11:00' } })).toBe(false);
  });

  it('rejects INPUT_INVALID carrying any time text', () => {
    expect(bad(CONTEXTS.INPUT_INVALID, { start: '09:30' })).toBe(false);
  });
});
