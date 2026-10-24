# The app's checks

Each suite opens the real app (this checkout's `index.html`, `app.css`, `home-polish.*`,
`pin-icons.js`) in a headless Chromium at phone and computer sizes, does what
a person would do, and checks the result by measuring: what's on screen, what
receives a tap, what was saved. Nothing touches the live Hub: Firebase is
replaced by an in-memory stand-in seeded with the built-in glossary
(`support/`), and the AI endpoints answer with fixed examples.

| Suite | What it covers |
|---|---|
| `events-login.mjs` | The events watcher's own login (`api/_service-login.js`), with a throwaway key; no browser |
| `push.mjs` | Notifications (`api/push.js`, `_push-team.js`, `_webpush.js`), Firestore and the push services faked: the sealed message opens on a receiver written from RFC 8291, the VAPID signature verifies, who hears about a chat message (channels, @mentions, never the sender), once per message, owner-only sends, gone phones removed; no browser |
| `notifications-screen.cjs` | More → Notifications: iPhone in Safari told to add the Hub to the Home Screen, off / blocked / on, the switches, owners' Send to the team (the request, the phones reached), members never see it, From the team, `?open=chat` from a tapped notification |
| `api-helper.mjs` | The one Claude helper (`api/_routine.js`) with the Messages API faked: Term lookup, Ask the Hub and Doctor Prep end to end (the request sent, the beta, the web search tool, the answer filtered), the retries without the beta and without a schema (Doctor Prep keeping its effort), a refusal, a cut-off answer, a failed web search, the door, and the routine backup (Haiku first, the backup after); no browser |
| `daily-drill.cjs` | Daily Drill: the three rounds at every level, the trap, compare, the clock, your place kept, score, level up/down, Home card |
| `guide.cjs` | User Guide: search, answers, steps, Show me, deep links |
| `destination-labels.cjs` | Doctor Prep and Doctors entrances, Provider Pictures labels, route and scroll restoration, glossary state, separate appointment briefing, guide targets |
| `doctor-page.cjs` | The doctor list (cards, labels, + Prep terms, + Add, things to tidy, Delete in the sheet) and the doctor's page: header, bento, tier tabs, terms read aloud, 44px targets, the glass bar's three buttons, Team tips (add, edit, delete your own, a stale save keeps everyone's), Back, dark mode |
| `journey.cjs` | End to end: Ask the Hub, briefing, Term Review, offline and storage-refused cases |
| `smiley-gaze.cjs` | Dr. Smiley's eyes, lean and moods |
| `smiley-brows.cjs` | Dr. Smiley's brows: follow the face, held poses, Focused, Still |
| `smiley-gestures.cjs` | Dr. Smiley's five performances, frame by frame |
| `body-rig.cjs` | Dr. Smiley full-length (`drsmiley/body.js`, the viewer `drsmiley/body.html`): at rest the pieces compose back into Jose's picture; every performance stays inside the joints' limits, moves only transforms and ends at rest; the drawn poses (wave, two fists, the finger on the chin, the palms, the thumbs-up, the clipboard, the crouch and the jump) take over at the top of their gestures and hide the cutout arm or legs, and are hidden again at rest; a gesture cut short by another hands its drawn pose back at once; the five held states (listening, thinking, answering, celebrating, uncertain) hold without a gap inside the limits, end at rest on Off, carry on after a gesture, Focused smaller, Still one pose; the doze sleeps on the sleep frame; rest life has levels (none plays nothing); Focused smaller; Still and reduced motion one held pose; the walk carries him sideways; the viewer fits a phone; nothing in the app links to it yet |
| `smiley-squash.cjs` | Dr. Smiley's squash and stretch: cheer and greet only, at most 4%, volume kept, never on what holds him, back to his drawn shape (also when interrupted), none in Focused, Still or where the picture itself leans |
| `home-rest.cjs` | Home decor: petals (Chromium: one canvas per place from a worker; iPhone Safari: the old animated elements, no will-change; both keep falling, stop when scrolled away, rest under reduced motion) and heartline loop; the badge loop ends; the card ring glows on arrival only |
| `dock-tuck.cjs` | Tab bar tuck and open: only transform and opacity move, the bar's own size never animates, nothing left behind, tucked sizes as before (Dr. Smiley's disc and tag included), turns around mid-move without a jump, instant under reduced motion. Also runs in WebKit in CI |
| `springs.cjs` | S5: plain taps settle on the bounce-0 spring (`--spring0`), measured frame by frame on the tab bar's icon and lens and the Home section panel; the stylesheets read for any overshooting easing outside the kept list (F2's Practice buttons, Dr. Smiley's acting) |
| `campus-life.cjs` | Campus life round 2: the ambulance bay's doors on the ambulance's clock, the lot car backing out and driving off in its second look, the bench sitters' head turns, the flock, everything paused off screen, reduced motion |
| `campus-depth.cjs` | The campus's three depth pictures (sky, far town, campus): order, cover at the widest slide, scroll and drag slide the back ones and spring home, a drag never picks a building, reduced motion still |
| `glossary-cv.cjs` | Glossary taps (S4), on 150-term domains: a fresh domain skips off-screen cards' layout; every box on screen sits where it would with all laid out; a redraw while scrolled, Back and a jump to one term land on the same card |
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
- `tools/first-paint.cjs`: a visit's first paint over a slowed network (`ROOTS=before,after`): each folder served by a local server the way Vercel does (brotli, ETag), Chromium's throttling for weak Wi-Fi and 4G, CPU 4x; first visit and return, medians. Made for phase 1 of the split (`docs/split-index.md`).
- `tools/census.cjs`: the map of `index.html`'s script for the split (`docs/split-index.md`): every top-level name, its section, and which sections use which. `--names`, `--section <title>`, `--json`, `--write` (refreshes the table in the split plan). No browser; under a second.
- `tools/doctor-replay.cjs`: replays a `doctors.json` export through the doctor page and reports anything lost.
