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
| `shards.mjs` | GitHub's shares of the suites (`run.cjs --shard=K/N`, `.github/workflows/tests.yml`): every file in `suites/` is in `run.cjs`'s list, and the shares the workflow asks for run each suite exactly once; no browser |
| `deploy-rule.mjs` | The deploy rule in `vercel.json`, run in a throwaway git repository: a bump commit deploys, anything else is skipped; the bump workflow's commit title matches; everything the bump skips stays out of the deployment; no browser |
| `push.mjs` | Notifications (`api/push.js`, `_push-team.js`, `_webpush.js`), Firestore and the push services faked: the sealed message opens on a receiver written from RFC 8291, the VAPID signature verifies, who hears about a chat message (channels, @mentions, never the sender), once per message, owner-only sends, gone phones removed; no browser |
| `notifications-screen.cjs` | More → Notifications: iPhone in Safari told to add the Hub to the Home Screen, off / blocked / on, the switches, owners' Send to the team (the request, the phones reached), members never see it, From the team, `?open=chat` from a tapped notification |
| `api-helper.mjs` | The one Claude helper (`api/_routine.js`) with the Messages API faked: Term lookup, Ask the Hub and Doctor Prep end to end (the request sent, the beta, the web search tool, the answer filtered), the retries without the beta and without a schema (Doctor Prep keeping its effort), a refusal, a cut-off answer, a failed web search, the door, and the routine backup (Haiku first, the backup after); no browser |
| `daily-drill.cjs` | Daily Drill: the three rounds at every level, the trap, compare, the clock, your place kept, score, level up/down, Home card |
| `guide.cjs` | User Guide: search, answers, steps, Show me, deep links |
| `destination-labels.cjs` | Doctor Prep and Doctors entrances, Provider Pictures labels, route and scroll restoration, glossary state, separate appointment briefing, guide targets |
| `doctor-page.cjs` | The doctor list (cards, labels, + Prep terms, + Add, things to tidy, Delete in the sheet) and the doctor's page: header, bento, tier tabs, terms read aloud, 44px targets, the glass bar's three buttons, Team tips (add, edit, delete your own, a stale save keeps everyone's), Back, dark mode |
| `doctor-list.cjs` | The doctor list's arrangement and Needs info (the count, the filter, what each card is missing, no "No floor yet"): Recent (newest first, namesakes told apart), Sort by Place / Specialty / A to Z kept per phone, specialty groups, last-name order, the letter strip's jump, headings as labels, the specialty's slash break, the one-line region question, 44px targets, dark mode |
| `journey.cjs` | End to end: Ask the Hub, briefing, Term Review, offline and storage-refused cases |
| `smiley-gaze.cjs` | Dr. Smiley's eyes, lean and moods |
| `smiley-brows.cjs` | Dr. Smiley's brows: follow the face, held poses, Focused, Still |
| `smiley-gestures.cjs` | Dr. Smiley's five performances, frame by frame |
| `smiley-squash.cjs` | Dr. Smiley's squash and stretch: cheer and greet only, at most 4%, volume kept, never on what holds him, back to his drawn shape (also when interrupted), none in Focused, Still or where the picture itself leans |
| `home-rest.cjs` | Home decor: petals (Chromium: one canvas per place from a worker; iPhone Safari: the old animated elements, no will-change; both keep falling, stop when scrolled away, rest under reduced motion) and heartline loop; the badge loop ends; the card ring glows on arrival only |
| `dock-tuck.cjs` | Tab bar tuck and open: only transform and opacity move, the bar's own size never animates, nothing left behind, tucked sizes as before (Dr. Smiley's disc and tag included), turns around mid-move without a jump, instant under reduced motion. Also runs in WebKit in CI |
| `springs.cjs` | S5: plain taps settle on the bounce-0 spring (`--spring0`), measured frame by frame on the tab bar's icon and lens and the Home section panel; the stylesheets read for any overshooting easing outside the kept list (F2's Practice buttons, Dr. Smiley's acting) |
| `type-tokens.cjs` | Type tidy (`DESIGN.md`, Type): every font size is one of the ten `--fs-*` steps (Apple's scale; display sizes of 36px and up excepted), every letter spacing in `app.css` and `home-polish.css` is a `--tr-*` token (or 0) and every weight 400, 500, 550 or 650; then eight screens, phone and desktop, measured so no Inter text renders at another weight (the browser's own bold included). The Home hello banner and serif/mono faces are kept outside the rule |
| `campus-life.cjs` | Campus life round 2: the ambulance bay's doors on the ambulance's clock, the lot car backing out and driving off in its second look, the bench sitters' head turns, the flock, everything paused off screen, reduced motion |
| `campus-depth.cjs` | The campus's three depth pictures (sky, far town, campus): order, cover at the widest slide, scroll and drag slide the back ones and spring home, a drag never picks a building, reduced motion still |
| `campus-alive.cjs` | The campus alive: the people about (two frames from one picture), a crane swinging on every building not yet fully painted and gone once it is, lit windows on the painted floors, the paint climbing a tenth at a time after practice with a flash at the top (and not again on the next drawing), reduced motion holding it all still |
| `sound-alikes.cjs` | Sound-Alikes: Home's rail and the tile, a speaker on every word and sentence (44px, its own tap), Spanish in es-US with a Latin American voice, filter and search, global search, the Drill heard with the words hidden, Show the words blanks the sound-alike, the other spelling counted as the lure, results |
| `load-order.cjs` | The gap between the `features/*.js` files and `index.html`'s own script, held open 1.5 s: a resize, a key and a message in it raise no page error, and the app comes up afterwards |
| `glossary-cv.cjs` | Glossary taps (S4), on 150-term domains: a fresh domain skips off-screen cards' layout; every box on screen sits where it would with all laid out; a redraw while scrolled, Back and a jump to one term land on the same card |
| `deploy-open.cjs` | The first open after a deploy (`docs/feel-audit.md`, phase 1): the offline worker allowed, the checkout served by a small local server; a first visit, an open after a deploy and an open with nothing new never reload and play the hello once; a page older than the worker that just took control reloads once, only once the app is in the background (2026-11-08) |
| `slow-open.cjs` | Opening on slow Wi-Fi (the server itself slowed, the offline worker allowed): past a second the saved copy opens with its own code, none from the server, Home within 3.2 s; after a deploy the saved version, no reload in use, one reload in the background and the new version; on a fast network the fresh page wins |
| `chat-titles.cjs` | Team Chat titles: Admin follows the owner-code phone (a typed name can't borrow it), Supervisor of Language Services by name and spellings, new messages carry the phone |
| `chat-faces.cjs` | Team Chat faces: a message from an email account shows that account's photo and colour under any name ("Jose V" = Jose Vazquez); a plain team phone or no phone keeps the exact-name match |
| `chat-keyboard.cjs` | Team Chat while typing on a phone: the screen pins to the part the keyboard leaves (a stand-in for `visualViewport`), the box right on the keyboard and the header at the top through a pan, a page scroll, a late keyboard height and a short screen; back in the page after; a computer unchanged |

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

GitHub runs the same thing on every pull request and every push to `main`
(`.github/workflows/tests.yml`), so a change from any tool gets a green
check or a red X once its pull request is open.

There the suites run as six even shares side by side, one machine each
(`node run.cjs --shard=2/6` is the second share; add `--list` to only name
its suites). `run.cjs` splits them by how long each took on GitHub
(`shard-times.json`; a suite not in it counts as a middling one, so a new
suite needs nothing but its line in `run.cjs`). One machine took about 40
minutes; refresh the seconds from a run's log if the shares drift apart. A
change that touches only `docs/`, `.claude/` and `*.md` files skips the
suites (none reads those files). "App checks result" is the one line that
says how the whole run went. Screenshots and logs are attached to the run
as `test-output-1` to `-6` and `test-output-webkit`.

`ROOT=/other/checkout node run.cjs` tests another copy of the app;
`INDEX=/path/to/index.html` serves a different `index.html` (before/after).

## Tools (run by hand, not part of `run.cjs`)

- `tools/perf.cjs`: smoothness numbers (idle busy %, tap waits, startup, layout shift, animations that aren't transform/opacity) at iPhone size with the CPU slowed 4x. The S-phases in `docs/PLAN.md` are judged by it.
- `tools/startup.cjs`: the app opening, task by task (S3): each long task's biggest pieces, the script lines that forced a layout, and the functions that took the time. `UA=chromium`, `RETURNING=1`, `RUNS=n`, `ROOT=` another checkout for before/after.
- `tools/idle.cjs`: Home left still (S7): the meter's numbers and longest stalls, and every main-thread task over 50 ms with what ran in it. `SCROLL=n` scrolls first, `START=s` waits after load, `UA=iphone`, `RUNS=n`, `INDEX=` another index.html.
- `tools/first-paint.cjs`: a visit's first paint over a slowed network (`ROOTS=before,after`): each folder served by a local server the way Vercel does (brotli, ETag), Chromium's throttling for weak Wi-Fi and 4G, CPU 4x; first visit and return, medians. Made for phase 1 of the split (`docs/split-index.md`).
- `tools/census.cjs`: the map of `index.html`'s script for the split (`docs/split-index.md`): every top-level name, its section, and which sections use which. `--names`, `--section <title>`, `--json`, `--write` (refreshes the table in the split plan). No browser; under a second.
- `tools/slow-open.cjs`: six opens on a slowed server (`DELAY`, `KBPS`, `RATE`, `SW=`, `ROOT=` another checkout for before/after): when the opening and Home show, documents, the page's build, the code files the server sent. The suite of the same name checks it.
- `tools/deploy-open.cjs`: four opens in one browser profile with the offline worker allowed (the checkout from a small local server): a first visit, an open after a deploy, nothing deployed, a page older than the worker; each one's paints, hello starts, the worker taking control, reloads and files served. The suite of the same name checks it.
- `tools/face-timing.cjs`: how late each of Dr. Smiley's face timers fires (`DrAnim.later`) in the opening, at rest and in each performance, with the long tasks around them. `UA=chromium`, `RUNS=n`.
- `tools/doctor-replay.cjs`: replays a `doctors.json` export through the doctor page and reports anything lost.
