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
| `journey.cjs` | End to end: Ask the Hub, briefing, Term Review, offline and storage-refused cases |
| `smiley-gaze.cjs` | Dr. Smiley's eyes, lean and moods |
| `smiley-gestures.cjs` | Dr. Smiley's five performances, frame by frame |

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
