import { validateContext } from '@/explain/context';
import { fallbackText, GENERIC_FALLBACK_TEXT } from '@/explain/fallback';
import { validateExplanation } from '@/explain/validate';
import type {
  ExplainAdapter,
  ExplainContext,
  Explanation,
  ExplanationSource,
} from '@/explain/types';

export const EXPLAIN_TIMEOUT_MS = 3000;

const PANEL_LABELS: Record<ExplanationSource, string> = {
  llm: 'AI-generated explanation — not a booking confirmation',
  mock: 'AI-generated explanation (demo) — not a booking confirmation',
  fallback: 'Standard explanation (AI unavailable) — not a booking confirmation',
};

/** Panel label per source (contract §f). A deterministic fallback is never labelled "AI-generated". */
export function panelLabel(source: ExplanationSource): string {
  return PANEL_LABELS[source];
}

function copyContext(ctx: ExplainContext): ExplainContext {
  return { ...ctx, conflict: ctx.conflict ? { ...ctx.conflict } : null };
}

/**
 * Orchestrator. Never throws and always resolves to an Explanation.
 * - invalid context            -> generic fallback, adapter NOT called
 * - INPUT_INVALID              -> fixed fallback, adapter NOT called (no raw text forwarded)
 * - timeout / error / no key   -> fallback
 * - output fails validation    -> fallback
 * The adapter gets a copy of the context, so it cannot alter what is validated.
 */
export async function explain(
  ctx: ExplainContext,
  adapter: ExplainAdapter,
  timeoutMs: number = EXPLAIN_TIMEOUT_MS
): Promise<Explanation> {
  let valid = false;
  try {
    valid = validateContext(ctx);
  } catch {
    valid = false;
  }
  if (!valid) return { text: GENERIC_FALLBACK_TEXT, source: 'fallback' };

  const fallback = (): Explanation => ({ text: fallbackText(ctx), source: 'fallback' });
  if (ctx.reasonCode === 'INPUT_INVALID') return fallback();

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('explain timeout')), timeoutMs);
    });
    const call = Promise.resolve().then(() => adapter.explain(copyContext(ctx)));
    const text = await Promise.race([call, timeout]);
    if (validateExplanation(text, ctx)) {
      return { text: text.trim(), source: adapter.source };
    }
    return fallback();
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}
