# Practice #11 · Task 01: Baseline

Smart Campus Room Availability Checker. This is a record of the starting state before the "Explain availability" feature.
No file in `src/` was changed in this task.

## 1. Checkpoint

| Item | Value |
|---|---|
| Repository | local `git init` (branch `main`). No remote, nothing pushed |
| Baseline commit | `2ac5a53` "Baseline: Smart Campus Practice #10 source" (24 files) |
| Tag | `practice10-baseline` → `2ac5a53` |
| Excluded from git | `node_modules/` and `dist/` (`.gitignore` lines 9–10, confirmed with `git check-ignore -v`) |

To roll back to the checkpoint: `git checkout practice10-baseline` (or `git diff practice10-baseline` to compare).

## 2. Environment

Source: `evidence/00_env.txt`.

| Item | Value |
|---|---|
| OS | Windows 11 Home 10.0.26200 |
| Node | v24.13.1 |
| npm | 11.8.0 |
| Git | 2.51.1.windows.1 |
| Vitest / Vite (from output) | v2.1.9 / v5.4.8 |

## 3. Commands and real results

Each command was run once from the project root. Its full stdout and stderr were saved to `evidence/`. Test and build output still contains ANSI colour codes.

| # | Command | Exit | Result | Evidence |
|---|---|---|---|---|
| 0 | `node --version && npm --version` | 0 | v24.13.1 / 11.8.0 | `evidence/00_env.txt` |
| 0 | `npm ci` | 0 | added 305 packages, audited 306. **npm audit reports 24 vulnerabilities (2 low, 7 moderate, 13 high, 2 critical)**. These were not investigated in this task | `evidence/00_install.txt` |
| 1 | `npm test` | 0 | **2 test files passed (2); 28 tests passed (28)**. `src/availability.test.ts` 12 tests, `src/time.test.ts` 16 tests | `evidence/01_test.txt` |
| 2 | `npm run typecheck` | 0 | `tsc --noEmit -p tsconfig.app.json`: no output, 0 errors | `evidence/02_typecheck.txt` |
| 3 | `npm run lint` | 0 | `eslint .`: no output, 0 problems | `evidence/03_lint.txt` |
| 4 | `npm run build` | 0 | 1571 modules, `dist/index.html` 0.70 kB, CSS 15.74 kB, JS 158.36 kB, built in 2.47 s. Warning: "Browserslist: caniuse-lite is outdated" | `evidence/04_build.txt` |

Note: `PRACTICE09_REPORT.md` §5 records 26/26 tests after Practice #09. The current baseline has 28. The two extra tests are the "R1 regression" tests at `src/availability.test.ts:66-74` (NaN and non-integer minutes). This agrees with the "Practice #10 source" label.

## 4. Repository map

```
New_bolt/
├── AGENTS.md                 agent instructions: scope, AC1–AC6, commands, review gate
├── PRACTICE09_REPORT.md      previous practice report (refactoring with AGENTS.md)
├── .bolt/config.json         {"template": "bolt-vite-react-ts"}
├── .bolt/prompt              Bolt template system prompt ("production" designs, lucide, @/ alias)
├── package.json              scripts: dev, build, lint, test, preview, typecheck
├── vite.config.ts            React plugin + `@` → ./src alias
├── tsconfig*.json, eslint.config.js, tailwind.config.js, postcss.config.js, index.html
├── src/
│   ├── main.tsx              React entry point
│   ├── App.tsx               the only UI component (state, input parsing, result rendering)
│   ├── availability.ts       pure rules: checkAvailability, overlaps, types, MAX_DURATION
│   ├── availability.test.ts  12 tests (AC1–AC4, no-mutation, R1 regressions)
│   ├── time.ts               parseHHMM, toHHMM, MINUTES_IN_DAY
│   ├── time.test.ts          16 tests (parser, formatter, overlaps, fixtures)
│   ├── data/fixtures.ts      ROOM_NAME, INITIAL_NOW, INITIAL_BLOCKED, INITIAL_BOOKINGS
│   ├── index.css, vite-env.d.ts
├── docs/01-baseline.md       this file (Task 01)
└── evidence/                 raw command output (Task 01)
```

## 5. Availability function

File: `src/availability.ts:21-26`

