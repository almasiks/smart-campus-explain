# Practice #11 · Task 03: Implementation, "Explain availability"

This task implements the approved plan plus additions a–c, following `AGENTS.md` and `docs/02-feature-contract.md`.
No dependency was added (`package.json` and `package-lock.json` are unchanged), there is no network call, and no remote or push.

## 1. Changed files

| File | Change | Reason |
|---|---|---|
| `src/availability.ts` | modified | Adds a `code` field to each Unavailable return and a copied `conflict` to AC4, plus the `UnavailableCode` type. No condition, order or `reason` text changed. |
| `src/App.tsx` | modified | Adds the "Explain availability" button and the explanation panel (label chosen by source), the pending/disabled state and the stale-response guard. `code: 'INPUT_INVALID'` is added to the existing `INPUT` result. |
| `src/explain/types.ts` | new | `ReasonCode`, `ExplainContext`, `Explanation`, and the `ExplainAdapter` interface |
| `src/explain/context.ts` | new | `buildContext` (checker result → minimal context, times via `toHHMM`) and `validateContext` (contract §b checks) |
| `src/explain/validate.ts` | new | `validateExplanation`: length, sentence count, phrase-level contradiction and "booking made" lists, XAC1 facts check (times, room, every number) |
| `src/explain/fallback.ts` | new | Neutral deterministic text per reason code, plus a generic text for an invalid context |
| `src/explain/mockAdapter.ts` | new | Mock adapter with modes ok, timeout, error and nokey; `parseMockMode` (`?explainMock=`); friendlier mock wording that differs from the fallback |
| `src/explain/explain.ts` | new | The `explain()` orchestrator (never throws, 3 s timeout, validates output, falls back) and `panelLabel(source)` |
| `src/availability.code.test.ts` | new | 8 tests: reason code per branch, rule order, `conflict` is a copy, Available result unchanged |
| `src/explain/context.test.ts` | new | 13 tests: `buildContext` per code, `validateContext` rejection cases |
| `src/explain/validate.test.ts` | new | 34 tests: output rules, phrase-level look-alikes, XAC1 numbers/times/rooms, mock and fallback texts are valid and differ |
| `src/explain/explain.test.ts` | new | 21 tests: mock modes incl. 3 s timeout (fake timers), adapter not called for INPUT/invalid context, XAC2 immutability, labels, `parseMockMode` |
| `src/explain/testUtils.ts` | new | Shared test fixtures: one real context per reason code, built from the checker. Imported only by tests. |
| `AGENTS.md` | modified | 2 lines added to "Structure" (approved). Nothing else changed. |
| `docs/02-feature-contract.md` | modified | New "Amendments" section, A1: `durationMinutes = null` for `RANGE_INVALID` (approved) |
| `docs/03-implementation.md` | new | This report |
| `evidence/05_before_task03_*.txt` | new | Output of the four checks before the change |
| `evidence/06_after_task03_*.txt` | new | Output of the four checks after the change, plus the XAC3 grep |

Unchanged on purpose: `src/availability.test.ts`, `src/time.test.ts`, `src/time.ts`, `src/data/fixtures.ts`, `package.json` and `package-lock.json`. The existing test files are byte-identical to the baseline.

## 2. Reason-code decision

**Chosen: option A, an additive `code` on Unavailable results.** `checkAvailability` sets `code` in the same `return` statement as `rule`, so the two cannot drift apart. The AC4 result also carries `conflict: { start, end }`, a new object, so no booking reference leaves the function (AC5).

| Check | Result |
|---|---|
| `toEqual({ status: 'Available' })` at `availability.test.ts:37,52` | Still passes. The Available result is unchanged, and a new test asserts `Object.keys(result) == ['status']`. |
| Existing Unavailable tests (`toMatchObject`) | Pass unchanged |
| Rule logic and order AC1 range → AC1 now → AC2 → AC3 → AC4 | Unchanged. A new test checks that a past start with end < start is still `RANGE_INVALID`. |
| Drift risk | None. The code and the rule are written together. |

**Rejected: option B, a separate pure function.** It would need to repeat the range check (to split the two AC1 cases) and find the conflicting booking again, or parse the `reason` prose. That is a second copy of the rules with real drift risk.

`'INPUT_INVALID'` is part of `UnavailableCode` but is never returned by `checkAvailability`. Only `App.tsx` sets it, when HH:MM parsing fails.

