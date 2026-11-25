# Practice #12: code version vs low-code version (Budibase)

Both versions implement the "Smart Campus Room Availability Checker" for Room 301.

**Sources.** Code version: only `evidence/09_task05_manual_run.txt`. Low-code version: only the facts below. Anything not covered by a source is marked "not verified".

**Facts about the low-code version (self-hosted Budibase, http://localhost:10000, app "Room 301 Low-code")**
- The check logic was verified **in the editor** on two cases: 12:00–13:00 → Available; 10:00–11:00 → AC4 (overlap).
- Tests **T1–T8 did not pass**: Preview does not display the check result.
- This is a limitation of the test bench (Preview output), recorded as it is. It is not a claim that the logic is wrong, and not a claim that it is right for T1–T8.

## Comparison

| Criterion | Code version (React + TypeScript) | Low-code version (Budibase) |
|---|---|---|
| Logic transparency | Observed behaviour per case is written down: status, failed rule, panel label and text (e.g. TC02 → Unavailable, AC4; TC05 → AC1). The log does not describe the source code itself. | Logic was inspected in the Budibase editor; two cases checked there (12:00–13:00 → Available, 10:00–11:00 → AC4). Not verified beyond those two cases. |
| Reproducibility of a run | A scripted run exists: dev server + headless Edge 158, 28 screenshots in `evidence/screenshots/`, per-case log. A reader can compare the log with the screenshots. | Not reproducible as a test run: T1–T8 did not pass because Preview shows no result. No test evidence. |
| Prototype speed | Not measured in the sources. (Time per task is the author's own item, Task 06.) | Not measured in the sources. (Same: Task 06.) |
| Dependencies | Dev server (`npm run dev`) and the project's own packages. The run used a headless Edge. | Docker, a self-hosted Budibase instance, a table `Bookings`. All three must be up for the app to work. |
| Security | Not assessed in the sources beyond the run log. The log shows the explanation text never contains the raw invalid input (TC07, TC09). No broader review is claimed here. | Review not performed. See the risk list below. |
| Coverage of T1–T8 / cases | 17 planned cases: PASS 14, PARTIAL 2 (TC03, TC16), NOT RUN 1 (TC17), FAIL 0. Plus X1 (observation only). | T1–T8: **0 passed** (not covered). Logic seen in the editor on 2 cases only. |

Caveat on the code-version numbers: the run was scripted (headless Edge over the DevTools protocol), not clicked by a person. During the run only 3 of the 28 new PNGs were viewed (by the AI); the rest were confirmed by page text. Afterwards the author viewed all 30 files (the log and the PNGs in `evidence/`) and found them clean: only the app UI and test times, no personal data or secrets. TC03 and TC16 are PARTIAL for the reasons in the log. These caveats are in `evidence/09_task05_manual_run.txt`.

## Recommendation

1. **Submit the code version** as the fully verified work: 14 PASS, 2 PARTIAL, 1 NOT RUN, 0 FAIL, with screenshots and a log.
2. **Describe the low-code version as a prototype** with T1–T8 **not closed**. Do not present it as verified. State the reason: Preview does not display the check result (a bench limitation), and the logic was seen working in the editor on two cases only.
3. Do not mix the two evidence sets: no T1–T8 pass count for low-code, and no claim that the low-code app matches the code version.

## Security review of the low-code version (Task 07)

Status: **review not performed.** There are no facts about the configuration of this instance beyond what is listed under "Facts". The items below are risks to check, not findings.

| Area | Risk to check | Status |
|---|---|---|
| Docker | Budibase runs as containers on the local machine. Container images, exposed ports and volumes come from the Budibase install. Image provenance and version are not recorded here. | Not verified |
| Access to localhost:10000 | The app is reachable on port 10000. Whether it is bound only to this machine or visible on the network was not checked. | Not verified |
| Administrator credentials | A self-hosted Budibase needs an admin account. Where the credentials are kept and how strong they are was not recorded. No credentials are written in this document. | Not verified |
| Data in table `Bookings` | Booking rows live in a table in the Budibase instance (its own database in Docker volumes). Who can read or edit the table, and whether the data is fictional only, was not checked. | Not verified |
| Persistence and backups | Data survives in Docker volumes; no backup or cleanup procedure is described. | Not verified |

The text of the security checklist itself is left to the author (not written here).

## Author items

### Time per task (Task 06)

Draft from the author's notes. The author must add their own time per task and per step; the repository has no timing data for the low-code work.

Commit times (2026-11-19). The gap between commits is an upper bound, not effort: it includes breaks and work outside the repository.

| Task | Commit | Time | Gap from previous |
|---|---|---|---|
| Task 01: baseline | 5cbacc8 | 15:20 | start |
| Task 02: contract, AGENTS.md, README | 898eefe | 15:28 | ~8 min |
| Task 03: Explain, mock adapter, validators, UI | 08d0748 | 15:45 | ~17 min |
| Task 03: mutation checks | 0f5612a | 15:49 | ~4 min |
| Task 04: system instruction and prompt | 86aad0b | 15:57 | ~8 min |
| Task 05: test plan | d588781 | 15:58 | ~1 min |
| Task 05: observations (part 1) | 3e6bc36 | 17:05 | ~67 min (waited for another tester) |
| Task 06–07: findings, R1, R2 | 7bc5254, bf721b0, da1d741 | 17:12 | ~7 min, three commits in one minute |

Later, 2026-11-25:
- Task 05 re-run with screenshots: dev server start, script in headless Edge, 28 PNG, log. Commit 5742dbd at 22:50. Run time not measured.
- Budibase: installing `@budibase/cli` took about 1 min. `budi hosting --init` failed on an interactive question about the port. Setup and checks were run by the author; no time recorded here.
- Code vs low-code comparison: commit d652b63 at 22:47.

To add from the author's own notes: time on the low-code app in Budibase, on T1–T8, and on debugging Preview. The repository has no facts for these.

### AI reflection

Draft, to be edited by the author.

I used AI as an executor under rules I wrote in advance: `AGENTS.md`, the feature contract, and criteria AC1–AC5 and XAC1–XAC5. This helped in two places. Expected test results were written before the runs, so observations were not fitted to the answers. Mutation checks showed gaps in the tests: the late-response guard was not covered at first, then `guard.test.ts` was added.

There were limits too. AI could not drive the browser through the extension, so the Task 05 run went through a script in headless Edge. It is not a manual run, and the log says so. Two cases remain PARTIAL (TC03, TC16), and TC17 was not run.

In the low-code version on Budibase, logic was checked in the editor on two cases. T1–T8 did not pass because Preview does not show the result. I recorded this as a limitation of the bench and do not present the version as verified. For submission I use the code version: 14 PASS, 2 PARTIAL, 1 NOT RUN, 0 FAIL.

Conclusion: AI sped up routine work and the search for gaps, but a person must check results, decide what counts as evidence, and answer for the wording. This matters most when AI reports "PASS".

### Security checklist text

Budibase self-host. Marks: [x] confirmed by facts, [ ] not checked.

**Environment and Docker**
- [ ] Budibase images are from the official source, version recorded.
- [ ] Published ports checked: `docker ps` shows port 10000 listening on localhost, not on all interfaces.
- [ ] Docker volumes with data contain no real personal data.

**Access**
- [ ] `http://localhost:10000` is not reachable from other machines on the network (check port binding and firewall).
- [ ] Only one administrator; the account was created by hand.
- [ ] The administrator password is not in the repository, the report, or the screenshots.
- [ ] The generated `.env` in the local Budibase folder (it holds secrets) is not in git.

**Data**
- [ ] Table `Bookings` contains only made-up data (room 301, times).
- [ ] Table permissions are restricted, no extra users.
- [ ] Clear how to delete the data and the volumes after the lab.

**App and logic**
- [ ] Check logic in the editor matches AC1–AC4 (verified on two cases: 12:00–13:00 → Available, 10:00–11:00 → AC4).
- [x] T1–T8 result is not claimed as passed (did not pass because of Preview).
- [ ] User input is validated for wrong format and empty value (in the code version: TC07–TC09; not checked in low-code).

**Reporting**
- [x] `docs/low-code-comparison.md` contains no passwords or keys.
- [x] Unchecked items are marked "not checked", not as passed.

## Left to the author (not done here)

- Asking the teacher about the submission method (email vs repository; PDF or photos of slides).
