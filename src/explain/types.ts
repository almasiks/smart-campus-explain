import type { UnavailableCode } from '@/availability';

/** Stable reason code: one per checker branch, plus AVAILABLE and the UI-only INPUT_INVALID. */
export type ReasonCode = 'AVAILABLE' | UnavailableCode;

export type ExplainRule = 'AC1' | 'AC2' | 'AC3' | 'AC4' | 'INPUT' | null;

/**
 * Minimal structured context — the ONLY data an explanation adapter receives.
 * No user free text, no personal data, no secrets. Times are 'HH:MM' strings
 * produced by toHHMM from parsed minutes, never copied from the text inputs.
 */
export type ExplainContext = {
  room: string;
  start: string | null; // null only for INPUT_INVALID
  end: string | null; // null only for INPUT_INVALID
  status: 'Available' | 'Unavailable';
  rule: ExplainRule;
  reasonCode: ReasonCode;
  now: string;
  durationMinutes: number | null; // null for INPUT_INVALID and RANGE_INVALID
  maxDurationMinutes: number; // always MAX_DURATION (120)
  conflict: { start: string; end: string } | null; // only for OVERLAP
};

export type ExplanationSource = 'mock' | 'llm' | 'fallback';

/** Plain text only; never rendered as HTML. */
export type Explanation = { text: string; source: ExplanationSource };

/**
 * Adapter interface: one call, two possible providers (mock now, a server-side
 * LLM endpoint later). Output is UNTRUSTED until validateExplanation accepts it.
 */
export type ExplainAdapter = {
  source: 'mock' | 'llm';
  explain(ctx: ExplainContext): Promise<string>;
};
