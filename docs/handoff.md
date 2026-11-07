# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-07,
the email sign-in E3, Hub lock and lanyard pins chat (all live).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next) and `docs/handoff.md`. Tell me in a few short lines what is
> being worked on now and what was worked on before. Then do "Now" below and ask me what's next, with buttons and
> your pick first. Plain words, say "working on it" and "done". "Push" is always a button.

## Now

- **Steady the tab bar test on WebKit** (`tests/suites/dock-tuck.cjs`, the `webkit` job in
  `.github/workflows/tests.yml`). It failed intermittently twice on 2026-11-07, both times on PRs that don't touch
  the tab bar, and passed on re-run: on #245 the page closed mid-test (line 64, "phone, a glossary screen"); on #248
  "Dr. Smiley shrinks with the bar, his disc's right edge and bottom kept" was 1.4 px off (right 375.15 -> 373.79)
  with `dsBreathe`/`dsDrift` still running. Likely cause: it measures his disc while his breathing moves it. Fix the
  test (wait for the motion, or measure his rest box), not the app; never skip the check. Reproduce first with
  `BROWSER=webkit node run.cjs dock-tuck` in `tests/` (run it several times).

## Done in this chat (all live)

- **#244, email sign-in E3** (b1107.1257): Term Review saved under the account (the name's record joins once, later
  answer wins); titles the owner gives to an account on Team access (`hub-titles`), typing the name no longer earns
  it; chat runs need the same `uid`. Rules checked in Firebase's emulator (`tests/tools/rules-e3.mjs`, 17 cases).
- **Rules published, Hub locked** (Jose, 2026-11-07, 41 phones in), after checks: every collection has a rule, AI
  calls send the sign-in, the events watcher logged in with its key, Storage rules published. Notes: #247.
- **#245, pins on your lanyard** (b1107.1407): each practice badge an enamel pin in the opening, a new one clicks on.
- **#248, tap the lanyard to see your pins** (b1107.1926): one card, every pin, name, what earned it, the day.
- Still on Jose: give Liz her title on Team access once she signs in by email.

## Facts worth keeping

- The opening runs before `index.html` defines `BADGES`, so `OP_PINS` in `features/opening.js` is a copy;
  `tests/suites/lanyard-pins.cjs` holds the two together.
- Vercel's free plan keeps runtime logs 1 hour: to see the events watcher's report, have Jose press Run on the cron
  job (Vercel, interp, Settings, Cron Jobs), then read the logs within the hour.
- Each push runs the tests twice (push and pull request); a red `webkit` in one with a green twin on the same commit
  has been the browser, not the change.
