import type { Explanation } from '@/explain/types';

/**
 * Late-response guard (R2, Task 06/07), extracted from App.tsx so it is unit-tested.
 * An explanation is tied to the exact result object it explains (identity, not
 * deep equality). `result: null` means the request is pending.
 */
export type ExplainState<T> = { target: T; result: Explanation | null } | null;

/** True only if the state belongs to the result object that is displayed right now. */
export function isCurrentExplain<T>(
  explained: ExplainState<T>,
  submitted: T | null
): explained is { target: T; result: Explanation | null } {
  return explained !== null && submitted !== null && explained.target === submitted;
}

/**
 * State update for an arriving adapter response. A response is stored only if
 * its target is still the pending one; otherwise (stale/late) prev is returned unchanged.
 */
export function applyExplainResult<T>(
  prev: ExplainState<T>,
  target: T,
  result: Explanation
): ExplainState<T> {
  return prev !== null && prev.target === target ? { target, result } : prev;
}
