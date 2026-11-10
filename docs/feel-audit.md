# Feel audit: the Hub as a premium app

Jose, 2026-11-04: "When the app is opened, the app glitches. Dr. Smiley
sometimes stutters, and moving the app sometimes seems off. Assess the app
so it feels like a professionally made, premium app."

This is the plan. Each phase is one pull request. Numbers before
anything is called fixed; the look never changes without Jose seeing it
first (the standing rule: speed never costs the look).

## What "premium" means here, in numbers

Taken from the two sources the app already measures by, plus Google's
page-feel limits. Chromium in the lab is a stand-in; Jose's iPhone and its
smoothness meter (More, bottom) are the judge.

| Feel | Measure | Target | Source |
|---|---|---|---|
| Nothing jumps or restarts on open | The app paints once and stays; no reload, no second hello; layout shift (CLS) under 0.1 | 0 reloads, CLS < 0.1 | web.dev/cls |
| Smooth at rest and while he moves | Hitch time (ms of late frames per second) on Home at rest and during a performance | under 5 (good); 5-10 noticed; 10+ distracting | Apple WWDC20 10077, `docs/features/frame-meter.md` |
| His face keeps time | Each face frame lands within one screen frame of its schedule | 95% within 17 ms, none over 50 ms late | this audit's probe |
| A tap answers at once | Finger lifts to the first visible change (INP) | under 100 ms felt; 200 ms is Google's limit | web.dev/inp |
| Scrolling stays smooth | Hitch time while scrolling Home and a 150-term domain | under 10 | same as above |
| Nothing arrives late and swaps | Elements that change after the first paint on open | named, each one agreed or removed | this audit |

## What the code already says (leads, strongest first)

Read on 2026-11-04 before any measurement. Leads, not findings, until
phase 0 measures them.

1. **The app reloads itself on the first open after every deploy.**
   `index.html` registers `sw.js` on `load` and calls `reg.update()`; the
   version line changes on every deploy, so a new worker installs,
   takes over at once (`skipWaiting` + `clients.claim`) and the page
   answers `controllerchange` with `location.reload()`. Home paints, the
   hello starts, then seconds later the page reloads and the hello
   starts again. There is no memory of the hello across the reload. Jose
   deploys several times a day, so most "first opens" are this. This is
   deterministic from the code; the reload was written for a page served
   from the cache, but the page and its code are network-first, so on a
   normal open the page already runs the new code and the reload is
   wasted.
2. **The first ten seconds do everything at once.** On open, all of
   these run together: the hello (a page frame loop for 9.4 s that draws
   the sparkle canvas and seeks several Web Animations by hand every
   frame), the name pen (two rect reads per frame), the glossary's first
   snapshot (about 1,700 documents parsed, then a Home repaint that swaps
   his outfit and the activity feed after the first paint), the pin
   observer re-applying pins after every insert (the greeting word swap
   every 2.8 s included), and, after a deploy, the new worker precaching
   96 files (3.3 MB) over hospital Wi-Fi. Facts in `docs/FACTS.md`: a page
   frame loop makes Chrome produce a whole Home frame every vsync.
3. **Dr. Smiley's face frames are timer chains, not clock-driven.**
   `DrAnim.play` steps frames with `setTimeout` at 38 ms
   (`DR_STEP`); a late timer delays the frame and every frame after it,
   nothing catches up. Any stall in lead 2 lands on his face. The head
   (Web Animations) and brows (CSS transitions) are clock-driven and
   should stay smooth through the same stall; if Jose sees the face
   stutter while the head glides, this is why.
4. **Scrolling and screen changes carry a lot of glass.** `app.css` has
   34 `backdrop-filter`s, 76 `filter`s, 100 keyframe sets;
   `home-polish.css` 8, 31 and 21 more. The bold look (Nov 3-4: colour
   washed cards, big tilted pins, a glass search, a colour hero) landed
   in the last two days and has not been measured for scroll cost.
   Scrolling Home read 64 ms/s on the meter on 2026-10-26 (Jose then:
   "feels fine"); a new complaint after new paint is a regression until
   measured otherwise.
5. **Known, left to Jose:** his rank outfit and the feed arrive after the
   first paint on every open (`docs/FACTS.md`, "Startup repaints").
   A premium open shows the right thing the first time; caching both is
   the fix, and it changes the first frame, so it is his call.

