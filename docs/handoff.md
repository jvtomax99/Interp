# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-04,
the feel audit chat (the app glitching on open, Dr. Smiley's stutter, moving the app feeling off).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (item 0 under Next), `docs/feel-audit.md` and `docs/handoff.md`.
> Tell me what's being worked on now and what was worked on before, in a few short lines. Then: if I have pasted my
> phone's meter numbers, read them against the audit's two lab columns and say which my phone is in; otherwise ask
> for them once. Then write the plan for phase 4 (scrolling and screens, same look) and wait for my go. Plain words,
> say "working on it" and "done". "Push" is always a button.

## Now: the feel audit, phases 4 and 5

Goal: the Hub feels like a premium app on Jose's iPhone. The plan, the targets in numbers and every measurement are in
`docs/feel-audit.md`. Phases 0-3 are live. What is left:

- **Phase 4, scrolling and screens, same look.** The lab cleared the bold look (no regression); the costliest scroll
  listener is Dr. Smiley's lean on scroll (`drSwayScroll`, `index.html`: it reads the scroll position on every scroll
  event, so it is billed the frame's layout). Measure on the phone first (his meter while scrolling Home and a
  150-term domain), then `tests/tools/scroll.cjs` before/after, interleaved. The Facts in `docs/PLAN.md` warn that
  moving one read only moves the bill to the next reader.
- **Phase 5, the finishing checklist and the guard.** Every screen for press feedback, loading states that never
  flash empty, nothing jumping when data arrives, safe areas, dark mode, the keyboard; then a suite that fails when a
  target regresses (no reload on open is already guarded by `deploy-open.cjs`; add hitch time at rest, face slip,
  layout shift).
- **Jose's call, open:** the hello's own canvas drawing is now the floor of the opening's frames (101-185 ms at 4x
  from 4.4 to 7.8 s). Options under Phase 2 in the audit note; "leave it, the hello is the look" is a fair answer.
- **Still owed by Jose:** the meter's Copy numbers (More, bottom) for an open right after a deploy, an open with
  nothing new, Home left alone 30 s, one slow scroll of Home; and which iPhone and iOS. They say which lab column
  (the iPhone paths or the Chromium paths) his phone is in.

## Where things stand

- Live: #200 no reload on a normal open (b1104.1206); #202 a quieter opening, pins re-applied 39 -> 3, the pen's
  forced layouts gone, the update check after the hello (b1104.1314); #203 his face frames on the sequence's own
  clock, a performance's end lands where its clock says (b1104.1348). #199 the plan, tools and findings (docs).
- Open changes: none. Check-ins: none.
- New tools: `tests/tools/deploy-open.cjs` (four opens with the offline worker on, from a small local server; its
  suite `deploy-open.cjs` is in `run.cjs`), `tests/tools/face-timing.cjs` (timer lateness and frame slip; the engine
  logs under `window.__drProbe`). In a cloud session the tests' pinned Playwright needs a `-r` preload that patches
  `chromium.launch` with `executablePath: '/opt/pw-browsers/chromium'`; for `run.cjs` pass it through `NODE_OPTIONS`.
- Learned: the browser checks for a new worker on its own on the way in, so a new worker can take control before
  `load`; the page's listener must be at script level. Playwright's routes never see the worker's own script or
  fetches (hence the local server in `deploy-open.cjs`). A page served from a worker's cache is never older than that
  worker (the precache is the worker's own build), so "page older than the worker" only happens on `controllerchange`.
