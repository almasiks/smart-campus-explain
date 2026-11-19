import { useMemo, useState } from 'react';
import {
  DoorOpen,
  Clock,
  Lock,
  Unlock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info,
  MessageSquareText,
} from 'lucide-react';
import {
  checkAvailability,
  toHHMM,
  type AvailabilityResult,
  type Booking,
} from '@/availability';
import { parseHHMM } from '@/time';
import {
  ROOM_NAME,
  INITIAL_NOW,
  INITIAL_BLOCKED,
  INITIAL_BOOKINGS,
} from '@/data/fixtures';
import { buildContext } from '@/explain/context';
import { explain, panelLabel } from '@/explain/explain';
import { applyExplainResult, isCurrentExplain, type ExplainState } from '@/explain/guard';
import { mockAdapter, parseMockMode } from '@/explain/mockAdapter';
import type { Explanation } from '@/explain/types';

// Read-only adapter chosen once; ?explainMock=ok|timeout|error|nokey is test-only.
const explainAdapter = mockAdapter(parseMockMode(window.location.search));

function App() {
  const [now] = useState(INITIAL_NOW);
  const [blocked, setBlocked] = useState(INITIAL_BLOCKED);
  const [bookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  const [startInput, setStartInput] = useState('09:30');
  const [endInput, setEndInput] = useState('10:00');

  const [submitted, setSubmitted] = useState<{
    start: number;
    end: number;
    outcome: AvailabilityResult;
  } | null>(null);

  const parsedStart = useMemo(() => parseHHMM(startInput), [startInput]);
  const parsedEnd = useMemo(() => parseHHMM(endInput, true), [endInput]);

  const handleCheck = () => {
    if (parsedStart === null || parsedEnd === null) {
      setSubmitted({
        start: -1,
        end: -1,
        outcome: {
          status: 'Unavailable',
          rule: 'INPUT',
          code: 'INPUT_INVALID',
          reason: 'Please enter valid times in HH:MM format (e.g. 09:30).',
        },
      });
      return;
    }
    const outcome = checkAvailability(
      { name: ROOM_NAME, blocked },
      bookings,
      { start: parsedStart, end: parsedEnd },
      now
    );
    setSubmitted({ start: parsedStart, end: parsedEnd, outcome });
  };

  const handleReset = () => {
    setSubmitted(null);
  };

  // Explanation is tied to the exact result object it explains. When the result
  // is cleared or replaced, `submitted` is a new value, so a stale or late
  // explanation no longer matches and is never shown.
  const [explained, setExplained] = useState<ExplainState<NonNullable<typeof submitted>>>(null);
  const isCurrent = isCurrentExplain(explained, submitted);
  const explainPending = isCurrent && explained.result === null;
  const explanation: Explanation | null = isCurrent ? explained.result : null;

  const handleExplain = async () => {
    if (!submitted) return;
    const target = submitted;
    setExplained({ target, result: null });
    const result = await explain(buildContext(ROOM_NAME, target, now), explainAdapter);
    setExplained((prev) => applyExplainResult(prev, target, result));
  };

  const durationLabel = (b: Booking) => `${b.end - b.start} min`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Smart Campus Room Availability Checker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Check-only tool · no bookings are created or saved
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Room + status cards */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Selected room
              </p>
              <p className="text-xl font-semibold">{ROOM_NAME}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                blocked
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              }`}
            >
              {blocked ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
              {blocked ? 'Blocked' : 'Open'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Now */}
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Now</p>
                <p className="text-base font-semibold tabular-nums">
                  {toHHMM(now)}
                </p>
              </div>
            </div>

            {/* Blocked toggle */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  {blocked ? (
                    <Lock className="h-4.5 w-4.5" />
                  ) : (
                    <Unlock className="h-4.5 w-4.5" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Blocked status</p>
                  <p className="text-base font-semibold">
                    {blocked ? 'Blocked' : 'Not blocked'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={blocked}
                onClick={() => {
                  setBlocked((v) => !v);
                  setSubmitted(null);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                  blocked ? 'bg-rose-500' : 'bg-slate-300'
                }`}
                aria-label="Toggle blocked status for testing"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
                    blocked ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Existing bookings */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Existing bookings today
            </h2>
            <span className="ml-auto text-xs text-slate-400">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {bookings.length === 0 && (
              <li className="px-5 py-4 text-sm text-slate-400">
                No existing bookings.
              </li>
            )}
            {bookings.map((b, i) => (
              <li
                key={`${b.start}-${b.end}-${i}`}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-sm font-medium text-slate-700">
                    {toHHMM(b.start)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="tabular-nums text-sm font-medium text-slate-700">
                    {toHHMM(b.end)}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {durationLabel(b)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Checker form */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Check availability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter a start and end time (HH:MM, 24-hour). Nothing is booked.
            </p>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">
                  Start time (HH:MM)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="09:30"
                  value={startInput}
                  onChange={(e) => {
                    setStartInput(e.target.value);
                    setSubmitted(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm tabular-nums outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">
                  End time (HH:MM)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="10:00"
                  value={endInput}
                  onChange={(e) => {
                    setEndInput(e.target.value);
                    setSubmitted(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm tabular-nums outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCheck}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Check availability
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Clear result
              </button>
            </div>

            {parsedStart !== null && parsedEnd !== null && (
              <p className="text-xs text-slate-500">
                Requested:{' '}
                <span className="tabular-nums font-medium text-slate-700">
                  {toHHMM(parsedStart)} – {toHHMM(parsedEnd)}
                </span>{' '}
                ({parsedEnd - parsedStart} min)
              </p>
            )}
          </div>
        </section>

        {/* Result */}
        {submitted && (
          <section
            role="status"
            aria-live="polite"
            className={`rounded-2xl border shadow-sm overflow-hidden transition ${
              submitted.outcome.status === 'Available'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            <div className="px-5 py-4 flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  submitted.outcome.status === 'Available'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {submitted.outcome.status === 'Available' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-base font-semibold ${
                    submitted.outcome.status === 'Available'
                      ? 'text-emerald-800'
                      : 'text-rose-800'
                  }`}
                >
                  {submitted.outcome.status === 'Available'
                    ? 'Available'
                    : 'Unavailable'}
                </p>
                {submitted.outcome.status === 'Available' ? (
                  <p className="text-sm text-emerald-700 mt-0.5">
                    {ROOM_NAME} is available from{' '}
                    <span className="tabular-nums font-medium">
                      {toHHMM(submitted.start)}
                    </span>{' '}
                    to{' '}
                    <span className="tabular-nums font-medium">
                      {toHHMM(submitted.end)}
                    </span>
                    . This is a check only — no booking was made.
                  </p>
                ) : (
                  <div className="mt-1 space-y-1.5">
                    <p className="text-sm text-rose-700">
                      {submitted.outcome.reason}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs text-rose-600/80">
                      <Info className="h-3.5 w-3.5" />
                      Failed rule: {submitted.outcome.rule}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Explain availability (Practice #11) — separate from the status card */}
        {submitted && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4 space-y-3">
              <button
                type="button"
                onClick={handleExplain}
                disabled={explainPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                <MessageSquareText className="h-4 w-4" />
                Explain availability
              </button>
              <div aria-live="polite">
                {explanation && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">
                      {panelLabel(explanation.source)}
                    </p>
                    <p className="mt-1 text-sm text-slate-700 break-words">
                      {explanation.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Rule reference */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Availability rules
            </h2>
          </div>
          <ul className="px-5 py-4 space-y-2 text-xs text-slate-600">
            <li>
              <span className="font-semibold text-slate-700">AC1.</span>{' '}
              00:00 &le; start &lt; end &le; 24:00, and start must be strictly
              after &ldquo;now&rdquo; (start == now is rejected).
            </li>
            <li>
              <span className="font-semibold text-slate-700">AC2.</span>{' '}
              Duration must not exceed 120 minutes (exactly 120 is allowed).
            </li>
            <li>
              <span className="font-semibold text-slate-700">AC3.</span> If the
              room is blocked, every request is rejected.
            </li>
            <li>
              <span className="font-semibold text-slate-700">AC4.</span> No
              overlap with existing bookings. Intervals that only touch at an
              endpoint are allowed.
            </li>
          </ul>
        </section>

        <footer className="pt-2 pb-8 text-center text-xs text-slate-400">
          Prototype · client-side only · no bookings are stored
        </footer>
      </main>
    </div>
  );
}

export default App;
