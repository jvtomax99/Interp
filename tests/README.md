# The app's checks

Each suite opens the real app (this checkout's `index.html`, `home-polish.*`,
`pin-icons.js`) in a headless Chromium at phone and computer sizes, does what
a person would do, and checks the result by measuring: what's on screen, what
receives a tap, what was saved. Nothing touches the live Hub: Firebase is
replaced by an in-memory stand-in seeded with the built-in glossary
(`support/`), and the AI endpoints answer with fixed examples.

| Suite | What it covers |
|---|---|
| `events-login.mjs` | The events watcher's own login (`api/_service-login.js`), with a throwaway key; no browser |
| `daily-drill.cjs` | Daily Drill: the three rounds at every level, the trap, compare, the clock, your place kept, score, level up/down, Home card |
| `guide.cjs` | User Guide: search, answers, steps, Show me, deep links |
| `destination-labels.cjs` | Doctor Prep and Doctors entrances, Provider Pictures labels, route and scroll restoration, glossary state, separate appointment briefing, guide targets |
| `doctor-page.cjs` | The doctor's page: header, bento, tier tabs, terms read aloud, 44px targets, the glass bar's three buttons, Back, dark mode |
| `journey.cjs` | End to end: Ask the Hub, briefing, Term Review, offline and storage-refused cases |
| `smiley-gaze.cjs` | Dr. Smiley's eyes, lean and moods |
| `smiley-brows.cjs` | Dr. Smiley's brows: follow the face, held poses, Focused, Still |
| `smiley-gestures.cjs` | Dr. Smiley's five performances, frame by frame |
| `smiley-squash.cjs` | Dr. Smiley's squash and stretch: cheer and greet only, at most 4%, volume kept, never on what holds him, back to his drawn shape (also when interrupted), none in Focused, Still or where the picture itself leans |
| `home-rest.cjs` | Home decor: petals (Chromium: one canvas per place from a worker; iPhone Safari: the old animated elements, no will-change; both keep falling, stop when scrolled away, rest under reduced motion) and heartline loop; the badge loop ends; the card ring glows on arrival only |
| `dock-tuck.cjs` | Tab bar tuck and open: only transform and opacity move, the bar's own size never animates, nothing left behind, tucked sizes as before (Dr. Smiley's disc and tag included), turns around mid-move without a jump, instant under reduced motion. Also runs in WebKit in CI |
| `campus-life.cjs` | Campus life round 2: the ambulance bay's doors on the ambulance's clock, the lot car backing out and driving off in its second look, the bench sitters' head turns, the flock, everything paused off screen, reduced motion |
| `chat-titles.cjs` | Team Chat titles: Admin follows the owner-code phone (a typed name can't borrow it), Supervisor of Language Services by name and spellings, new messages carry the phone |

## Run them

```
cd tests
npm install                      # once
npx playwright install chromium  # once (skip where Chromium is already set up)
node run.cjs                     # all suites, about 8 minutes
node run.cjs daily-drill guide   # just these
```

A suite fails when it prints a `FAIL` line, crashes, or checks nothing.
Screenshots and logs go to `tests/out/` (not kept in git).

GitHub runs the same thing on every push (`.github/workflows/tests.yml`), so
a change from any tool gets a green check or a red X on its commit.

`ROOT=/other/checkout node run.cjs` tests another copy of the app;
`INDEX=/path/to/index.html` serves a different `index.html` (before/after).

## Tools (run by hand, not part of `run.cjs`)

- `tools/perf.cjs`: smoothness numbers (idle busy %, tap waits, startup, layout shift, animations that aren't transform/opacity) at iPhone size with the CPU slowed 4x. The S-phases in `docs/PLAN.md` are judged by it.
- `tools/startup.cjs`: the app opening, task by task (S3): each long task's biggest pieces, the script lines that forced a layout, and the functions that took the time. `UA=chromium`, `RETURNING=1`, `RUNS=n`, `ROOT=` another checkout for before/after.
- `tools/idle.cjs`: Home left still (S7): the meter's numbers and longest stalls, and every main-thread task over 50 ms with what ran in it. `SCROLL=n` scrolls first, `START=s` waits after load, `UA=iphone`, `RUNS=n`, `INDEX=` another index.html.
- `tools/doctor-replay.cjs`: replays a `doctors.json` export through the doctor page and reports anything lost.
