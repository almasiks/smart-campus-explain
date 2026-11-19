# Practice #11 · Task 05: Manual test cases (UI)

**Phase 1: plan only. The app has NOT been run.** Observed, Result and Evidence are "not run" and will be filled in Phase 2.

**Sources of the Expected column:** `AGENTS.md` (AC1–AC6, rule order, the Explain section) and `docs/02-feature-contract.md` (b–g, Amendments). These were written **without** reading the implementation's output. Where an expectation comes from existing UI behaviour that the contract only references (e.g. "input change clears the result"), the source is named.

**Fixture:** Room 301, now = **09:00**, one booking **10:00–11:00**, room **not blocked** unless stated.

**Setup for every case:**
- run `npm run dev` and open the printed local URL (no query string unless stated);
- reload the page between cases, so each case starts from the fixture state;
- default viewport is a desktop width, unless the case names 375 px.

**Terms used below**
- **Status card**: the existing result section (Available / Unavailable, reason, "Failed rule: …").
- **Panel**: the new explanation panel below the status card.
- **Demo label** = "AI-generated explanation (demo) — not a booking confirmation" (source `mock`).
- **Fallback label** = "Standard explanation (AI unavailable) — not a booking confirmation" (source `fallback`).
- **Valid explanation** (contract §c): plain text, non-empty, ≤ 280 characters, ≤ 2 sentences, consistent with the status, no claim that a booking was made, and only rooms, times and numbers from the request facts.

## Test cases

| ID | Scenario | Input and steps | Expected | Observed | Result | Evidence |
|---|---|---|---|---|---|---|
| TC01 | Available, touching the booking end | Start `11:00`, end `12:00` → Check availability → Explain availability | Status card: **Available** for 11:00–12:00, no failed rule (AC4: touching only at an endpoint is allowed; AC1, AC2 hold). Panel appears **below** the status card with the **demo label** and a valid explanation that does not contradict Available. Status card unchanged after Explain. | not run | not run | not run |
| TC02 | Overlap | `10:30`–`11:30` → Check → Explain | Status card: **Unavailable**, failed rule **AC4** (overlaps 10:00–11:00). Panel: **demo label**, valid explanation that does **not** say the room is available or can be booked (contract §c rule 4). | not run | not run | not run |
| TC03 | Blocked room; toggle clears result | (a) `11:00`–`12:00` → Check (result shown). (b) Toggle **Blocked** on. (c) `13:00`–`14:00` → Check → Explain | (b) Toggling **clears** the result, and the Explain button and panel disappear with it (contract §f: blocked toggle clears the result). (c) **Unavailable**, failed rule **AC3** (AC3: every request rejected while blocked). Panel: demo label, valid explanation consistent with Unavailable. | not run | not run | not run |
| TC04 | Past start | `08:00`–`08:30` → Check → Explain | **Unavailable**, failed rule **AC1** (start must be strictly after now 09:00). Panel: demo label, valid, consistent with Unavailable. | not run | not run | not run |
| TC05 | Start equals now | `09:00`–`09:30` → Check → Explain | **Unavailable**, failed rule **AC1** (start == now is rejected). Panel: demo label, valid, consistent with Unavailable. | not run | not run | not run |
| TC06 | Too long | `11:00`–`13:30` (150 min) → Check → Explain | **Unavailable**, failed rule **AC2** (duration > 120 min; there is no overlap, so AC2 is the first failure by rule order). Panel: demo label, valid; any duration it mentions is 150 or the 120 maximum. | not run | not run | not run |
| TC07 | Invalid time | Start `25:99`, end `10:00` → Check → Explain | Status card: **Unavailable**, failed rule **INPUT** with an HH:MM format message. Panel: **fallback label** and a fixed hint asking for HH:MM times. The adapter is **not called** (contract §e: raw text is never forwarded), so the text does not contain `25:99`. | not run | not run | not run |
| TC08 | Empty input | Clear both fields → Check → Explain | Same as TC07: failed rule **INPUT**; panel with **fallback label** and the fixed HH:MM hint. | not run | not run | not run |
| TC09 | Long input | Paste 200 characters (e.g. `a` × 200) into Start, end `12:00` → Check → Explain; repeat at **375 px** | Failed rule **INPUT**. Panel: **fallback label**, fixed HH:MM hint; the 200 characters never appear in the status card or the panel. At 375 px: **no horizontal page scroll**, and the status card and panel stay within the viewport (AC6). | not run | not run | not run |
| TC10 | Timeout | URL `?explainMock=timeout`. `11:00`–`12:00` → Check → Explain; watch for ~4 s | The button is **disabled** right after the click and for **about 3 s** (contract §e: 3 s timeout; §f: disabled while pending). Then the panel shows the **fallback label** with a valid explanation. The status card (Available) is **unchanged** throughout. | not run | not run | not run |
| TC11 | Adapter error | URL `?explainMock=error`. `11:00`–`12:00` → Check → Explain | Panel with the **fallback label** and a valid explanation; no error message, stack trace or raw error text (contract §e). Status card unchanged. | not run | not run | not run |
| TC12 | Missing key | URL `?explainMock=nokey`. `11:00`–`12:00` → Check → Explain | Same as TC11: **fallback label**, valid text, no "key"/"not configured" text shown, status card unchanged. | not run | not run | not run |
| TC13 | Decision unchanged by Explain | Do TC02, note the status card text, failed rule and bookings list. Click Explain **3 times**, then note them again | Status card text, failed rule (**AC4**) and the bookings list (**one booking, 10:00–11:00**) are **identical** before and after (XAC2, AC5). No booking is added. Each click shows the demo panel again. | not run | not run | not run |
| TC14 | Late response ignored | URL `?explainMock=timeout`. `11:00`–`12:00` → Check → Explain; **within 3 s** change the Start field (e.g. to `11:05`); wait ≥ 4 s | Changing the input **clears** the result; the status card, Explain button and panel disappear (contract §f). After the 3 s timeout **no explanation appears** (contract §f: a late response is ignored). Optional: Check again → a new result shows with **no** panel until Explain is clicked. | not run | not run | not run |
| TC15 | Layout at 1280 px and 375 px | Do TC02 with an explanation shown, at viewport **1280 px**, then **375 px** | At both widths: **no horizontal scroll**. Status card and labelled panel are **both visible** and **visually distinct**: separate boxes, the panel below the card, and the label readable (XAC5, AC6). The status card looks as before the feature. | not run | not run | not run |
| TC16 | No Explain before a result | Fresh page load, before clicking Check; then Check → Clear result | Before any check: **no** Explain button and no panel (contract §f). After "Clear result": button and panel are gone again. | not run | not run | not run |
| TC17 | No network call on Explain | Open DevTools → Network, filter Fetch/XHR. Do TC01 and TC11 | Clicking Explain triggers **no** network request (mock adapter is local; no backend, no API key in the client: AGENTS.md, XAC3). | not run | not run | not run |

