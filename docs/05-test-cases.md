# Practice #11 · Task 05: Manual test cases (UI)

**Phase 1 (plan):** Expected was written before any run and is unchanged.
**Phase 2 (run, 2026-11-19):**
- **Who ran it:** Claude Code could not control a browser here (no Chrome extension connected). At the user's request, another Claude session drove the app with its built-in browser. The app ran on `npm run dev` at `http://localhost:5173/`, started and stopped by Claude Code.
- **Where Observed comes from:** only from that tester's two pasted reports, **run 1** and **run 2** (run 2 covered the cases run 1 skipped and re-checked the PARTIAL rows). Nothing in it was taken from the code or the unit tests.
- **Result values:**
  - **PASS**: every Expected item was observed.
  - **PARTIAL**: what was observed matches, but the case used a different input or some Expected items were not reported.
  - **NOT RUN**: the case was not performed.
  - **FAIL**: an observation contradicts Expected.
- **Screenshots:** the tester could not save files. The user saved **one** screenshot (TC01, before Check); all others listed in "Screenshots still to take" are missing.

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
| TC01 | Available, touching the booking end | Start `11:00`, end `12:00` → Check availability → Explain availability | Status card: **Available** for 11:00–12:00, no failed rule (AC4: touching only at an endpoint is allowed; AC1, AC2 hold). Panel appears **below** the status card with the **demo label** and a valid explanation that does not contradict Available. Status card unchanged after Explain. | 11:00–12:00 → **Available**, no "Failed rule" line (run 2). Panel is **below** the status card; label "AI-generated explanation (demo) — not a booking confirmation" (runs 1, 2). Text: "Good news: Room 301 is free from 11:00 to 12:00, a 60-minute slot… nothing is reserved" (run 1). Status card unchanged after Explain (run 2). | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshot `evidence/screenshots/TC01_input_before_check_952.png` (user, 952×858: inputs 11:00–12:00 and "Requested: 11:00 – 12:00 (60 min)" **before** Check; frame ends below the form, so no status card or panel is in it) |
| TC02 | Overlap | `10:30`–`11:30` → Check → Explain | Status card: **Unavailable**, failed rule **AC4** (overlaps 10:00–11:00). Panel: **demo label**, valid explanation that does **not** say the room is available or can be booked (contract §c rule 4). | 10:30–11:30 → **Unavailable**, **Failed rule: AC4** (run 2). Demo label; text "…clashes with an existing booking from 10:00 to 11:00…", reported as consistent with Unavailable (runs 1, 2). | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC03 | Blocked room; toggle clears result | (a) `11:00`–`12:00` → Check (result shown). (b) Toggle **Blocked** on. (c) `13:00`–`14:00` → Check → Explain | (b) Toggling **clears** the result, and the Explain button and panel disappear with it (contract §f: blocked toggle clears the result). (c) **Unavailable**, failed rule **AC3** (AC3: every request rejected while blocked). Panel: demo label, valid explanation consistent with Unavailable. | (a)+(b) 11:00–12:00 → Check → Blocked toggle: status card, Explain button and panel **disappeared** (run 2). (c) 13:00–14:00 while blocked → **Unavailable, Failed rule: AC3** (run 2). The panel for 13:00–14:00 was **not captured**; the AC3 explanation was observed only for 11:00–12:00 while blocked: demo label, "Room 301 is blocked at the moment, so all requests are turned down…" (run 1). | **PARTIAL** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC04 | Past start | `08:00`–`08:30` → Check → Explain | **Unavailable**, failed rule **AC1** (start must be strictly after now 09:00). Panel: demo label, valid, consistent with Unavailable. | 08:00–08:30 → **Unavailable, Failed rule: AC1**. Demo label. Text: "That slot starts at 08:00, but it is already 09:00. Try a start time later than 09:00." | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC05 | Start equals now | `09:00`–`09:30` → Check → Explain | **Unavailable**, failed rule **AC1** (start == now is rejected). Panel: demo label, valid, consistent with Unavailable. | 09:00–09:30 → **Failed rule: AC1** (run 2). The panel for this input was not captured; for the equivalent 09:00–10:00: Unavailable, demo label, "That slot starts at 09:00, but it is already 09:00…" (run 1). | **PARTIAL** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC06 | Too long | `11:00`–`13:30` (150 min) → Check → Explain | **Unavailable**, failed rule **AC2** (duration > 120 min; there is no overlap, so AC2 is the first failure by rule order). Panel: demo label, valid; any duration it mentions is 150 or the 120 maximum. | 11:00–13:30 → **Failed rule: AC2** (run 2). The panel for this input was not captured; for 11:00–13:01 (121 min): Unavailable, demo label, "121 minutes is a bit too long; slots can last up to 120 minutes…" (run 1). | **PARTIAL** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC07 | Invalid time | Start `25:99`, end `10:00` → Check → Explain | Status card: **Unavailable**, failed rule **INPUT** with an HH:MM format message. Panel: **fallback label** and a fixed hint asking for HH:MM times. The adapter is **not called** (contract §e: raw text is never forwarded), so the text does not contain `25:99`. | `25:99` / `10:00` → **Failed rule: INPUT**. Label "Standard explanation (AI unavailable) — not a booking confirmation"; text about the HH:MM format; "25:99" is **not visible** in the panel (run 2). Same result for `abc` / `12:00` (run 1). "Adapter not called" is not observable in a browser (note N1). | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC08 | Empty input | Clear both fields → Check → Explain | Same as TC07: failed rule **INPUT**; panel with **fallback label** and the fixed HH:MM hint. | Both fields empty → **Failed rule: INPUT**. Fallback label. Text: "The times could not be read. Please enter the start and end times in the HH:MM format." | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC09 | Long input | Paste 200 characters (e.g. `a` × 200) into Start, end `12:00` → Check → Explain; repeat at **375 px** | Failed rule **INPUT**. Panel: **fallback label**, fixed HH:MM hint; the 200 characters never appear in the status card or the panel. At 375 px: **no horizontal page scroll**, and the status card and panel stay within the viewport (AC6). | 200 × `a` in Start / `12:00` → **INPUT**, fallback label, fixed hint; the 200 characters are **not displayed** anywhere (1280 px and 375 px). At 375 px the status card and panel stay within the screen; **no horizontal scroll visible on the screenshot. Checked visually only, not measured.** | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet; 1280 + 375 px |
| TC10 | Timeout | URL `?explainMock=timeout`. `11:00`–`12:00` → Check → Explain; watch for ~4 s | The button is **disabled** right after the click and for **about 3 s** (contract §e: 3 s timeout; §f: disabled while pending). Then the panel shows the **fallback label** with a valid explanation. The status card (Available) is **unchanged** throughout. | `?explainMock=timeout`, 11:00–12:00 → **Available**. While waiting: no panel, button **grey and disabled**. After **~3 s**: fallback label, text "Room 301 is free from 11:00 to 12:00 (60 minutes). This is only a check, not a booking." Status card still Available. **Not measured:** exact moment the button was enabled again. | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC11 | Adapter error | URL `?explainMock=error`. `11:00`–`12:00` → Check → Explain | Panel with the **fallback label** and a valid explanation; no error message, stack trace or raw error text (contract §e). Status card unchanged. | `?explainMock=error` → **Available**. Fallback label, text "Room 301 is free from 11:00 to 12:00 (60 minutes). This is only a check, not a booking." The words "error", "key" and "not configured" were not seen on the page (run 2). Status card unchanged. | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC12 | Missing key | URL `?explainMock=nokey`. `11:00`–`12:00` → Check → Explain | Same as TC11: **fallback label**, valid text, no "key"/"not configured" text shown, status card unchanged. | `?explainMock=nokey` → same as TC11: Available, fallback label, same text; no "error"/"key"/"not configured" seen (run 2). | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC13 | Decision unchanged by Explain | Do TC02, note the status card text, failed rule and bookings list. Click Explain **3 times**, then note them again | Status card text, failed rule (**AC4**) and the bookings list (**one booking, 10:00–11:00**) are **identical** before and after (XAC2, AC5). No booking is added. Each click shows the demo panel again. | After TC02, Explain clicked **3 times**: status card, **Failed rule: AC4** and the bookings list (one booking, 10:00–11:00) **did not change**; demo panel still shown. Tester caveat: whether each click hit an enabled button is unknown (the mock answers instantly). | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC14 | Late response ignored | URL `?explainMock=timeout`. `11:00`–`12:00` → Check → Explain; **within 3 s** change the Start field (e.g. to `11:05`); wait ≥ 4 s | Changing the input **clears** the result; the status card, Explain button and panel disappear (contract §f). After the 3 s timeout **no explanation appears** (contract §f: a late response is ignored). Optional: Check again → a new result shows with **no** panel until Explain is clicked. | `?explainMock=timeout`, 11:00–12:00 → Check → Explain → Start changed to 11:05 within 3 s: result, button and panel **disappeared**; after 5 s **nothing appeared**. Optional step and a stronger variant: right after the change, Check pressed again (11:05–12:00) while the first request was still pending → new Available shown **without a panel**; after 5 s no panel appeared. | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC15 | Layout at 1280 px and 375 px | Do TC02 with an explanation shown, at viewport **1280 px**, then **375 px** | At both widths: **no horizontal scroll**. Status card and labelled panel are **both visible** and **visually distinct**: separate boxes, the panel below the card, and the label readable (XAC5, AC6). The status card looks as before the feature. | 10:30–11:30 + Explain. **1280×800**: status card and panel are two separate blocks, no horizontal scroll visible (run 2). **375 px**: no overlap, text wraps, no horizontal scroll visible (run 1). **Checked visually on screenshots only, not measured.** | **PASS** | Tester report (run 1 + run 2), 2026-11-19, Claude built-in browser; screenshots: none yet; 1280 + 375 px |
| TC16 | No Explain before a result | Fresh page load, before clicking Check; then Check → Clear result | Before any check: **no** Explain button and no panel (contract §f). After "Clear result": button and panel are gone again. | Fresh load: **no** Explain button and no panel. After Check → Explain → Clear result: button and panel **gone** again. | **PASS** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |
| TC17 | No network call on Explain | Open DevTools → Network, filter Fetch/XHR. Do TC01 and TC11 | Clicking Explain triggers **no** network request (mock adapter is local; no backend, no API key in the client: AGENTS.md, XAC3). | TC01 part: network log read right before and right after the Explain click; the last request was unchanged (`validate.ts`, id 18747), so **no new request** was seen. TC11 part (`?explainMock=error`) was **not checked**. | **PARTIAL** | Tester report (run 2), 2026-11-19, Claude built-in browser; screenshots: none yet |

