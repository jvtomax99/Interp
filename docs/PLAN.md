# PLAN — what's done, what's next

The working list for every session. Read this, `AGENTS.md` and `CLAUDE.md`,
then do **one** phase. Don't reread old chats: anything worth keeping is
written here.

## How a session runs

1. Fetch `main`. Read `AGENTS.md`, `CLAUDE.md`, this file. Read only the
   code the phase touches (banner comments in `index.html` to navigate)
   and its note in `docs/features/`, if it has one.
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

1. **Dead CSS.** ~125 rules (~14 KB) in `index.html`'s styles target classes
   nothing produces (old top bar `tg-*`, old greeting `home-greeting-brand*`,
   `lightbox-*`, `nav-section-*`, `subgroup-bar*`, `whoami*`, …). Remove in
   one PR; prove nothing changed with before/after screenshots of every
   screen, phone and computer, plus the suites.
2. **AI models.** `claude-sonnet-5` (doctor-research, term-lookup,
   translate backup) → `claude-sonnet-5-5`; `claude-opus-5` (term-check
   backup) → `claude-opus-5-5`. One endpoint per PR; compare a few real
   answers before/after (effort levels were recalibrated). Read the
   claude-api skill first.
3. **One Claude helper in `api/`.** `_routine.js`, `ask.js`,
   `doctor-research.js`, `term-lookup.js` each build their own request and
   retry rule; `clip()` is defined 3 times. Grow `_routine.js` into the one
   helper; move one endpoint per PR.
4. **Home styles in layers.** In `home-polish.css` the greeting name is
   restyled by 13 rules, the quote by 12. Merge each element's rules into
   one, one element per PR, pixel-compared. Jose signs off on the look.
5. **Stale numbers in `CLAUDE.md` / `AGENTS.md`.** File map line counts are
   old (`index.html` is 28,056 lines, 1.6 MB, not 28,341; AGENTS says
   ~21,000 lines, 1.1 MB; CLAUDE.md's Open items says 1.1 MB). The "Known
   gap" paragraph says there are no spacing or font-size variables, but the
   Type paragraph says `--fs-*` / `--sp-*` exist. Check the code, fix the
   text, both files.

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
- 2026-10-14 `CLAUDE.md` slimmed 584 → 350 lines: 11 feature write-ups
  moved verbatim to `docs/features/`, one pointer line each. #27.

## Facts (so nobody re-checks)

- Firebase plan: Blaze. Reads ~23K/day, cost ~$0.17/month (2026-10-13).
- `terminology-meta/migrations`: `oncologySplit`, `slangGlossary` done.
- CCC (`cultureandlanguage.net`) blocks the watcher: HTTP 403 from Vercel.
- Moisés's frozen Dr. Smiley / no pen = Still mode or iPhone Reduce
  Motion, by design. Not a bug.
- This cloud container can't reach the live site, Firebase or third-party
  sites, and the Vercel connector can't read team logs. Ask Jose for
  screenshots.
- Feature write-ups: `docs/features/*.md`. Moving them was checked line by
  line (every non-blank line of the old `CLAUDE.md` is in the new one or a
  feature file).
- Weekly code report: Routine "Weekly code cleanup report", Mondays 11:51
  New York, report-only, phone notification.
