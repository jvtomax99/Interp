# PLAN — what's done, what's next

The working list for every session. Read this, `AGENTS.md` and `CLAUDE.md`,
then do **one** phase. Don't reread old chats: anything worth keeping is
written here.

## How a session runs

1. Fetch `main`. Read `AGENTS.md`, `CLAUDE.md`, this file. Read only the
   code the phase touches (banner comments in `index.html` to navigate).
2. Take the top phase under **Next**. One phase, or one group of related
   changes. Nothing else.
3. Plan it in a few lines; if it needs Jose (a decision, a console check),
   ask first and stop.
4. Do it. Check it: `node --check`, the four checks in `CLAUDE.md` for
   `index.html`, `cd tests && node run.cjs`.
5. In the same branch, update this file: move the phase to **Done** (one
   line, PR link), add what you learned under **Facts**, add new work you
   found under **Next** or **Later**.
6. Push a branch, open a pull request, report to Jose in 2-4 lines.
   He says "merge"; nothing merges without him. Never delete anything he
   hasn't approved.
7. Session over. A new phase is a new session.

Short follow-ups on the same pull request can stay in the same session.
Coming back hours later: start a new session, not the old chat.

## Next (in order)

1. **Slim `CLAUDE.md`.** It's ~580 lines and every session reads all of it.
   Move the feature write-ups (Ask the Hub, Dr. Smiley's memory and
   follow-ups, the companion panel, answer layout, Term Review, Daily
   Drill, journey rules, 3D Body, User Guide, Team access) into
   `docs/features/<name>.md`, leaving one line each in `CLAUDE.md` saying
   where. Same for the Dr. Smiley gotchas → `docs/features/dr-smiley.md`.
   No rule may be lost: diff old vs new text. Mirror any rule change in
   `AGENTS.md`.
2. **Dead CSS.** ~125 rules (~14 KB) in `index.html`'s styles target classes
   nothing produces (old top bar `tg-*`, old greeting `home-greeting-brand*`,
   `lightbox-*`, `nav-section-*`, `subgroup-bar*`, `whoami*`, …). Remove in
   one PR; prove nothing changed with before/after screenshots of every
   screen, phone and computer, plus the suites.
3. **AI models.** `claude-sonnet-5` (doctor-research, term-lookup,
   translate backup) → `claude-sonnet-5-5`; `claude-opus-5` (term-check
   backup) → `claude-opus-5-5`. One endpoint per PR; compare a few real
   answers before/after (effort levels were recalibrated). Read the
   claude-api skill first.
4. **One Claude helper in `api/`.** `_routine.js`, `ask.js`,
   `doctor-research.js`, `term-lookup.js` each build their own request and
   retry rule; `clip()` is defined 3 times. Grow `_routine.js` into the one
   helper; move one endpoint per PR.
5. **Home styles in layers.** In `home-polish.css` the greeting name is
   restyled by 13 rules, the quote by 12. Merge each element's rules into
   one, one element per PR, pixel-compared. Jose signs off on the look.

## Later (only when the trigger happens)

- **Glossary changes-only sync.** Each cold start reads every term (~1,700
  reads; persistence is off on purpose, iPhone crashes). Do it only if
  Firestore reads near 50K/day (Usage page). Was 23K on 2026-10-13.
- **Split `index.html`** (1.6 MB) into CSS + JS by feature. Big; plan it as
  its own multi-phase effort, coordinated with ChatGPT's edits.
- **Reduced motion, softer.** With Reduce Motion / Still, the name has no
  pen. Option: a short fade instead. Jose's call.
- **Training & Events listener has no limit.** Fine while small; a cap
  breaks the unread badge (it counts events), so it needs a new badge rule.

## Done

- 2026-10-10 CCC watcher source: moved, then switched off (site answers
  403 to the watcher). jvtomax99/Interp#22, #23.
- 2026-10-13 Phase 1 cleanup: 16 dead functions, 6 unused files, internal
  files no longer served. #24.
- 2026-10-14 Startup: 2 finished migrations + old blob code removed. #25.

## Facts (so nobody re-checks)

- Firebase plan: Blaze. Reads ~23K/day, cost ~$0.17/month (2026-10-13).
- `terminology-meta/migrations`: `oncologySplit`, `slangGlossary` done.
- CCC (`cultureandlanguage.net`) blocks the watcher: HTTP 403 from Vercel.
- Moisés's frozen Dr. Smiley / no pen = Still mode or iPhone Reduce
  Motion, by design. Not a bug.
- This cloud container can't reach the live site, Firebase or third-party
  sites, and the Vercel connector can't read team logs. Ask Jose for
  screenshots.
- Weekly code report: Routine "Weekly code cleanup report", Mondays 11:51
  New York, report-only, phone notification.