TC16 and TC17 were added beyond the requested list. TC16 covers contract §f "appears only after a check result exists", and TC17 covers XAC3 / "no backend" in the running app.

### Phase 2 summary

| Result | Count | Cases |
|---|---|---|
| PASS | 13 | TC01, TC02, TC04, TC07, TC08, TC09, TC10, TC11, TC12, TC13, TC14, TC15, TC16 |
| PARTIAL | 4 | TC03, TC05, TC06 (the panel for the planned input was not captured; the rule line was confirmed), TC17 (TC11 part not checked) |
| NOT RUN | 0 | none |
| FAIL | 0 | none |

**No FAIL was observed.** All 17 cases were at least partly observed by a tester.

This is still not an acceptance:
- 4 cases are PARTIAL;
- scroll checks (TC09, TC15) were visual only;
- no screenshot files exist yet;
- the late-response guard passed in the browser (TC14). *Update (Task 06/07, fix R2):* it now also has unit tests (`src/explain/guard.test.ts`).

### Additional observations (not in the plan)

| Scenario | Input | Observed (tester report) |
|---|---|---|
| Reversed range (AC1, RANGE_INVALID) | 12:00–11:00 | Status **Unavailable**. Demo label. Text: "…not a usable time range. Try a start time that comes before the end time." Under the form, the "Requested" line shows **"Requested: 12:00 – 11:00 (-60 min)"**. See F1. |

