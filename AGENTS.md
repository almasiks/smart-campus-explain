# AGENTS.md — Smart Campus Room Availability Checker

## Project
Client-side checker for one room (Room 301) with fictional bookings and a fixed "now" (09:00).
User story: as a student, I want to check a room's availability so I can choose a valid booking time.
Output is an availability decision only — nothing is booked or saved.

## Stack
Vite + React 18 + TypeScript + Tailwind CSS + lucide-react. Tests: Vitest.
Import project modules with the `@/` alias (`@/time` == `src/time.ts`).

## Structure
- `src/availability.ts` — pure booking rules (`checkAvailability`). No React, no fixtures.
- `src/App.tsx` — UI: reads inputs, calls `checkAvailability`, renders the result.
- `src/availability.test.ts` — regression tests for AC1–AC5.
- `src/time.ts` — `parseHHMM`, `toHHMM`, `MINUTES_IN_DAY`; `src/time.test.ts` — parser/overlap/fixture tests.
- `src/data/fixtures.ts` — the only source of fictional demo data (Room 301, now, bookings).
Times are minutes since midnight (0..1440). Intervals are half-open `[start, end)`.

## Acceptance criteria (must be preserved)
- AC1: `00:00 <= start < end <= 24:00`; start must be strictly after "now" (start == now is rejected).
- AC2: duration must not exceed 120 minutes (exactly 120 is allowed).
- AC3: if the room is blocked, every request is rejected.
- AC4: no overlap with existing bookings; touching only at an endpoint is allowed.
- AC5: never mutate booking data.
- AC6: clear feedback (status, reason, failed rule) on desktop and mobile widths.
Rule check order: AC1 range → AC1 now → AC2 → AC3 → AC4.

## Constraints / forbidden scope changes
- No backend, database, Supabase calls, login, or saved booking creation.
  The unused Bolt-template dependency `@supabase/supabase-js` was removed; do not re-add it.
- No secrets: never add API keys, tokens, `.env` files or credentials. No real personal data — fictional data only.
- No deployment or publishing (Bolt deploy, Netlify, git push to shared branches) and no calls to external production services.
- `.bolt/prompt` asks for "fully featured / production" designs; for this project the scope rules above take precedence.
- Do not change UI layout, texts or Tailwind classes unless explicitly asked.
- Do not edit fixture values. Do not weaken, skip or delete existing test assertions.
- Do not add dependencies.

## Engineering rules
- Prefer pure functions and the smallest change that solves a named problem.
- At most 2 patterns, each justified as problem → pattern → benefit.
- Allowed: small module boundary. Adapter only if data arrives in inconsistent shapes (it currently does not).
- Not allowed without a concrete need: Singleton, Factory, Strategy, class hierarchies, global state.

## Commands
- Install: `npm install`
- Dev preview: `npm run dev`
- Tests: `npm test`  (vitest run)
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`

## Verification / reporting
Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build` before and after every change,
and before proposing acceptance. Never report a check as passed without its real command output.
Add focused regression tests for changed behaviour.
Report: changed files with a one-line reason each, exact commands run, and pass/fail counts.

## Review gate
- Inspection and review tasks are read-only unless a change is explicitly requested.
- Propose a minimal diff first; apply it only after explicit human approval. Reject unrelated refactoring.
- Merge/release decision is made by a human, never by the agent.

## Explain availability feature (Practice #11)
Contract: `docs/02-feature-contract.md`. Everything above still applies; this section only adds
the scoped exceptions and extra rules listed here.

Feature acceptance criteria:
- XAC1: the explanation uses only the supplied structured facts (no invented rooms, times, rules).
- XAC2: the explanation never changes the availability decision or the bookings data.
- XAC3: inputs are minimal and validated, output is validated, no secrets or personal data.
- XAC4: API timeout (3 s), error or unavailable key produces a safe deterministic fallback.
- XAC5: a user can distinguish the generated explanation from the confirmed booking status.
- The LLM (or any adapter) never decides availability and never changes bookings.
  `checkAvailability` stays the only authority; explanation output is untrusted until validated.

Scoped exception to "No backend":
- Allowed: a client-side module `src/explain/` with an adapter interface and a mock adapter.
- A real model call is optional, server-side only, with the key only in the server environment
  (never in the repo or the client bundle). It is NOT implemented unless the human explicitly asks.
- No database, login, saved bookings or Supabase — those rules are unchanged.

Patterns:
- Adapter is now justified for `src/explain/` only. Problem: two possible providers (mock and real)
  behind one call. Pattern: one `ExplainAdapter` interface. Benefit: swap providers without touching
  the UI or the booking rules. Together with the small module boundary this is the 2-pattern limit.
- Strategy, Factory and Singleton remain forbidden.

Allowed UI change: only the "Explain availability" button and the explanation panel. The panel label
depends on the explanation source:
  llm      -> "AI-generated explanation — not a booking confirmation"
  mock     -> "AI-generated explanation (demo) — not a booking confirmation"
  fallback -> "Standard explanation (AI unavailable) — not a booking confirmation"
A deterministic template must never be labelled plain "AI-generated". The status card and all other
layout, texts and Tailwind classes stay unchanged. The test-only `?explainMock=ok|timeout|error|nokey`
query selects mock failure modes and adds no UI element.

Extra forbidden:
- API keys or secrets in client code; `VITE_` variables for secrets.
- `dangerouslySetInnerHTML` or any HTML/Markdown rendering of explanation text.
- Sending user free text (raw input strings) to an adapter or model.
- New dependencies (unchanged rule, restated).

Unchanged: AC1–AC6, the rule check order, and the rules on fixtures and test assertions.
