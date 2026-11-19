# Practice #11 · Task 02: Feature contract, "Explain availability"

Status: **contract only, not implemented.** No file in `src/` was changed in this task.
Baseline references (O1–O3) point to `docs/01-baseline.md` §9.

## a) User story

> As a student, I want a short explanation of room availability so I understand the decision.

The explanation describes a decision that the existing checker has already made. It never makes the decision, changes it or books anything.

## b) Inputs: minimal structured context

The explanation adapter receives **only** this object, built by our code from the checker result:

```ts
type ReasonCode =
  | 'AVAILABLE'
  | 'RANGE_INVALID'        // AC1: times outside 00:00–24:00 or start >= end
  | 'START_NOT_AFTER_NOW'  // AC1: start <= now
  | 'DURATION_TOO_LONG'    // AC2
  | 'ROOM_BLOCKED'         // AC3
  | 'OVERLAP'              // AC4
  | 'INPUT_INVALID';       // UI-only rule 'INPUT' (HH:MM parse failed)

type ExplainContext = {
  room: string;                                  // 'Room 301', from fixtures
  start: string | null;                          // 'HH:MM'; null only for INPUT_INVALID
  end: string | null;                            // 'HH:MM' (may be '24:00'); null only for INPUT_INVALID
  status: 'Available' | 'Unavailable';
  rule: 'AC1' | 'AC2' | 'AC3' | 'AC4' | 'INPUT' | null;   // null when Available
  reasonCode: ReasonCode;
  now: string;                                   // 'HH:MM'
  durationMinutes: number | null;                // end - start; null for INPUT_INVALID
  maxDurationMinutes: 120;                       // MAX_DURATION
  conflict: { start: string; end: string } | null;  // only for OVERLAP
};
```

Facts each reason code needs for its sentence:

| reasonCode | status / rule | Facts used |
|---|---|---|
| `AVAILABLE` | Available / – | room, start, end, durationMinutes |
| `RANGE_INVALID` | Unavailable / AC1 | start, end |
| `START_NOT_AFTER_NOW` | Unavailable / AC1 | start, now |
| `DURATION_TOO_LONG` | Unavailable / AC2 | durationMinutes, maxDurationMinutes |
| `ROOM_BLOCKED` | Unavailable / AC3 | room |
| `OVERLAP` | Unavailable / AC4 | start, end, conflict |
| `INPUT_INVALID` | Unavailable / INPUT | none (format hint only) |

**Input rules**
- **No free text typed by the user.** For `INPUT_INVALID` the raw input strings are not sent; `start` and `end` are `null`. Values are re-formatted from parsed minutes with `toHHMM`, never copied from the text fields.
- The checker's `reason` sentence is not sent either. The adapter gets the reason code and facts, not prose.
- **No personal data.** The context has no user identity, name or e-mail, and the app has no login.
- **No API key in the client.** No secret exists in the browser bundle (see g).
- **Validation before the adapter is called.** The context is rejected (→ fallback) if:
  - `room` is not the fixture room name;
  - a time does not match `^\d{2}:\d{2}$` within 00:00–24:00;
  - `reasonCode` is not in the enum;
  - `status`, `rule` and `reasonCode` are inconsistent with the table above;
  - `durationMinutes` is not an integer in 0..1440;
  - `conflict` is present for any code other than `OVERLAP`, or missing for `OVERLAP`;
  - any string field is empty or longer than 16 characters.

**Why a reason code is needed.** `checkAvailability` returns `rule: 'AC1'` for two different checks, the range check (`src/availability.ts:30-44`) and the "after now" check (`:45-53`). Only the human-readable `reason` string tells them apart (baseline O3). Explaining from `rule` alone would be ambiguous, and parsing the `reason` prose would be brittle. A stable code removes both problems.

**How the reason code is obtained is decided in Task 03, not here.** Options include adding a field to the result, deriving the code in a separate pure function, or another approach. Each must keep AC1–AC6, the rule order and the existing test assertions unchanged. Note that `availability.test.ts:37,52` use `toEqual({ status: 'Available' })`, which constrains changes to the result shape.

## c) Outputs

```ts
type Explanation = { text: string; source: 'mock' | 'llm' | 'fallback' };
```

- `mock`: produced by the local mock adapter. This is the first implementation.
- `llm`: produced by a real model through a server-side endpoint. Optional, and not implemented unless requested.
- `fallback`: deterministic text produced by our code when the adapter fails, times out, returns invalid output, or the input is `INPUT_INVALID`.

**Rendering:** `text` is plain text only. It is rendered as a React text node and is **never rendered as HTML** (no `dangerouslySetInnerHTML`, no Markdown rendering).

