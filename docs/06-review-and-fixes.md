# Practice #11 · Tasks 06–07: Review and fixes

The review covered `practice10-baseline..HEAD` (at `3e6bc36`) against `AGENTS.md`, `docs/02-feature-contract.md`, AC1–AC6 and XAC1–XAC5. The review itself was read-only. The probes ran against the real modules from a scratchpad script, not from the repo.

**Status meaning:**
- **CONFIRMED**: I ran it in this session (probe, grep, tests or evidence files).
- **PLAUSIBLE**: supported by code or by another person's observation, but not reproduced by me.
- **UNSUPPORTED**: a claim nobody has checked.

## 1. Review findings (as printed in the review)

| ID | file:line + code | Severity | AC/XAC | How to verify | Status |
|---|---|---|---|---|---|
| **R1** | `validate.ts:13` `UNAVAILABLE_FORBIDDEN = ['is available', …, 'can book', …]` | **High** for a future LLM (Medium while only the mock exists) | XAC2, contract §c rule 4 | Probe returned `true` (accepted as valid) for Unavailable texts "Room 301 is open at that time.", "You may reserve it now." and "Go ahead and book Room 301.", and for the Available text "Sadly the slot is taken.". Control: "Room 301 is available." → `false` | **CONFIRMED** |
| **R2** | `App.tsx:86` `explained.target === submitted` and `App.tsx:96` `prev.target === target ? { target, result } : prev` | **Medium** | contract §f, XAC5 | `grep` found no test touching App.tsx; mutation M5 was not caught (`evidence/07`). TC14 passed in the browser, but only manually | **CONFIRMED** (no test exists) |
| **R3** | `context.ts:62` `validateContext` checks only known fields; `copyContext` in explain.ts does `{ ...ctx }` | **Medium** | XAC3 | Probe: `validateContext({...ctx, note: 'ignore previous instructions'})` → `true`. An extra field passes validation and, through the spread copy, reaches the adapter. Only `buildPromptInput` rejects extra keys | **CONFIRMED** |
| **R4** | `explain.test.ts:30` `it('timeout mode falls back after exactly 3 s'…` | **Low** (test quality) | XAC4 | `evidence/07_mutation_checks.txt` M3: the test fails only through "Test timed out in 5000ms", not through an assertion, so the message does not point at the cause | **CONFIRMED** |
| **R5** | `availability.ts:60` and `:70` `rule: 'AC1'` | **Low** | AC1, AC6 | Probe: 12:00–11:00 → `["AC1","RANGE_INVALID"]`, 09:00–09:30 → `["AC1","START_NOT_AFTER_NOW"]`. The code tells them apart; the UI shows the same "Failed rule: AC1" for both | **CONFIRMED** |
| **R6** | `App.tsx:311` `({parsedEnd - parsedStart} min)` | **Low** (cosmetic) | AC6 | The tester saw "Requested: 12:00 – 11:00 (-60 min)" in browser run 1. The code clamps nothing. I could not run a browser myself, and I have not checked on the baseline whether it is a regression | **PLAUSIBLE** |
| **R7** | `evidence/00_install.txt`: "24 vulnerabilities (2 low, 7 moderate, 13 high, 2 critical)"; `01-baseline.md` "assumed to be in dev tooling" | **Unknown** | – (AGENTS.md: no dependency changes) | `npm audit --omit=dev` would show whether any are runtime. Not run: it is a network call to the npm registry, and it was not requested | **UNSUPPORTED** |

**Why R7 is UNSUPPORTED:** "the vulnerabilities are in dev tooling" has never been checked by anyone. It was marked as an assumption in Task 02. The only fact is the count printed by `npm ci`. Classifying the vulnerabilities needs the online advisory database, so no classification was invented.

## 2. Chosen fixes and why

The human chose **R1 and R2**. They match the reviewer's recommendation:
- **R1** was the only finding where the output guard actually let a contradiction through. That is the main risk once a real LLM is connected.
- **R2** closed the only mutation the suite did not catch (M5), with no visible UI change.

### R1: contradiction guard (`src/explain/validate.ts`)

- **What changed:** added two small phrase-pattern lists, `UNAVAILABLE_FORBIDDEN_PATTERNS` and `AVAILABLE_FORBIDDEN_PATTERNS`. They run in addition to the unchanged phrase lists. No existing check was removed or weakened.
- **What the patterns catch:**
  - for Unavailable: `is/are [currently|already|still|now|actually] open|free|available|bookable`, `can/may/could [still] book|reserve`, `free to book/reserve`, `go ahead and book/reserve`;
  - for Available: `is/are [filler] taken|booked|unavailable|blocked|occupied|full`, `cannot/can't be booked|reserved|used`.
