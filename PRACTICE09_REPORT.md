# Practice #09 — Refactoring with AGENTS.md
Smart Campus Room Availability Checker · AI tool: Bolt.new

## 1. Inspection (prompt #1, no AGENTS.md yet)
Bolt correctly identified the following parts of the project:
- the rule function `checkAvailability` in `src/availability.ts`;
- the UI in `src/App.tsx`;
- the fixtures, which were duplicated in `App.tsx` and `availability.test.ts`;
- the tests in `src/availability.test.ts`, which covered AC1–AC4 plus one immutability check.

It also flagged that **AC5 and AC6 did not exist anywhere in the code** and asked for clarification. The project context it needed was missing.

Maintainability problems it reported, which I agree with:
1. **Fixtures duplicated.** The same constants appeared in `App.tsx:23-25` and `availability.test.ts:4-7` and could drift apart.
2. **Rule IDs as plain strings.** `rule: 'AC1'` had no shared type. Bolt itself advised not to fix this yet because the cost outweighed the benefit, and I agreed.
3. **Untested parser.** `parseHHMM` was boundary logic inside `App.tsx:27-35` with no tests.

Bolt presented "two patterns": extract fixtures and extract `parseHHMM`. **My assessment:** both are the same pattern, a small module boundary, so only **one** pattern was used.

## 2. AGENTS.md activation (prompt #2)
After `AGENTS.md` was added to the project root and Bolt was explicitly asked to read it, Bolt:
- listed all of AC1–AC6, including AC5 (no mutation) and AC6 (responsive feedback);
- listed the fixed rule order and the forbidden scope (no backend/Supabase/UI changes);
- gave the exact commands `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`.

It also noticed that `AGENTS.md` mentioned `@/time`, which did not exist yet, and asked about it instead of guessing. Bolt did not claim that `AGENTS.md` was loaded automatically.

## 3. Pattern rationale
**Problem.** Input parsing (`parseHHMM`) and demo data lived inside the React component. The parser decides what reaches AC1 but could only be exercised through the UI. The fixtures were copied in two places.

**Pattern: small module boundary.** UI-independent code was moved into pure modules:
- `src/time.ts` holds `parseHHMM`, `toHHMM` and `MINUTES_IN_DAY`;
- `src/data/fixtures.ts` holds the demo data;
- `src/availability.ts` gets a named `overlaps()` helper for the half-open interval check (AC4).

`App.tsx` now only holds state and rendering.

**Rejected patterns:**
- Adapter: all bookings already share one shape `{start, end}`.
- Strategy, Factory and Singleton: there is one policy and no runtime variation.
- Shared rule-ID type: there are few, stable rules, so the overhead does not pay off yet.

**Benefit.** Parsing and overlap logic are unit-tested in isolation, the demo data has one source of truth, and the rule order and UI are unchanged.

## 4. Changed files
| File | Change |
|---|---|
| `AGENTS.md` | **new**: project, stack, structure, AC1–AC6, constraints, commands, reporting rules |
| `src/time.ts` | **new**: `parseHHMM` (from `App.tsx`), `toHHMM`, `MINUTES_IN_DAY` (from `availability.ts`) |
| `src/data/fixtures.ts` | **new**: `ROOM_NAME`, `INITIAL_NOW`, `INITIAL_BLOCKED`, `INITIAL_BOOKINGS` |
| `src/availability.ts` | imports and re-exports time helpers; adds `overlaps()`, used by the AC4 check |
| `src/App.tsx` | imports from new modules; removed unused `setNow`; **no JSX/text/style changes** |
| `src/time.test.ts` | **new**: 16 tests for `parseHHMM`, `toHHMM`, `overlaps` and fixtures (AC5) |
| `src/availability.test.ts` | **unchanged**: all 10 original assertions kept |

## 5. Verification evidence
| Check | Before | After |
|---|---|---|
| `npm test` | 1 file, **10/10 passed** | 2 files, **26/26 passed** |
| `npm run typecheck` | pass | pass |
| `npm run lint` | **1 error** (`setNow` unused) | **0 problems** |
| `npm run build` | pass | pass |

**Manual UI regression.** The same 8 cases were run on both builds, and all outputs were identical:

| Case | Expected outcome |
|---|---|
| 09:30–10:00 | Available |
| 08:00–08:30 | AC1 |
| 12:00–11:00 | AC1 |
| 11:00–13:01 | AC2 |
| 10:30–11:30 | AC4 |
| 11:00–12:00 | Available (touching) |
| `9:5` | INPUT |
| blocked room | AC3 |

**AC6.** The desktop screenshot (1280 px) is pixel-identical before and after. The mobile screenshot (375 px) differs only by the button hover state.

## 6. Review of Bolt's tests — issues I found and fixed
Bolt reported "26 passed", but reading the tests showed three quality problems:
1. **Wrong test name.** A test called `'returns false when one interval fully contains the other'` actually asserts `true`. It was renamed to `returns true…`.
2. **Meaningless test name.** `'returns false for identical non-overlapping intervals'` was renamed to `returns false for disjoint intervals`.
3. **Tautological AC5 test.** `'does not mutate fixtures on read'` took a snapshot and compared it immediately, without calling any code, so it could never fail. It now calls `checkAvailability` on the fixtures (one overlap case and one touching case) before comparing.

The test count stayed at 26, and all pass. Lesson: a green test run produced by an AI is not evidence until the assertions are read.

## 7. Experiment A/B — with vs. without AGENTS.md
| | A — prompt #1, no AGENTS.md | B — prompt #2, AGENTS.md supplied explicitly |
|---|---|---|
| Acceptance criteria | knew only AC1–AC4 from code; asked what AC5/AC6 are | listed AC1–AC6 with meanings |
| Commands | not mentioned | exact `npm test / typecheck / lint / build` |
| Scope limits | none stated | no backend/Supabase, no UI/fixture/test-weakening changes |
| Patterns | "two patterns" (actually one boundary) | one pattern, problem → pattern → benefit |

The difference does **not** prove automatic AGENTS.md support, because in B the file was supplied explicitly in the prompt.

## 8. Reflection
- **Did a pattern reduce complexity?** Yes. `App.tsx` lost about 20 lines of non-UI code, and parsing and overlap became testable without React. An Adapter would have added complexity, because the data has one shape.
- **What did Bolt change that I did not request?** It re-exported `toHHMM` and `MINUTES_IN_DAY` from `availability.ts` for backward compatibility. That is harmless but slightly redundant. It also wrote misleading test names and a tautological AC5 test, which were caught in review (section 6). It left the rule logic, UI and old tests untouched.
- **How did AGENTS.md affect the outcome?** It supplied context the code could not: AC5/AC6, commands, rule order and forbidden scope. After it, Bolt stayed within scope and reported changed files and command results. The file did not prevent weak tests; human review was still needed.
- **Evidence behaviour was preserved:** the original 10 assertions are unchanged and pass, there are 26/26 tests in total, the 8 manual cases are identical before and after, and the screenshots match.