**Output validation.** An adapter result that fails any rule below is discarded and replaced by the fallback:
1. `text` is non-empty after trimming.
2. `text` has at most **280 characters**.
3. `text` has at most **2 sentences**. A sentence ends with `.`, `!` or `?`; the `:` inside times does not count.
4. It does not contradict the status:
   - an `Unavailable` explanation must not say the room is available or can be booked (e.g. "is available", "can book", "can be booked");
   - an `Available` explanation must not say the room is unavailable, blocked or cannot be booked.
5. It does not claim that a booking was made (e.g. "booked for you", "reservation confirmed", "has been booked").
6. `source` is one of the three allowed values.

Rules 4–5 are **phrase-level** checks, not single-word checks. They match phrases such as "is blocked", "cannot be booked", "is available" or "has been booked", never a bare word like "blocked" or "available". A valid text such as "The room is not blocked and the time is free." must therefore pass for an `Available` result. These checks are a safety net, not a proof of correctness. **The exact phrase lists are decided in Task 03**, together with unit tests that cover both rejected phrases and accepted look-alikes (e.g. "is not blocked"). The fallback texts must pass the same validator, and a test will check this.

## d) Feature acceptance criteria

| ID | Criterion | How it will be verified |
|---|---|---|
| **XAC1** | The explanation uses only the supplied structured facts: no invented rooms, times or rules. | Unit tests for each `reasonCode`: the mock and fallback texts contain only the room, times and numbers present in the context. A validator test rejects a text that mentions a time or room absent from the context. |
| **XAC2** | The explanation never changes the availability decision or the bookings data. | The existing AC1–AC5 tests stay unchanged and green. A new test deep-compares `bookings` and the checker result before and after the explain call. Code review confirms the explain module receives a copied context, not `bookings` or state setters. |
| **XAC3** | Inputs are minimal and validated, the output is validated, and there are no secrets or personal data. | Unit tests for the context validator (each rejection case in b) and the output validator (each rule in c). `grep` of `src/` and `dist/` for `VITE_`, `apiKey` and `dangerouslySetInnerHTML` finds nothing. The context type has no field that carries user free text. |
| **XAC4** | An API timeout, an error or an unavailable key produces a safe fallback. | Unit tests with a fake adapter that never resolves (timeout at 3 s with fake timers), that rejects, and that reports a missing key. Each case returns `source: 'fallback'` with valid text, and the status card is unaffected. Manual screenshots of `?explainMock=timeout`, `?explainMock=error` and `?explainMock=nokey` (see e) show the fallback panel next to an unchanged status card. |
| **XAC5** | A user can distinguish the generated explanation from the confirmed booking status. | Unit test: the label is chosen from `source` exactly as in f), and the fallback label never contains "AI-generated". Manual check at 1280 px and 375 px: the explanation is in a separate panel whose label matches its `source`, and the status card is unchanged. Screenshots go in evidence. (No UI test library is installed and AGENTS.md forbids new dependencies, so the visual part is manual.) |

## e) Failure behaviour

The **confirmed status card** (`App.tsx:287-350`) never changes in any failure case. Only the explanation panel content differs.

| Situation | Detection | What the user sees in the explanation panel | `source` |
|---|---|---|---|
| Adapter timeout | no result within **3 s** | deterministic fallback sentence for the reason code | `fallback` |
| Adapter error | promise rejects or throws | deterministic fallback sentence | `fallback` |
| Missing API key (future `llm` only) | the server endpoint reports it is not configured; the client never sees a key | deterministic fallback sentence | `fallback` |
| Invalid or contradicting output | output validator (c, rules 1–6) fails | deterministic fallback sentence | `fallback` |
| Empty or very long input | context validator (b) fails, so the adapter is **not called** | deterministic fallback sentence | `fallback` |
| Invalid time input (rule `INPUT`) | `reasonCode = INPUT_INVALID`; the adapter is **not called**, because raw text is never forwarded | fixed sentence asking for HH:MM times (e.g. 09:30) | `fallback` |

Errors are not shown as stack traces or raw messages. A failure in the explain path is never surfaced as an availability error.

**Test-only failure simulation.** The mock adapter supports four modes, chosen by the URL query `?explainMock=<mode>`:

| Mode | Mock adapter behaviour | Expected result |
|---|---|---|
| `ok` (default) | returns its deterministic text | `source: 'mock'` |
| `timeout` | never resolves | fallback after 3 s |
| `error` | rejects | fallback |
| `nokey` | reports "not configured", as a server without a key would | fallback |

- No UI element is added for this.
- A missing or unknown value means `ok`.
- The query value is only compared against these four fixed strings. It is never shown, logged or passed to any adapter as text.

The purpose is to demonstrate XAC4 with screenshots in the real UI.

## f) UI behaviour

- The **"Explain availability"** button appears only when a check result exists (`submitted !== null`), including the `INPUT` result.
- Clicking it shows the explanation in a **separate panel** below the status card. The panel label depends on `source`:

  | `source` | Panel label (exact text) |
  |---|---|
  | `llm` | **AI-generated explanation — not a booking confirmation** |
  | `mock` | **AI-generated explanation (demo) — not a booking confirmation** |
  | `fallback` | **Standard explanation (AI unavailable) — not a booking confirmation** |

  The reason: a deterministic template must not be labelled "AI-generated", and every label states that it is not a booking confirmation.