Where Jose's framing may be wrong: "the animation stutters" reads like an
animation bug, but leads 1-3 say the animation is the victim of what
runs around it. Fixing frames (lead 3) without the reload (lead 1) and the
crowd (lead 2) would move the stutter, not remove it.

## Phases

### Phase 0: reproduce and measure (no app code changes)

Output: a findings table in this file, numbers per lead, and a decision
with Jose on the order of the fixes. Nothing is "found" without a number.

Lab (`tests/`, headless Chromium, iPhone size, CPU slowed 4x, interleaved
runs, medians; the pre-bold-look commit fetched as the before copy):

- **The deploy open**, new script `tests/tools/deploy-open.cjs`: serve the
  checkout with the worker allowed, open once, change the worker's
  version line, open again, and record every navigation, the hello's
  start times and when the precache runs. Proves or disproves lead 1 and
  measures what the precache costs the open.
- **The opening, task by task**: `tools/startup.cjs` (first visit and
  returning) for each long task's pieces; `tools/perf.cjs` for idle busy,
  first paint, layout shift and animations that are not transform or
  opacity.
- **His face on a clock**, new probe `tests/tools/face-timing.cjs`: wrap
  `DrAnim.set` with timestamps while `greet`, `think`, `cheer`, `bounce`
  and his idle run on Home during the opening and again at rest; report
  the lateness of every frame (median, 95th, worst), with and without the
  opening's crowd. Proves or disproves lead 3 and sizes it.
- **Scrolling and screen changes**: `tools/scroll.cjs` and
  `tools/screen-trace.cjs` on Home, a 150-term domain, the doctor list
  and the doctor page, before and after the bold look; count composited
  layers and `backdrop-filter` elements on screen per screen.
- **Taps**: `tools/tap-hold.cjs` on the Home cards, a domain tile, the tab
  bar, Dr. Smiley's dock button.

Jose's phone (the judge; Low Power Mode off, Reduce Motion off, Lively):
the meter's **Copy numbers** pasted into the chat for four runs: open
right after a deploy, open with nothing deployed, Home left alone 30 s,
one slow scroll down Home and back. Plus which iPhone and iOS version.

### Phase 1: no reload on open (done 2026-11-04, `claude/feel-no-reload`)

The page reloads only when it is older than the worker that just took
control: on `controllerchange` it asks the worker its build (`sw.js`
answers `version?` with `CACHE_VERSION`, which ends in the `BUILD_ID` it
was deployed with) and reloads once if its own `BUILD_ID` is another one,
which is only a page served from the saved copy (offline, or the network
taking over 3 s). A page fetched fresh is left alone. Measured with
`deploy-open.cjs`, before and after:

| Open | Before | After |
|---|---|---|
| After a deploy | 2 documents, 9 Home paints, the hello twice (2.7 s and 7.1 s) | 1 document, 4 Home paints, the hello once (2.4 s) |
| Nothing deployed | 1 document | 1 document |
| The very first visit | 2 documents, the hello only after the reload | 1 document, the hello at 2.2 s |
| A page older than the worker (new case) | | 2 documents, one reload, the hello once after it |

Guarded by the `deploy-open` suite (in `run.cjs`). The User Guide's "The
app looks out of date" answer still holds (the first open after an update
is a little slower: the new worker's precache) and needed no change. Jose
confirms on his phone after a deploy: the hello plays once.

### Phase 2: a quieter opening, same look (done 2026-11-04, `claude/feel-quiet-opening`)

Three changes, no visible one:

- `pin-icons.js`: the pin observer re-applies every pin only when something
  a pin lives on was inserted (a screen drawn, the tab bar rebuilt), not
  for the pen's sparks, a greeting word or a petal. Pins re-applied in the
  first 12 s: **39 before, 3 after** (the opening probe).
- `home-polish.js`: the pen reads where the name sits only when something
  could have moved it (a Home repaint, a resize) and every 250 ms as a
  fallback, not twice every frame. Its `tick` fell from 15-45 ms to
  2-30 ms a frame at 4x and `getBoundingClientRect` left the top of the
  profile.
- `index.html`: the app's own check for a newer worker runs 15 s after
  load, not at load. The browser still runs its own check on the way in,
  so after a deploy the precache can still land during the hello; this
  only removes the second, redundant check.