TC16 and TC17 were added beyond the requested list. TC16 covers contract §f "appears only after a check result exists", and TC17 covers XAC3 / "no backend" in the running app.

## Unit-test overlap

This shows which automated tests already cover the same **logic**. The manual case remains the only check of the **rendered UI**.

| ID | Unit tests covering the same logic | Not covered by unit tests |
|---|---|---|
| TC01 | `availability.test.ts` › accepts a request that only touches an existing booking endpoint; `explain.test.ts` › ok mode … AVAILABLE; `explain.test.ts` › panelLabel maps each source | rendering, panel position, label shown |
| TC02 | `availability.test.ts` › rejects a request overlapping…; `availability.code.test.ts` › OVERLAP + conflict; `explain.test.ts` › ok mode … OVERLAP | rendering |
| TC03 | `availability.test.ts` › rejects every request when the room is blocked (AC3); `availability.code.test.ts` › ROOM_BLOCKED | **toggle clears the result** (UI state only) |
| TC04 | `availability.test.ts` › rejects a start in the past (AC1); `availability.code.test.ts` › START_NOT_AFTER_NOW | rendering |
| TC05 | `availability.test.ts` › rejects a start equal to now (AC1) | rendering |
| TC06 | `availability.test.ts` › rejects a duration over 120 minutes (AC2) (different input, 11:00–13:01) | this exact input |
| TC07 | `time.test.ts` › rejects out-of-range hours and minutes; `explain.test.ts` › does not call the adapter for INPUT_INVALID; `validate.test.ts` › fallback text for INPUT_INVALID passes | INPUT result + panel in UI |
| TC08 | `time.test.ts` › rejects malformed strings (`''`); same explain tests as TC07 | rendering |
| TC09 | `time.test.ts` › rejects malformed strings (regex only accepts `H:MM`/`HH:MM`) | **200-character input, 375 px layout** |
| TC10 | `explain.test.ts` › timeout mode falls back after exactly 3 s (fake timers) | **disabled button** in the real UI, real 3 s timing |
| TC11 | `explain.test.ts` › error mode falls back | rendering, no error text shown |
| TC12 | `explain.test.ts` › nokey mode falls back | rendering |
| TC13 | `explain.test.ts` › XAC2 …; `availability.test.ts` › does not modify the bookings array; `time.test.ts` › does not mutate fixtures | repeated clicks in UI |
| TC14 | **none**: the late-response guard lives in `App.tsx` (mutation M5 in `docs/03-implementation.md` §5 was not caught) | **all of it** |
| TC15 | none | **all of it** (layout) |
| TC16 | none | **all of it** |
| TC17 | none (only the static XAC3 grep, `evidence/06_after_task03_xac3_grep.txt`) | runtime network behaviour |

## Planned evidence (Phase 2)

Screenshots go to `evidence/task05/TCxx*.png`, plus a short `evidence/09_task05_manual_run.txt` with date, browser, viewport and URL per case. TC10 and TC14 need either a short recording or several timed screenshots.