- The button is disabled while a request is pending, so repeated clicks do not start parallel requests.
- When the result is cleared (input change, blocked toggle, "Clear result"), the explanation is cleared too. This follows the existing `setSubmitted(null)` points.
- **A late adapter response is ignored** if the result was cleared or changed while the request was pending. The response is shown only if it belongs to the result that is still displayed, so an old explanation can never appear next to a newer status card.
- The mock failure modes are selected by the URL query `?explainMock=<mode>` (see e). This is test-only, and no button, toggle or other UI element is added for it.
- The existing status card, form, bookings list, rule reference card and all other texts and classes are **untouched**. The button and the panel are the only UI additions.

## g) Architecture and trust boundary

**Flow**
1. The student enters start and end (free text).
2. `parseHHMM` validates the format. On failure the result is the UI-only `INPUT`.
3. The existing `checkAvailability` makes the decision. It is **authoritative**.
4. The structured result is shown in the existing status card. This is the confirmed decision.
5. The student clicks "Explain availability" (optional).
6. Our code builds the minimal `ExplainContext` (reason code, facts as HH:MM) and validates it.
7. The explanation adapter receives the context through one interface.
   - First implementation: the **mock adapter**, which is local and deterministic.
   - Optional later: a **real model, server-side only**, with the key only in the server environment. Not implemented unless requested.
8. The output validator checks the adapter text. Model output is **untrusted** until validated.
9. The UI shows the text as plain text in the separate labelled panel.
10. On any failure (timeout, error, missing key, invalid input or output), the deterministic fallback text is shown.

**Diagram**

```
 ┌──────────────── AUTHORITATIVE (deterministic, existing) ────────────────┐
 │ student input ─► parseHHMM ─► checkAvailability ─► structured result ──┼─► STATUS CARD
 │   (free text)    (INPUT on      (AC1→AC1→AC2→AC3→AC4)  {status,rule,…}  │   (never changed
 └──────────────────  failure) ──────────────────────────────────┬─────────┘    by explain)
                                                                 │ [Explain click]
                                                                 ▼
                                   build + validate minimal ExplainContext
                                   (no free text, no personal data, no key)
                                                                 │
                    ┌──────────── UNTRUSTED ──────────────────────▼───────────────┐
                    │  ExplainAdapter.explain(ctx)                                 │
                    │    ├─ MockAdapter (client, deterministic)   ◄─ first         │
                    │    └─ LlmAdapter → server endpoint → model  ◄─ optional;     │
                    │                    (key in server env only)    not built     │
                    └────────────────────────────────┬────────────────────────────┘
                                                     ▼  (3 s timeout)
                                   output validation (≤280 chars, ≤2 sentences,
                                   no contradiction, no "booking made")
                                       │ ok                     │ any failure
                                       ▼                        ▼
                         EXPLANATION PANEL (plain text) ◄── deterministic fallback
                         label chosen by source:
                         llm / mock (demo) / fallback ("Standard
                         explanation (AI unavailable)") — all say
                         "not a booking confirmation"
```

**Trust boundary.** Everything above the "UNTRUSTED" box is authoritative and unchanged. The adapter output only crosses into the UI through the output validator, and only into the explanation panel. Data flows one way. Nothing from the explain path feeds back into `checkAvailability`, `bookings`, `blocked` or the status card.

## Amendments

| # | Date / task | Change | Reason |
|---|---|---|---|
| A1 | Task 03, approved by the human | `durationMinutes` is `null` for `RANGE_INVALID` as well as for `INPUT_INVALID` (§b type comment and validation rule). For all other codes it must be an integer in 0..1440. | With end before start (e.g. 12:00–11:00) the duration is negative. The 0..1440 rule would then reject a correct context and force a fallback. The `RANGE_INVALID` sentence does not use the duration. |
| A2 | Task 03, approved by the human | XAC3 grep (§d): the grep for `VITE_`, `apiKey` and `dangerouslySetInnerHTML` must find **nothing in `src/`** (project code). Matches in `dist/` are allowed only if, for each pattern, the count in the bundle **equals** the count in react-dom's own file (`node_modules/react-dom/cjs/react-dom.production.min.js`). | The original wording ("finds nothing" in `src/` and `dist/`) cannot hold: the built bundle contains 13 `dangerouslySetInnerHTML` strings from React DOM's internal prop handling, the same 13 as react-dom's file (`evidence/06_after_task03_xac3_grep.txt`). |

## Open questions for later tasks

- Task 03: how the reason code is obtained (see b).
- Task 03: the exact phrase lists for output-validation rules 4–5, with tests (see c).
- Resolved: the panel label now depends on `source` (see f). This was approved by the human in Task 02.