What did not move: the opening's run of long frames. `startup.cjs`,
returning, 3 runs: median worst task 353 ms before, 375 after; long tasks
115 before, 117 after (noise). From 4.4 to 7.8 s the frames are still
101-185 ms at 4x (about 25-45 ms on a phone, so dropped frames at 60 Hz),
and what is left in every one of them is the hello's own canvas `draw`
(8-37 ms, the sparkle-snap opening drawn every frame at 2x pixels), a
style recalc (8-28 ms) and paint. His face timers in the opening stayed
as late as before (67-81% a frame late in 2 runs, against 54-57%; the
run-to-run spread is that wide). So the pins and the pen were real costs
and are gone, but the hello's drawing is the frame's floor.

**Next, Jose's call (it can change what he sees):** the hello's canvas.
Options, cheapest look-safe first: (1) draw it from a worker on an
OffscreenCanvas like the petals (same pixels; WebKit crashed on that
once, so iPhones would keep today's path and only Chromium gains);
(2) draw only the frames where something changes (the opening's rays,
shards and sparkles are in motion every frame, so little gain);
(3) draw the opening at 1x instead of 2x pixels on phones (a visible
softening of the sparkles; he would see it first); (4) leave it: the hello
is the look (Jose, 2026-10-15). Phase 3 (his face on a clock) is
independent of this and comes next either way.

The User Guide needed no change (nothing visible changed).

### Phase 3: his face on a clock, same look (done 2026-11-04, `claude/feel-face-clock`)

In `DrAnim.play` (`features/smiley-engine.js`) each face frame is now due
at a fixed time from the performance's start: the next timer is set for
the next due time, not for "38 ms from whenever this one fired", and a
stall swallows the frames whose time has passed (never the last one)
instead of stretching everything after it. The timers are as late as
before (the main thread is what it is), but the beat holds:

| Measure (iPhone paths, 4x, 2 runs each) | Before | After |
|---|---|---|
| How late a performance's last frame lands (`face-timing.cjs`) | 61-434 ms, the lateness of every timer added up (cheer 434 and 252, bounce 199 and 195, wink 200 and 88) | within one late frame: median 0-16 ms, worst 1-72 ms from its due time, per frame |
| Frames shown a screen frame late, performances at rest | 20-60% | 0-56% (the same, by design: a late frame is late, the ones after it are not) |
| Suites | | `smiley-gestures` 114, `smiley-brows` 23, `smiley-squash` 18, `smiley-gaze` 14, `smiley-quiz` 19, all passed: frame by frame the sequences read the same |

In the lab the cheer used to end a third of a second late at 4x; now
its end lands where its clock says. What a stall still does is drop
the in-between frame it swallowed, which nothing painted anyway.
`docs/features/dr-smiley.md` says the rule. The User Guide needed no
change (nothing visible changed).

### Phase 4: scrolling and screens, same look (done 2026-11-04, #205, live b1104.1832)

Measured first (two new tools: `tests/tools/glass-count.cjs`, what each
screen carries, and `scroll.cjs` with `SCREEN=domain` for a 150-term
domain and `PROFILE=1` for who runs during a scroll), then one change,
no visible one.

**What the screens carry** (`glass-count.cjs`, iPhone paths, 4x, 6 s at
rest each): glass is never stacked. Home has 4 backdrop blurs on screen
(top bar, search, tab bar, the promo label), a domain 3, the doctor list
2, a doctor's page 5, More over Home 5; filters on screen 2-22 (Home's
are the 13 CSS petals, which the phone hands to Core Animation). Running
animations: Home 62 on the iPhone paths (the petals) against 8 on
Chromium's, and only 2 of them restyle on the main thread (the
heartline's 4.2 s draw, every few seconds); a domain, the doctor list and
page 2-5, none on the main thread. Compositor layers: Home 186, a domain
153, the doctor list 19, a doctor's page 16, More over Home 226. More's
sheet is glass over Home, so Home's decor is seen through it and keeps
running by design. Nothing here to cut without changing the look, so the
glass and the off-screen pauses planned for this phase were not done:
the numbers didn't ask for them.

