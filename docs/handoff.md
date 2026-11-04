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
`docs/feel-audit.md`. Phases 0-4 are live (phase 4: #205, b1104.1832). What is left:

- **Phase 4's lean, open:** Dr. Smiley's lean on scroll (`drSwayScroll`, `index.html`) reads the scroll position
  in every scroll event and is billed the frame's style work; in the lab that is Chromium's CSS petals, which the
  phone composites, so only Jose's meter on a domain scroll says what it really costs. Left as it is until then.
- **Phase 5, step 1 (#207) and step 2 (`claude/feel-finish-2`):** the measuring pass (`tests/tools/finish-check.cjs`,
  26 screens, six checks) with its findings table in the audit note, then the fixes: press feedback for about 30
  kinds of control (one rule beside `.tg-sync:active`, the classes in `LIFTS`), the faint ink token darkened
  (Jose's pick, #6B7489 / #8C97AD dark, `DESIGN.md`), five contrast spots. Step 3 (`claude/feel-guard`): the guard
  suite `tests/suites/feel.cjs` in `run.cjs` (no empty flash or jump on data, press feedback on ten controls,
  contrast, a scroll that searches nothing, his face on its clock, Home at rest), and the bug it found: the term and
  doctor cards' press glow was dead under their entrance animation's forwards fill (`cardIn`, now `backwards`).
  Still owed by Jose: five phone screenshots (Ask and Team access with the keyboard up; a doctor's page, the doctor
  list's A-Z strip and a toast, for the safe areas).
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
- Phase 4 (#205, live b1104.1832): the dock companion searched the whole page for other faces and forced a layout
  on every scroll frame (it read rects after his lean's write); now the faces are found once per sync and the
  scroll check reads inside the event, writing only on a change; the hero photo's drift reads in the event too.
  A 150-term domain's scroll: script 6.0 s -> 2.4 s, dropped frames 42% -> 31%, hitch 416 -> 310 at 4x. Glass is
  never stacked on any screen (`tests/tools/glass-count.cjs`), so nothing was cut. Rule in
  `docs/features/dr-smiley.md`.
- Open changes: none. Check-ins: none.
- New tools (phase 4): `tests/tools/glass-count.cjs` (what each screen carries: glass, filters, animations,
  layers, the meter at rest), `scroll.cjs` with `SCREEN=domain` (a 150-term domain) and `PROFILE=1` (who runs
  during the scroll, browser functions billed to the app line that called them).
- New tools: `tests/tools/deploy-open.cjs` (four opens with the offline worker on, from a small local server; its
  suite `deploy-open.cjs` is in `run.cjs`), `tests/tools/face-timing.cjs` (timer lateness and frame slip; the engine
  logs under `window.__drProbe`). In a cloud session the tests' pinned Playwright needs a `-r` preload that patches
  `chromium.launch` with `executablePath: '/opt/pw-browsers/chromium'`; for `run.cjs` pass it through `NODE_OPTIONS`.
- Learned: the browser checks for a new worker on its own on the way in, so a new worker can take control before
  `load`; the page's listener must be at script level. Playwright's routes never see the worker's own script or
  fetches (hence the local server in `deploy-open.cjs`). A page served from a worker's cache is never older than that
  worker (the precache is the worker's own build), so "page older than the worker" only happens on `controllerchange`.
