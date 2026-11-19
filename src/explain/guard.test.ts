import { describe, expect, it } from 'vitest';
import { applyExplainResult, isCurrentExplain, type ExplainState } from '@/explain/guard';
import type { Explanation } from '@/explain/types';

// R2 (Task 06/07): the late-response guard formerly inline in App.tsx (mutation M5).
type Target = { start: number; end: number };
const A: Target = { start: 660, end: 720 };
const B: Target = { start: 665, end: 720 };
const A_LOOKALIKE: Target = { start: 660, end: 720 }; // deep-equal to A, different object
const RESULT: Explanation = { text: 'Room 301 is free from 11:00 to 12:00.', source: 'mock' };

describe('applyExplainResult', () => {
  it('stores the response when it belongs to the pending target', () => {
    const prev: ExplainState<Target> = { target: A, result: null };
    expect(applyExplainResult(prev, A, RESULT)).toEqual({ target: A, result: RESULT });
  });

  it('ignores a stale response when a newer request is pending (returns prev unchanged)', () => {
    const prev: ExplainState<Target> = { target: B, result: null };
    expect(applyExplainResult(prev, A, RESULT)).toBe(prev);
  });

  it('ignores a stale response even when the targets are deep-equal but not the same object', () => {
    const prev: ExplainState<Target> = { target: A_LOOKALIKE, result: null };
    expect(applyExplainResult(prev, A, RESULT)).toBe(prev);
  });

  it('handles a null state without creating one', () => {
    expect(applyExplainResult<Target>(null, A, RESULT)).toBeNull();
  });
});

describe('isCurrentExplain', () => {
  it('is true only for the exact displayed result object', () => {
    expect(isCurrentExplain({ target: A, result: RESULT }, A)).toBe(true);
    expect(isCurrentExplain({ target: A, result: null }, A)).toBe(true); // pending
  });

  it('is false after the result was replaced (stale explanation is not shown)', () => {
    expect(isCurrentExplain({ target: A, result: RESULT }, B)).toBe(false);
    expect(isCurrentExplain({ target: A, result: RESULT }, A_LOOKALIKE)).toBe(false);
  });

  it('is false after the result was cleared, and for a null state', () => {
    expect(isCurrentExplain<Target>({ target: A, result: RESULT }, null)).toBe(false);
    expect(isCurrentExplain<Target>(null, A)).toBe(false);
    expect(isCurrentExplain<Target>(null, null)).toBe(false);
  });

  it('late-response sequence: clear while pending, then a late result arrives', () => {
    let state: ExplainState<Target> = { target: A, result: null }; // Explain clicked for A
    const displayed: Target | null = null; // input changed -> result cleared
    state = applyExplainResult(state, A, RESULT); // late response for A
    expect(isCurrentExplain(state, displayed)).toBe(false); // nothing shown
    const next: Target = { start: 665, end: 720 }; // new Check -> new object
    expect(isCurrentExplain(state, next)).toBe(false); // still nothing shown
  });
});
