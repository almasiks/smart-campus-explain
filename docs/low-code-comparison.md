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

Caveat on the code-version numbers: the run was scripted (headless Edge over the DevTools protocol), not clicked by a person. Only 3 of the 28 PNGs were viewed by the tester; the rest are confirmed by page text. TC03 and TC16 are PARTIAL for the reasons in the log. These caveats are in `evidence/09_task05_manual_run.txt`.

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

## Left to the author (not done here)

- Time per task (Task 06).
- AI reflection.
- The text of the security checklist.
- Asking the teacher about the submission method (email vs repository; PDF or photos of slides).