## 3. Design notes

- **Patterns (2, the AGENTS.md limit):**
  - a small module boundary (`src/explain/`);
  - the Adapter (`ExplainAdapter`: two possible providers behind one call, so a provider can be swapped without touching the UI or the rules).

  There is no class, Factory, Strategy, Singleton or global mutable state. `mockAdapter(mode)` is a plain function returning an object literal. The module-level `explainAdapter` in `App.tsx` is a read-only value.
- **Trust boundary:** `explain()` first validates the context. For an invalid context it returns the generic fallback, and for `INPUT_INVALID` the fixed fallback; neither calls the adapter. Otherwise the adapter gets a **copy** of the context and races a 3 s timer, and its text is shown only if `validateExplanation` accepts it. Any exception, rejection or timeout returns the fallback.
- **XAC1 numbers (addition b):**
  - every `HH:MM` must be one of start, end, now or the conflict times;
  - every "Room N" must be the context room;
  - after removing times, every remaining number must be the duration, the 120 maximum or a digit group of the room name.
- **Phrase-level checks:** phrases are matched on word boundaries, so "is not blocked" does not match "is blocked". The lists are exported constants in `validate.ts`.
- **Mock vs fallback (addition a):** separate templates, with friendlier mock wording. Tests check that, for every reason code, the two texts differ and both pass the validator.
- **UI stale-response guard:** the explanation state is tied to the exact `submitted` object it explains. Clearing or replacing the result produces a different object, so an old or late explanation never matches and is not rendered. A late response for an old target can't overwrite the state of a newer explanation. None of the four existing `setSubmitted(null)` call sites were changed.
- **Mock `ok` mode resolves immediately.** There is no artificial delay, so the disabled/pending state is visible mainly with `?explainMock=timeout` (3 s).

## 4. Verification

### By command output (evidence files)

| Check | Before (`05_before_task03_*`) | After (`06_after_task03_*`) |
|---|---|---|
| `npm test` | 2 files, **28/28 passed** | 6 files, **104/104 passed** (12 + 8 + 16 + 13 + 34 + 21) |
| `npm run typecheck` | exit 0, no errors | exit 0, no errors |
| `npm run lint` | exit 0, 0 problems | exit 0, 0 problems |
| `npm run build` | exit 0 | exit 0. JS 166.79 kB (was 158.36 kB at baseline), CSS 16.30 kB |
| XAC3 grep (`06_after_task03_xac3_grep.txt`) | n/a | `VITE_`: 0 matches in `src/` and `dist/`. `apiKey`: 0 matches. `dangerouslySetInnerHTML`: **0 in `src/`**; 13 occurrences in `dist/`, the same count (13) as `node_modules/react-dom/cjs/react-dom.production.min.js`. They are React DOM's internal prop handling, not project code. |

Criteria covered by unit tests: XAC1 (facts check), XAC2 (bookings, result and context deep-equal before and after, even with an adapter that tries to mutate), XAC3 (context and output validators), XAC4 (timeout, error, nokey, synchronous throw, invalid output), and XAC5 at the logic level (exact labels; the fallback label has no "AI-generated").

### By hand: **not yet done**

> **NOT YET VERIFIED IN A BROWSER:** the "Explain availability" button, the three panel labels, the disabled state, ignoring late responses, and the 1280 px / 375 px layout. Nothing in this section has been observed in a running app. **Task 05 will verify them** with screenshots.

Details of what Task 05 must check:

- the button appears only after a result, and the panel shows the correct label per source (`?explainMock=ok|timeout|error|nokey`);
- the button is disabled during the 3 s timeout;
- a late response is ignored after "Clear result", an input change, the blocked toggle or a new check while a timeout request is pending;
- the status card is visually unchanged, at 1280 px and 375 px (XAC5, AC6).

The stale-response guard and the rendering are React state logic, and there is no DOM test library (new dependencies are forbidden). So these rest on code review plus the manual check above, not on automated tests.

## 5. Notes / follow-ups

- The "Open questions" in `docs/02-feature-contract.md` (how the reason code is obtained, the phrase lists) are answered here in §2 and §3. The contract text itself was only changed by the approved Amendments section.
- The phrase lists are a safety net, not a proof. A real LLM could still phrase a contradiction in words the lists don't cover. Only the mock adapter is wired up, and no real model call exists.