```ts
export function checkAvailability(
  room: Room,                       // { name: string; blocked: boolean }
  bookings: readonly Booking[],     // { start: number; end: number }[]
  request: AvailabilityRequest,     // { start: number; end: number }
  now: number
): AvailabilityResult
// AvailabilityResult = { status: 'Available' }
//                    | { status: 'Unavailable'; rule: string; reason: string }
```

- The function is pure. It takes no fixtures and has no React, and `bookings` is typed `readonly`.
- The checks run in the order AGENTS.md specifies: AC1 range (`:30-44`, which also rejects non-integers and NaN) → AC1 now (`:45-53`) → AC2 duration > `MAX_DURATION` = 120 (`:54-61`) → AC3 blocked (`:62-68`) → AC4 overlap via `overlaps()` with half-open intervals (`:17-19`, `:69-81`).
- The function returns at the **first** failed rule. A "Available" result carries no data beyond its status.

## 6. UI component

File: `src/App.tsx`, component `App` (the only component).

- Inputs are text fields for start and end (`:227-253`), parsed with `parseHHMM` (`:41-42`). End uses `allowMidnight = true`.
- `handleCheck` (`:44-64`) calls `checkAvailability` with `{ name: ROOM_NAME, blocked }`, `bookings`, the parsed request and `now` (`:57-62`). It stores `{start, end, outcome}` in the `submitted` state.
- **The result is rendered** in the `role="status" aria-live="polite"` section at `:287-350`:
  - Available: `:324-335`, "Room 301 is available from X to Y. This is a check only…"
  - Unavailable: `:336-346`, which shows `outcome.reason` (`:339`) and "Failed rule: {outcome.rule}" (`:343`)
- A static "Availability rules" reference card (`:352-379`) lists AC1–AC4 only.
- The blocked toggle (`:148-166`) is the only state that changes at runtime. `now` and `bookings` use `useState` with no setter.

## 7. Repository instructions

| File | What it says / role |
|---|---|
| `AGENTS.md` | The binding project rules. It defines AC1–AC6 (`:21-26`) and the rule order (`:27`). Forbidden: backend, DB, Supabase, login, saved bookings (`:30`); secrets and real personal data; deployment and publishing; UI, text or class changes unless asked; fixture edits; weakening tests; new dependencies. At most 2 patterns; Adapter only for inconsistent data shapes (`:42`). Every check must run before and after each change. Propose a diff first and apply it only after human approval. An identical copy exists one level up (`../AGENTS.md`, `diff` shows no differences) |
| `.bolt/prompt` | The Bolt template prompt: "beautiful… fully featured and worthy for production", lucide-react icons, no extra UI packages, `@/` alias. AGENTS.md explicitly says the project scope rules override the "production" wording |
| `PRACTICE09_REPORT.md` | The history of Practice #09. Fixtures and `parseHHMM` were moved into modules (one pattern: small module boundary). Adapter, Strategy, Factory, Singleton and a shared rule-ID type were rejected. A review of AI-written tests found mislabelled and tautological tests. It records the manual UI cases, including `9:5` → INPUT |

## 8. Data and constraints

- **One room:** `ROOM_NAME = 'Room 301'` (`src/data/fixtures.ts:3`).
- **Fixed "now":** `INITIAL_NOW = 540` (09:00) (`fixtures.ts:5`).
- **Fictional bookings:** a single booking, `[{ start: 600, end: 660 }]` (10:00–11:00) (`fixtures.ts:7`). Not blocked by default (`fixtures.ts:6`).
- **No login, no database, no backend:** no auth or network code exists in `src/`. `package.json` dependencies are only `react`, `react-dom` and `lucide-react`, and `@supabase/supabase-js` is absent. The UI states "Check-only tool · no bookings are created or saved" (`App.tsx:85`) and "client-side only · no bookings are stored" (`App.tsx:382`).
- Times are integer minutes 0..1440 and intervals are half-open `[start, end)`.

## 9. Observations for an "Explain availability" feature

### O1. The `INPUT` rule exists only in the UI, outside `checkAvailability` (candidate a, confirmed)