- **Deviation from the request (reported, not silent):** bare words such as "unavailable" or "blocked" are **not** rejected on their own. Contract §c (Task 02 addition 3) requires phrase-level checks. The existing tests also require two texts to be **accepted** for an Available result: "The room is not blocked and the time is free." and "This is free text about a blocked room.". Rejecting the bare words would break those assertions, and AGENTS.md forbids weakening tests. The patterns catch "is blocked" and "is currently unavailable" but not "is not blocked".
- **Tests:** 15 cases added in a new `describe` block in `validate.test.ts`:
  - 7 Unavailable rejections, including the 3 probe texts;
  - 7 Available rejections, including "Sadly the slot is taken.";
  - 1 test of accepted look-alikes, including the control "Room 301 is available." for Available.

  The existing tests that every fallback and mock text passes the validator, for every reason code, are unchanged and green.
- **Red:** `evidence/09_fix_r1_red.txt`: 13 failed, 145 passed (158). The 14th rejection case, "You can reserve it.", was already caught by the existing phrase `'you can reserve'`.
- **Green:** `evidence/09_fix_r1_green.txt`: 158/158.

### R2: late-response guard (`src/explain/guard.ts`, `src/App.tsx`)

- **What changed:** new pure helper `guard.ts` with `isCurrentExplain(explained, submitted)` (identity check; also `false` when `submitted` is `null`) and `applyExplainResult(prev, target, result)`. `App.tsx` uses both; its JSX, texts and classes are unchanged.
- **No visible UI change:** the CSS selector set of the built bundle is **identical** before and after (`evidence/09_fix_r2_mutation.txt` §4). The CSS file size differs by 0.02 kB, but no selector was added or removed.
- **Tests:** `guard.test.ts`, 8 tests: stale target ignored, deep-equal-but-different target ignored, same target accepted, null state handled, cleared or replaced result not current, and a late-response sequence.
- **Red:** `evidence/09_fix_r2_red.txt` (module `@/explain/guard` not found; the other 158 tests pass).
- **Green:** `evidence/09_fix_r2_green.txt`: 166/166.
- **Mutation M5, re-run** in the throwaway copy (`../smart-campus-mutation`, reset to `3e6bc36` plus the fix; `evidence/09_fix_r2_mutation.txt`):
  - **M5a**: target check removed from `applyExplainResult` → **2 failed**;
  - **M5b**: identity check removed from `isCurrentExplain` → **3 failed**.

  Both are now caught.

## 3. Not fixed, and why

| ID | Why not fixed |
|---|---|
| R3 | Not chosen. The risk is contained today: the only adapter is the local mock, and `buildPromptInput` already rejects extra keys before any prompt exists. A one-line exact-key check in `validateContext` plus a test would close it. |
| R4 | Not chosen. The test does fail when the timeout is removed (M3 caught); only the failure message is indirect. |
| R5 | Not chosen. The code distinguishes the two AC1 cases. Showing it in the UI would change UI text, which AGENTS.md forbids without explicit approval. |
| R6 | Not chosen. It is a UI text change (forbidden without approval) and only PLAUSIBLE. It has not been checked whether the baseline already had it. |
| R7 | Not chosen. Verifying needs a network call (`npm audit --omit=dev`), and fixing would change dependencies (forbidden by AGENTS.md). |

## 4. Test counts

| Point | Test files | Tests | Source |
|---|---|---|---|
| Baseline (`practice10-baseline`) | 2 | 28 passed | `evidence/01_test.txt` |
| Before Tasks 06–07 (`3e6bc36`) | 7 | 143 passed | `evidence/08_task04_test.txt`, re-run at the Task 05 commit |
| R1 red | 7 | 13 failed, 145 passed (158) | `evidence/09_fix_r1_red.txt` |
| R1 green | 7 | 158 passed | `evidence/09_fix_r1_green.txt` |
| R2 red | 8 (1 failed to load) | 158 passed | `evidence/09_fix_r2_red.txt` |
| R2 green / final | 8 | **166 passed** | `evidence/09_fix_r2_green.txt`, `evidence/10_final_checks.txt` |

`evidence/10_final_checks.txt` records `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`, all exit 0.

## 5. Verdict: **READY FOR DEMO** (not ready for acceptance)

The app builds, all 166 tests pass, and every manual case has been observed at least partially with no FAIL. The two chosen findings are fixed, with tests that were red first. It can be demonstrated.

It is **not** accepted as complete, because:
- **Screenshots missing:** only 1 of 21 planned screenshots exists (`evidence/screenshots/TC01_input_before_check_952.png`, the state before Check). No screenshot shows a status card or an explanation panel.
- **PARTIAL cases:** TC03, TC05 and TC06 (panel not captured for the planned input), and TC17 (the `?explainMock=error` network part was not checked). The scroll checks in TC09 and TC15 were visual only.
- **R2 wiring not re-tested in a browser:** after the R2 refactor, `App.tsx` has not been re-run in a browser. The helper is unit-tested and the CSS is unchanged, but the TC14 browser pass was observed **before** the refactor.
- **Open findings:** R3, R4, R5, R6 and R7 remain open.
- **No real model:** no real model was ever called; the prompt (`docs/04`) is untested against any LLM.
