# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-07,
the More sheet and tab bar chat (both live).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next) and `docs/handoff.md`. Tell me in a few short lines what is
> being worked on now and what was worked on before. Then finish #242 (below) and ask me what's next, with
> buttons and your pick first. Plain words, say "working on it" and "done". "Push" is always a button.

## Now

- **#242, notes only** (branch `claude/plan-tab-bar-done`): the plan's Done line for the slim tab bar, the tab bar
  note marked live, and this handoff. Nothing deployed changes. When GitHub's checks pass, send the phone
  notification and the Push button; merge with the head SHA pinned. A check-in may still fire for it in the old
  chat; ignore it.

## Done in this chat (all live)

- **#236, More, grouped** (b1106.2156). Ask the Hub, then Study, Doctors, Reference, You; every domain behind one
  row; numbers only when they need you; settings rows open their own sheet with ‹ More. Home's sections renamed
  Study and Reference. `docs/features/more-sheet.md`.
- **#240, the tab bar slim when you scroll** (b1107.0125; Jose's pick B of four mockups). 46 px, icons only, every
  tab one tap; only on a real scroll; no 4 s timer; no flicker at the top or bottom. Also fixed Team Chat's box
  sitting 6 px short of the bar (measured during the slide-in). `docs/features/tab-bar.md`.
- **#238**: the plan's Done line for More.
- GitHub's full test run takes 37-41 min now; its cap went from 40 to 55 min (`.github/workflows/tests.yml`).

## Facts worth keeping

- Mobile WebKit has no mouse wheel, and CI's WebKit delivers scroll events late: tests scroll with `scrollBy` and
  wait for each `scroll` event (`tests/suites/dock-tuck.cjs`).
- Main moves often (other chats merge there); fetch and merge it before asking for a push, and expect a New lately
  card clash in `GUIDE_NEWS` (keep three cards).
- Not yet unified: Home's sections and the desktop sidebar keep their own tool lists; `more-sheet.cjs` only checks
  More against `getToolTiles()`.