**Observed facts**
- When `parseHHMM` returns `null`, `App.tsx:45-55` builds its own result `{ status: 'Unavailable', rule: 'INPUT', reason: 'Please enter valid times…' }` and stores `start: -1, end: -1`. `checkAvailability` is never called in this case.
- `'INPUT'` does not appear in `src/availability.ts` or in AGENTS.md's AC list (`AGENTS.md:21-27`). The `rule` field is typed `string` (`availability.ts:13`), so nothing in the type system lists the possible rule values.
- No unit test covers the INPUT path. It appears only as a manual UI case in `PRACTICE09_REPORT.md` §5 (`9:5` → INPUT).

**Assumptions / implications (not verified)**
- An explanation built only from `checkAvailability`'s output would not cover format errors. An explanation built in `App.tsx` would have to treat `INPUT` separately.
- The sentinel values `-1` must never be shown as times. `toHHMM(-1)` would display `23:59` (`time.ts:9`), but the current UI never shows `submitted.start/end` on the Unavailable branch.

### O2. The scope forbids a backend and allows an Adapter only for inconsistent shapes (candidate b, confirmed)

**Observed facts**
- `AGENTS.md:30`: "No backend, database, Supabase calls, login, or saved booking creation." `AGENTS.md:42`: "Adapter only if data arrives in inconsistent shapes (it currently does not)." `AGENTS.md:43` lists Singleton, Factory, Strategy, class hierarchies and global state as not allowed without a concrete need.
- All bookings share the single shape `Booking = { start; end }` (`availability.ts:5`, `fixtures.ts:7`). `PRACTICE09_REPORT.md` §3 explicitly rejected Adapter for this reason.
- `.bolt/prompt` pushes toward "fully featured… production" pages. AGENTS.md says the scope rules take precedence over this.

**Assumptions / implications (not verified)**
- An "Explain availability" feature must be computed client-side from data that already exists (room, bookings, now, request, result). It must not use an LLM or API call, a new dependency, or saved state.
- A pure function next to `checkAvailability` (a small module boundary, the pattern already in use) fits the rules. An Adapter or Strategy layer for explanations would have no justification under `AGENTS.md:42-43`.
- Any new visible text is a UI change. AGENTS.md forbids that unless explicitly asked, so the feature request itself must authorise it.

### O3. AC numbering does not map one-to-one to the returned rule IDs (candidate c, confirmed with caveats)

**Observed facts**
- AGENTS.md defines AC1–AC6 (`:21-26`). Only AC1–AC4 are ever returned as `rule` values (`availability.ts:39,48,58,65,73`). AC5 (no mutation) and AC6 (clear feedback on desktop and mobile) are non-functional requirements with no rule ID.
- **AC1 is used for two different checks**, range/format (`availability.ts:30-44`) and "start must be after now" (`:45-53`). AGENTS.md's order line names them separately ("AC1 range → AC1 now", `:27`), but the result's `rule` is `'AC1'` in both cases. Only the `reason` text tells them apart.
- The UI's rule reference card lists only AC1–AC4 (`App.tsx:360-377`). The extra UI-only rule `INPUT` (O1) is outside the AC numbering.
- Test labelling is uneven. `AGENTS.md:15` says `availability.test.ts` covers "AC1–AC5". Its no-mutation test (`availability.test.ts:55`) carries no AC label, and the only test labelled AC5 is the `describe('fixtures (AC5)')` block in `time.test.ts:84`.

**Assumptions / implications (not verified)**
- An explanation keyed only on `rule` cannot tell "outside 00:00–24:00 / end before start" apart from "not after now". It would need the `reason` text or a finer sub-code. Adding a sub-code would change the `AvailabilityResult` shape, and existing tests use `toEqual({ status: 'Available' })` (`availability.test.ts:37,52`), which would break if fields were added to the Available result.
- "Explain" should probably not invent AC5/AC6 explanations, because these rules never fail at runtime.
- Because `checkAvailability` stops at the first failure, it reports **only one** failed rule even when several apply (for example, blocked **and** overlapping). An "explain" view that lists every reason would need a separate evaluation, not the current result.

## 10. Facts vs. assumptions summary

- **Facts** (verified in this session, with evidence above): command exit codes and counts (§3), file and line references (§5–§9), git checkpoint (§1).
- **Not verified:** UI behaviour in a browser (no manual or visual run in this task), the content of the 24 npm audit findings, and whether the repository at `github.com/almasiks/smart-campus-explain` is the intended remote (no remote was added and nothing was pushed).