**Scrolling a 150-term domain was the real cost**, not Home: hitch
416 ms/s against Home's 109 at 4x, 42% of frames dropped against 16%,
and 6.0 s of script in a 42 s scroll against 2.6 s, on both paths alike
(so not the petals). The profile named it: the dock companion
(`smileyRider`, `index.html`) ran `place()` in the frame callback on every
scroll, which searched the whole page for other Dr. Smiley faces
(`querySelectorAll` over 7,700 elements: 2.0 s of a 21 s scroll) and then
read their rects after his lean had written its angle in the same frame
(a forced layout every frame, 0.5 s). Home paid the same forced layout
through the hero photo's drift, which read `scrollY` in its frame
callback after that write (0.5 s of 33 s).

**The change** (same look): the faces are found once per `sync()` (a
screen drawn, a body class, a resize) and at most twice a second
otherwise; the scroll listener checks only what a scroll can change
(a face in or out of view) inside the scroll event, where the frame's
layout is still clean because his lean's listener has just paid for it,
and queues `place()` only when the answer changed. The hero's drift takes
the position read in the scroll event. Rule in
`docs/features/dr-smiley.md`: read in the event, write in the frame.

| `scroll.cjs`, iPhone paths, 4x, 3 runs, medians | Before | After (two rounds) |
|---|---|---|
| Domain (150 terms): script in the scroll | 5,970 ms | 2,401 / 2,685 ms |
| Domain: frames dropped | 41.6% | 31.0 / 32.2% |
| Domain: hitch (ms/s) | 416 | 310 / 322 |
| Domain: main-thread time, worst frame | 31.5 s, 133 ms | 26.0 / 27.6 s, 100 / 117 ms |
| Home: hitch, script | 109, 2,571 ms | 116, 2,064 ms (the same within noise) |

The runtime smoke (Home scrolled down and up, a domain, back to Home):
he hands over between the greeting and the dock as before, the drift
applies, no errors. What is left in the domain scroll is the browser's
own work drawing cards as they arrive (`content-visibility`) and his
lean's read, which in the lab pays the frame's style work for Chromium's
petals; on the phone those are composited, so that read's real cost is
Jose's meter's to say (his domain scroll numbers, still owed). Home's
scroll did not move: its lab cost is the petals' style, not script.

The User Guide needed no change (nothing visible changed).

### Phase 5: the finishing checklist and the guard