### Notes on Expected (the Expected column was not edited)

- **N1, TC07/TC08/TC09:** "The adapter is **not called**" cannot be observed in a browser. The UI only shows the fallback label. This part of Expected can only be verified by the unit test `explain.test.ts` › does not call the adapter for INPUT_INVALID. In a future revision, the manual Expected should say "fallback label is shown" and leave the "adapter not called" claim to the unit test.
- **N2, TC17:** a dev-server page loads hundreds of module requests, so the planned method (watch the network list on click) is too noisy with the tool that was used. A better method: DevTools → Network with **Preserve log**, clear the list immediately before the click, filter Fetch/XHR. Alternatively, run against `npm run build` + `npm run preview`, where the bundle is a single file.

## Failures and surprises

No observation contradicted an Expected value. These items are inputs for Task 06 (no fixes were made in this task):

- **F1, surprise (not covered by any Expected):** for 12:00–11:00 the "Requested" line under the form shows a **negative duration, "(-60 min)"**. The status card and the explanation are correct, so this is cosmetic. *Assumption, not verified:* the line existed before the Explain feature (the `Requested:` line is in the baseline `App.tsx`), so it is probably a pre-existing defect, not a regression. Confirming that needs a run of the `practice10-baseline` build. Changing it would be a UI text/layout change, which AGENTS.md forbids unless the human explicitly asks.
- **F2, coverage gap (narrowed):** the late-response guard now **passed in the browser** (TC14, run 2). That includes the stronger variant: input changed, then Check pressed again while the first request was still pending. At the time of this run it had **no unit test** (mutation M5 not caught). *Update (Task 06/07, fix R2):* resolved. The guard is now `src/explain/guard.ts` with 8 unit tests, and M5 is caught (`docs/03-implementation.md` §5, `evidence/09_fix_r2_mutation.txt`).
- **F3, resolved in run 2:** TC13 and TC16 were run and passed.
- **F4, method gap (narrowed):** TC17 run 2 saw no new request on the Explain click in the default mode. The `?explainMock=error` part was not checked. XAC3 otherwise rests on the static grep (`evidence/06_after_task03_xac3_grep.txt`).
- **F5, partial observations:**
  - TC03, TC05, TC06: the "Failed rule" line was confirmed with the planned input (run 2), but the explanation panel was captured only for an equivalent input (run 1).
  - TC09, TC15: "no horizontal scroll" was judged visually on screenshots, not measured.
  - TC10: the moment the button was enabled again was not measured.
  - TC13: whether each of the 3 clicks hit an enabled button is unknown.
