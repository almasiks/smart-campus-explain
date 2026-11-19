import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAvailability, type Booking } from '@/availability';
import { INITIAL_NOW, ROOM_NAME } from '@/data/fixtures';
import { buildContext } from '@/explain/context';
import { EXPLAIN_TIMEOUT_MS, explain, panelLabel } from '@/explain/explain';
import { fallbackText, GENERIC_FALLBACK_TEXT } from '@/explain/fallback';
import { mockAdapter, mockText, parseMockMode } from '@/explain/mockAdapter';
import type { ExplainAdapter, ExplainContext } from '@/explain/types';
import { CONTEXTS, REASON_CODES } from '@/explain/testUtils';

const ctx = CONTEXTS.OVERLAP;
const fakeAdapter = (impl: (c: ExplainContext) => Promise<string>): ExplainAdapter => ({
  source: 'llm',
  explain: vi.fn(impl),
});

afterEach(() => {
  vi.useRealTimers();
});

describe('explain() with the mock adapter', () => {
  it.each(REASON_CODES.filter((c) => c !== 'INPUT_INVALID'))(
    'ok mode returns the mock text with source "mock" for %s',
    async (code) => {
      const result = await explain(CONTEXTS[code], mockAdapter('ok'));
      expect(result).toEqual({ text: mockText(CONTEXTS[code]), source: 'mock' });
    }
  );

  it('timeout mode falls back after exactly 3 s', async () => {
    vi.useFakeTimers();
    let settled = false;
    const p = explain(ctx, mockAdapter('timeout')).then((r) => {
      settled = true;
      return r;
    });
    await vi.advanceTimersByTimeAsync(EXPLAIN_TIMEOUT_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toEqual({ text: fallbackText(ctx), source: 'fallback' });
    expect(EXPLAIN_TIMEOUT_MS).toBe(3000);
  });

  it('error mode falls back', async () => {
    expect(await explain(ctx, mockAdapter('error'))).toEqual({
      text: fallbackText(ctx),
      source: 'fallback',
    });
  });

  it('nokey mode falls back', async () => {
    expect(await explain(ctx, mockAdapter('nokey'))).toEqual({
      text: fallbackText(ctx),
      source: 'fallback',
    });
  });
});

describe('explain() never throws and validates output', () => {
  it('falls back when the adapter throws synchronously', async () => {
    const adapter: ExplainAdapter = {
      source: 'llm',
      explain: () => {
        throw new Error('sync boom');
      },
    };
    expect(await explain(ctx, adapter)).toEqual({ text: fallbackText(ctx), source: 'fallback' });
  });

  it('falls back when the output contradicts the status', async () => {
    const adapter = fakeAdapter(async () => 'Room 301 is available.');
    expect((await explain(ctx, adapter)).source).toBe('fallback');
  });

  it('falls back when the output invents a time or claims a booking', async () => {
    expect((await explain(ctx, fakeAdapter(async () => 'Try 15:00 instead.'))).source).toBe('fallback');
    expect(
      (await explain(CONTEXTS.AVAILABLE, fakeAdapter(async () => 'Room 301 has been booked for you.'))).source
    ).toBe('fallback');
  });

  it('falls back when the output is not a string or too long', async () => {
    const notString = fakeAdapter(async () => ({ html: '<b>x</b>' }) as unknown as string);
    expect((await explain(ctx, notString)).source).toBe('fallback');
    expect((await explain(ctx, fakeAdapter(async () => 'a'.repeat(281)))).source).toBe('fallback');
  });

  it('returns valid adapter output with the adapter source, trimmed', async () => {
    const adapter = fakeAdapter(async () => '  The request overlaps the 10:00 to 11:00 booking.  ');
    expect(await explain(ctx, adapter)).toEqual({
      text: 'The request overlaps the 10:00 to 11:00 booking.',
      source: 'llm',
    });
  });

  it('does not call the adapter for INPUT_INVALID (no raw text forwarded)', async () => {
    const adapter = fakeAdapter(async () => 'never used');
    const result = await explain(CONTEXTS.INPUT_INVALID, adapter);
    expect(adapter.explain).not.toHaveBeenCalled();
    expect(result).toEqual({ text: fallbackText(CONTEXTS.INPUT_INVALID), source: 'fallback' });
  });

  it('does not call the adapter for an invalid context and uses the generic fallback', async () => {
    const adapter = fakeAdapter(async () => 'never used');
    const result = await explain({ ...ctx, room: 'Room 999' }, adapter);
    expect(adapter.explain).not.toHaveBeenCalled();
    expect(result).toEqual({ text: GENERIC_FALLBACK_TEXT, source: 'fallback' });
    expect(await explain(null as unknown as ExplainContext, adapter)).toEqual({
      text: GENERIC_FALLBACK_TEXT,
      source: 'fallback',
    });
  });
});

describe('XAC2: explanation never changes the decision or the bookings', () => {
  it('leaves bookings, the checker result and the context unchanged', async () => {
    const bookings: Booking[] = [{ start: 600, end: 660 }];
    const bookingsCopy = structuredClone(bookings);
    const outcome = checkAvailability({ name: ROOM_NAME, blocked: false }, bookings, { start: 630, end: 690 }, INITIAL_NOW);
    const outcomeCopy = structuredClone(outcome);
    const context = buildContext(ROOM_NAME, { start: 630, end: 690, outcome }, INITIAL_NOW);
    const contextCopy = structuredClone(context);

    const mutating = fakeAdapter(async (c) => {
      (c as { status: string }).status = 'Available';
      if (c.conflict) c.conflict.start = '00:00';
      return 'The request overlaps the 10:00 to 11:00 booking.';
    });
    const result = await explain(context, mutating);

    expect(result.source).toBe('llm');
    expect(bookings).toEqual(bookingsCopy);
    expect(outcome).toEqual(outcomeCopy);
    expect(context).toEqual(contextCopy);
  });
});

describe('panelLabel (XAC5)', () => {
  it('maps each source to its exact label', () => {
    expect(panelLabel('llm')).toBe('AI-generated explanation — not a booking confirmation');
    expect(panelLabel('mock')).toBe('AI-generated explanation (demo) — not a booking confirmation');
    expect(panelLabel('fallback')).toBe('Standard explanation (AI unavailable) — not a booking confirmation');
  });

  it('never labels the fallback as AI-generated and always says it is not a confirmation', () => {
    expect(panelLabel('fallback')).not.toContain('AI-generated');
    for (const s of ['llm', 'mock', 'fallback'] as const) {
      expect(panelLabel(s)).toContain('not a booking confirmation');
    }
  });
});

describe('parseMockMode', () => {
  it('reads the four known modes', () => {
    expect(parseMockMode('?explainMock=ok')).toBe('ok');
    expect(parseMockMode('?explainMock=timeout')).toBe('timeout');
    expect(parseMockMode('?explainMock=error')).toBe('error');
    expect(parseMockMode('?explainMock=nokey')).toBe('nokey');
  });

  it('defaults to ok for missing or unknown values', () => {
    expect(parseMockMode('')).toBe('ok');
    expect(parseMockMode('?other=1')).toBe('ok');
    expect(parseMockMode('?explainMock=<script>')).toBe('ok');
    expect(parseMockMode('?explainMock=TIMEOUT')).toBe('ok');
  });
});