A pass over every screen for what premium apps get right and this one
may not: press feedback on every tappable thing, loading states that
never flash empty, nothing that jumps when data arrives, safe areas,
dark mode, the keyboard. Then a suite, `tests/suites/feel.cjs`, that
fails when any target above regresses (no reload on open, hitch time at
rest, face lateness, layout shift), so the next bold look can't quietly
undo this. Three pull requests: the measuring pass (no app change), the
fixes by group (same look where the pixels can stay, Jose's eyes first
where they can't), the guard.

Sources: Apple's Human Interface Guidelines, Loading ("Show something as
soon as possible... consider showing placeholder text, graphics, or
animations as content loads, replacing these elements as content
becomes available"; "Let people do other things in your app... while
they wait"), read 2026-11-04; the CLS and INP limits above.

#### Step 1, the measuring pass (done 2026-11-04, `claude/feel-finish`)

`tests/tools/finish-check.cjs`: 26 screens and sheets at iPhone size,
light and dark, six checks. What it measures and how is in its header;
the lab's limits are named with each finding.

| Check | Finding | Whose call |
|---|---|---|
| Press feedback | Of 16-21 tappable things per screen, about a third change nothing under a held touch or a forced `:active`: the top bar's five buttons (back, the brand, dark mode, the bell, the avatar) on every screen, the tab bar's buttons (the lens glides after the tap, the button itself never dips), the term cards' Hear and Look up pills, filter pills (False Friends' modes and chips, Ethics', Practice's tags, the `<summary>` notes), list actions (Alert me / Notify me, the ✕ delete, ✎, + Prep terms), the guide's tour, face and Show me buttons, Ask's "What I remember", Home's View all and feed rows, and in Team Chat the pinned bar, reactions, the quote, links and Add photos. About 30 classes in all. A doctor's page, the Add term sheet and `.btn` buttons everywhere pass (`.btn:active` dips 1px; cards and tiles lift through `LIFTS`). | Claude, step 2: one shared press rule for the lot (the `.btn` dip or the card lift), shown to Jose first |
| A flash of empty before the data | None. Term Review and the memory trainer show "Loading…" lines first (a loading state, right by Apple). Home's rank outfit and feed swap-in after the first paint stay as found in phase 0 (Jose's call, `docs/PLAN.md` Facts). | Jose (Home's two swaps) |
| Nothing jumps when data arrives | Layout shift 0 to 0.004 on every screen through its data arrival, except Team Chat: 0.059 (under the 0.1 limit), which is the chat screen replacing the app's top bar with its own, so `#app` moves 45 px, by design and after a tap (which the metric excludes on a phone). Training & Events reads the same 0.059 only when opened straight from chat (the bar coming back). | Nothing to do |
| The keyboard (lab only: the lab shrinks the layout viewport, an iPhone shrinks the visual one) | With the viewport cut to 420 px and a field focused, the tab bar steps aside everywhere (`kb-open`). The field stays visible on Team Chat, the glossary, search, Translate, the guide; it is below the fold on Ask the Hub (its composer at the bottom) and Team access (its name field). Whether an iPhone scrolls them into view is the phone's to say. | Jose: two phone screenshots (Ask with the keyboard up, Team access with the keyboard up) |
| Dark mode | Screenshots of all 26 in `tests/out/finish/`. Text contrast: the faint ink token (`--ink-faint`, #98A1B3 light, #707C93 dark) is used as a text colour 122 times (times, labels, eyebrows, counts, "yours", the build line) and reads 2.4-2.6:1 in the light theme and 3.78:1 in the dark one, against WCAG's 4.5:1 for text; the rest is single spots (Ethics' org tag 2.17:1, Doctor Directory's "+ Add" 2.92:1 dark, False Friends' "Changes care" badge 3.31:1 dark, Practice's "Dr. Smiley" label on his white bubble 2.6:1). Light surfaces left in dark mode: Practice's campus card and his speech bubble (daylight by design), one paragraph on Translate. | Jose: the token is his palette (`DESIGN.md`); #6B7489 would read 4.68:1 on paper and 4.33:1 on the page background. The spots are Claude's, step 2 |
| Safe areas (static: the lab can't draw the notch) | 26 fixed or sticky rules never mention the safe-area inset. The ones that sit on an edge: `.toast`, `.ask-jump`, `.appt-pill`, `.smiley-rider`, `.dock-smiley` (bottom), `.dl-letters`, `.dp-top`, `.domain-dock`, `.gd-searchbar`, `.success-burst` (top); the rest are full-screen layers. Several sit above the tab bar, which carries the inset; whether any lands under the home indicator or the notch is the phone's to say. | Jose: three phone screenshots (a doctor's page, the doctor list's A-Z strip, a toast) |

Not findings: the 3D Body reads empty because it is a frame; labels and
an SVG trend point were listed as tappable because they carry a click
handler, and need no press.

What step 2 will not do without Jose: change the faint ink token, Home's
two swaps, Practice's daylight card.

#### Step 2, the fixes by group (done 2026-11-04, #208, live b1104.2144)

Jose's call on the token (2026-11-04): darken it. Three groups, measured
with the same tool after:

- **Press feedback.** One shared rule beside `.tg-sync:active` in
  `app.css`: the top bar's five buttons, the cards' Hear and Look up
  pills, filter pills, list actions, the guide's buttons, Ask's chips,
  Team Chat's reactions and Add photos get the sync button's dip
  (`scale(.95)` and `brightness(.96)`); wide rows (a feed row, the pinned
  bar, a quote, a group heading, a `<summary>`) only darken; an inline
  link fades. Touch adds `.is-pressed` through `LIFTS` in `index.html`
  (`:hover` never fires there and `:active` comes after the tap delay).
  Left as they are, on purpose: the tab bar's buttons (the lens answers
  them, and their transforms are animated by `dockMorph`) and the Home
  badge (his face, pettable). After: of 16-21 tappable things per
  screen, 0-4 without feedback, all of them those two, labels, an SVG
  trend point and the guide's unclassed Show me button (was 7-12).
- **The faint ink.** `--ink-faint` #98A1B3 → #6B7489 (4.7:1 on paper,
  4.3 on the page background) and, dark, #707C93 → #8C97AD (5.4:1).
  `DESIGN.md` carries the values and the reason. Every small caption is
  one shade darker; the Updates list's times, measured in the
  screenshot, went from #98A1B3 to #6B7489 and nothing else on the
  screen moved.
- **The spots.** Practice's "Dr. Smiley" label on his white bubble
  (a literal, 4.7:1), Ethics' org tags and the False Friends risk badges
  lightened in dark mode, the doctor list's + Add in the dark theme's
  ink on its lighter navy (6.3:1), `--good` #2F7D5B → #2B7354 (5.0:1 on
  its soft tint; Events' source pills and the ethics "In practice" line
  read 4.45), the channel picker's "yours" in the soft ink.