- **F6, evidence gap:** only **1 of 21** planned screenshots exists (`TC01_input_before_check_952.png`, the state before Check). No screenshot shows a status card or an explanation panel. Every other Observed cell rests on the tester's text report alone.

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
| TC14 | `guard.test.ts` › applyExplainResult / isCurrentExplain (added in Task 06/07, fix R2; before that: none, M5 not caught) | wiring of the helper into `App.tsx`, rendering |
| TC15 | none | **all of it** (layout) |
| TC16 | none | **all of it** |
| TC17 | none (only the static XAC3 grep, `evidence/06_after_task03_xac3_grep.txt`) | runtime network behaviour |

## Screenshots still to take

Save these to `evidence/screenshots/` (only `TC01_input_before_check_952.png` exists so far). The list below was written after run 1. Run 2 added TC04, TC08, TC09, TC13, TC14 and TC16; optional names for them are `TC04_past_1280.png`, `TC08_empty_1280.png`, `TC09_long_1280.png`, `TC09_long_375.png`, `TC13_after_1280.png`, `TC14_after_wait_1280.png`, `TC16_before_1280.png`.

| File | Scenario |
|---|---|
| `TC01_available_1280.png`, `TC01_available_375.png` | 11:00–12:00 + Explain |
| `TC02_overlap_1280.png` | 10:30–11:30 + Explain |
| `TC03_blocked_1280.png`, `TC03_blocked_375.png` | blocked, 11:00–12:00 + Explain |
| `TC05_now_1280.png`, `TC05_now_375.png` | 09:00–10:00 + Explain |
| `TC06_toolong_1280.png`, `TC06_toolong_375.png` | 11:00–13:01 + Explain |
| `TC07_invalid_1280.png`, `TC07_invalid_375.png` | `abc` / 12:00 + Explain |
| `TC10_timeout_pending_1280.png`, `TC10_timeout_done_1280.png`, `TC10_timeout_done_375.png` | `?explainMock=timeout` |
| `TC11_error_1280.png`, `TC11_error_375.png` | `?explainMock=error` |
| `TC12_nokey_1280.png`, `TC12_nokey_375.png` | `?explainMock=nokey` |
| `TC15_layout_1280.png`, `TC15_layout_375.png` | 10:30–11:30 + Explain |
| `X1_reversed_range_1280.png` | 12:00–11:00, shows "(-60 min)" (F1) |

## Planned evidence (Phase 2)

Screenshots go to `evidence/task05/TCxx*.png`, plus a short `evidence/09_task05_manual_run.txt` with date, browser, viewport and URL per case. TC10 and TC14 need either a short recording or several timed screenshots.
