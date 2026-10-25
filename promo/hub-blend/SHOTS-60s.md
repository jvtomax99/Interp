# Shot table: the 1-minute promo (approved 2026-10-25; built as draft stills the same day)

The clock is the locked voice (`assets/voice-60s/`). The passages are cut at their pauses, and
silence is added between features so each gets at least 2.5 s (BRIEF.md: never under 2.3 s).
Speech ends at 58.4 s, then 1.6 s of music to close. Times are when the voice starts, ±0.1 s,
read off the waveform; the build re-reads them exactly.

| Starts | Shot | Voice | What happens | Status |
|---|---|---|---|---|
| 0.4 | Hook | "The doctor says: heart failure." | The thick 3D words under the spotlight, as in the 45 s film | built, retimed |
| 2.9 | Hook, timer | "Time to find the word: zero point three three seconds." | The timer rolls to 0.33 while he says it (was 1.3 s, now about 3 s) | built, retimed |
| 7.0 | Hook, wrong | "¿Fallo cardíaco?" (Dora) | The wrong word lands | built, retimed |
| 8.4 | Hook, strike | "Not for patients." | Red strike and the pill | built, retimed |
| 10.2 | Hook, right | "Insuficiencia cardíaca." (Dora) | The right word | built, retimed |
| 12.8 | Logo | "Interpreter Hub. For the HUMC interpreter team." | The 3D logo; it now has 4.9 s instead of 2 s, so it holds longer at the end | built, retimed |
| 17.7 | Home | "Built by our own interpreters." | as now | built |
| 20.2 | Glossary | "One glossary, every specialty." | as now | built |
| 22.7 | Translate | "Glossary first, A.I. second." | as now | built |
| 25.2 | Doctor Prep | "Ready for every physician." | as now | built |
| 27.7 | False Friends | "A hundred and one false friends. Flagged." | as now, 3.2 s | built |
| 30.9 | Daily Drill | "Daily drills, sharp skills." | as now | built |
| 33.4 | CoreCHI | "National certification. Prep built in." | as now, 3.0 s | built |
| 36.5 | Team Chat | "One team, one channel." | as now | built |
| 39.0 | **3D Body** | "Every part of the body, in 3D. In both languages." | The body coming apart and its Heart / Corazón card, which the 45 s film plays inside the Glossary shot, now its own shot; the laptop says Heart / Corazón / EN · ES. Caption "Every Part, In 3D." / "In Both Languages." (the longer one wrapped to three lines) | built, moved |
| 43.2 | **Notifications** | "Team news reaches you, even with the Hub closed." | **New**, on the desk like every feature: the laptop is a lock screen (9:41), three of the Hub's notifications drop in (Team Chat, New training, from the team's owners), "Even With The Hub Closed"; the phone shows the real Notifications screen (switched on), its Team Chat switch the proof, shown big only from 1.7 s, once all three have landed | built |
| 46.5 | **Knowledge brain** | "Every term you know lights up." | **New**: the laptop shows the knowledge brain turning, its real points (`assets/kbrain.json`, `tools/capture-kbrain.cjs`), the terms lighting up one by one as the count climbs to 171 of 328 known; the phone shows Term Review with its small brain. No big proof card, so the laptop is the picture | built |
| 49.0 | Ask | "Stuck? Ask Dr. Smiley." | as now | built |
| 51.6 | End | "Interpreter Hub. Built here, for our patients. Live today, on any phone. Better words. Safer care." | The laptop and phone end card; each line appears as he says it | built, retimed |

**Hops:** Dr. Smiley's 0.4 s hop between features stays as it is.

**Sound effects:** re-cued in step 6, from the new frames.

**Built** with `data-cut="60"` on the same code as the 45 s film (`remake-60.html` draft,
`remake-60-final.html` 1080x1920); the 45 s film draws the same, frame for frame (7 frames compared
against `main`, identical). The 60 s voice is laid by `tools/voice60.py`.

**Rendered** 2026-10-25: draft and final (`BRIEF-60s.md`, "Done so far"). **Not done:** music (Demucs blocked here).