**A dead press glow, found by the guard (step 3).** The term cards'
and doctor cards' press glow (`.card:active`, `.card.is-pressed`, in
`LIFTS` since the first press work) never showed: their entrance
animation (`cardIn`) was set to fill `both`, so its last frame's
`transform` was held for ever, and an animation's held value beats
every normal rule, the hover lift included. The fill is `backwards`
now (the last frame is the card's own rest state, so nothing moves at
rest). Rule in `DESIGN.md` and `CLAUDE.md`: an entrance never fills
forwards on an element with a press or hover rule.

After, light theme: no text under 4.5:1 on any of the 26 screens but
the generic `.tag` ("Principle", 2.5:1: the tag colour mixed 56% into
ink on its own tint; a look decision, left for Jose). Dark: one hair,
False Friends' mode button at 4.49:1 on a tint the tool reads
approximately. No runtime errors across the 26 screens, light and dark.
The User Guide needed no change (no new feature).

#### Step 3, the guard (done 2026-11-04, #209, live b1104.2150)

`tests/suites/feel.cjs`, in `run.cjs`, so GitHub runs it on every push.
One browser at iPhone size, no CPU throttling (the runners vary too
much for timed limits at 4x): no "nothing yet" line before the data and
layout shift under 0.1 on Home, a 150-term domain, the doctor list, a
doctor's page, Team Chat and Updates; ten controls answer a press
(`:active` forced through the protocol, then the `.is-pressed` class a
touch adds): the top bar's two buttons, a domain card on Home (the
family carries the glow), a quick tile, a primary button, a list ✕, a
card's pill, a term card, a filter pill, a doctor card; no text under
4.5:1 on the faint ink's screens; a 150-term domain's scroll searches
the page far less than once a frame and reads only a few rects; a
cheer at rest keeps its clock (every frame within 100 ms of its due
time at 1x; measured 0-2 ms); Home at rest under 120 ms/s of hitches at
1x (measured 0-56 here, so the limit is for a runaway loop, not noise; the phone's bar is 10, at 4x the lab reads 86-156).
The first open after a deploy keeps its own guard, `deploy-open.cjs`.
Run against `main` before step 2 it failed the press and contrast
checks, as it should; against step 2 it found the cards' dead glow
above.

## Not in this version

- No visual change without Jose seeing it first. Same look, cheaper.
- The campus in 3D and the two brains: their own pages, measured
  separately (`docs/mockups/cchi-city/real-map/README.md`).
- The AI endpoints' answer time (network, not feel).
- Replacing Home's decor or the hello: they are the look (Jose, 2026-10-15).
- A rewrite of `index.html`'s startup chain.

## Where this plan is weak

- Chromium is not Safari. The lab says what runs, the phone says what it
  costs. Every phase ends on his phone's numbers.
- The reload (lead 1) only hits the first open after a deploy. If Jose
  sees the glitch on every open, lead 2 is the one, and phase 2 moves up.
- "Stutter" may be two things: the face (lead 3) and the whole page
  (lead 2). The probe separates them; until it runs, both are open.

## Findings (phase 0)

Lab: headless Chromium, iPhone size, CPU slowed 4x, the suites' stand-ins,
this checkout at `ca37a5c` (main of 2026-11-04, b1104.0940). Chromium
stands in for Safari: what runs is real, what it costs on the phone is
Jose's meter's to say.

### Lead 1, confirmed: the first open after a deploy reloads itself

`tests/tools/deploy-open.cjs`, one browser profile, three opens:

| Open | Documents | Home paints | What the person sees |
|---|---|---|---|
| After a deploy | 2 | 9 | Home at 0.6 s, the hello starts at 2.7 s, **the page reloads itself at 3.6 s**, Home again at 4.2 s, the hello starts again at 7.1 s |
| Nothing deployed | 1 | 4 | Home at 0.5 s, the hello at 2.8 s |
| The very first visit | 2 | 3 | Reloads at 1.8 s, the hello only after that |

The server answered 310 requests for the open after a deploy against 85
for a normal one: the second page load plus the new worker's precache,
all during the hello. Cause, in `index.html` ("Install / offline
support"): `controllerchange` always reloads, and every deploy makes a
new worker that takes control at once. Phase 1 is this.

### Lead 2, confirmed: the hello's seconds are a traffic jam

`tests/tools/startup.cjs`, returning visit, iPhone paths, 3 runs:
median worst task 353 ms, 115 tasks over 50 ms in the first 12 s. The
run from 4.2 s to 7.0 s is 14 long tasks of 100-273 ms, back to back,
each one holding the same four things: the name pen's `tick`
(`home-polish.js`, two rect reads a frame: `getBoundingClientRect` is
the single biggest line of the whole opening, 1,027 ms in 12 s), the
hello's canvas `draw` (`drawImage` 543 ms), the pin re-apply
(`pin-icons.js:982`, 301 ms) and a style recalc. The pin re-apply runs
because the pen adds a spark element every 30 ms and the pin observer
re-applies every pin after any insert on the page. The dock companion's
`sync` (417 ms; `place`, `smileyInView` reading rects) wakes on every
body class or child change too. Dr. Smiley's `greet` is timed about
2.9 s after the hello starts, so it plays inside this run.

A normal open also paints Home four times in 2.5 s (the cached glossary,
then the categories, then the live terms, then the rank and the feed).
Each is a full Home rebuild.

`tests/tools/perf.cjs` on this checkout: idle Home 50% busy during the
hello, 30% settled; taps wait 71-103 ms before their handler, 192-296 ms
to paint; 19 animations that are not transform or opacity. The same on
the copy from before the bold look is still running (lead 4).

### Lead 3, confirmed: his face frames are late whenever the page is busy

`tests/tools/face-timing.cjs`, 2 runs per path. How late each face
timer fires against the 38 ms it asked for ("late" = more than one
screen frame, 17 ms):

| Window | iPhone paths (petals on the main thread in Chromium) | Chromium paths |
|---|---|---|
| The opening (0-14 s) | median 21 ms late, 54-57% late, 21-24% over 50 ms | 12-24% late, worst 48 ms |
| Home at rest | 38-51% late, worst 66 ms | 4-15% late, worst 44 ms |
| Performances at rest (greet, think, cheer, bounce, wince, ack, wink) | 10-54% late, worst 33-82 ms | 0-22% late, worst 38 ms |

The lateness follows the main thread's load: worst in the opening (lead
2), on the busy path, and in `think` and `wince`. The timer chain never
catches up, so a late frame shortens every beat after it; the head's
lean (a Web Animation) and the brows (CSS transitions) keep their clock
through the same stall, which is what a stutter of the face alone looks
like. Which of the two columns his phone is closer to, his meter says.

### Lead 4: the bold look did not make scrolling or taps worse in the lab

`tests/tools/scroll.cjs`, 3 runs each, this checkout against the copy
from before the bold look (`1ba16ff`, b1103.2008): hitch ratio 173-203
against 177-277, busy 74-76% against 78-80%, worst frame 133-150 ms
both. `tap-hold.cjs`: lift to paint 240-368 ms against 256-352. One
`perf.cjs` run each: idle settled 30% against 45%, taps 192-296 ms
against 208-376. Same within the noise of single runs; nothing to undo.
What scrolling does pay, on both copies: Dr. Smiley's lean on scroll
(`drSwayScroll`, `index.html`) is 3.1-3.4 s of the run's main-thread
time, seven times the next scroll listener. It reads the scroll position
on every scroll event, so it is billed the frame's layout (Facts in
`docs/PLAN.md`: the first read in a frame pays it); a lead for phase 4,
measured on the phone first.

### Still owed: Jose's phone

The meter's Copy numbers for four runs (an open right after a deploy, an
open with nothing new, Home left alone 30 s, one slow scroll of Home)
and which iPhone and iOS. They say which lab column his phone is in.

### What phase 0 decides

The order stands: phase 1 (the reload) is deterministic, small and hits
every first open after a deploy; phase 2 (the opening's jam: the pen's
rect reads and sparks, the pin re-apply, the four Home paints) is where
the stutter and the "off" feel of the opening come from; phase 3 (his
face on a clock) makes his beat hold through whatever is left.
