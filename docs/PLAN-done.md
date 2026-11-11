# PLAN, done — every finished phase

Moved out of `docs/PLAN.md` on 2026-11-10 so a chat no longer loads it at
the start. Newest first. Look things up here (search for the phase's name
or its PR number); don't read it whole. A finished phase is added at the
top, under this note: the date, a few lines, the PR number.

- 2026-11-11 The rule files shortened (Jose: "Start a new chat to shorten CLAUDE.md and AGENTS.md"). `AGENTS.md` holds every shared
  rule once (30.6 KB before, 30.8 after: it took in what was only in `CLAUDE.md`); `CLAUDE.md` holds what is Claude's alone (34.5 KB to
  3.4); the handoff rules live only in `docs/PLAN.md`. Detail moved word for word to its notes, the dates and stories to `docs/FACTS.md`.
  A reviewer checked about 230 rules against the old files: 10 small clauses were missing and put back, 4 stale pointers fixed. Notes only.
- 2026-11-11 Why the WebKit check went red now and then (Jose's pick). Not a crash from memory: GitHub's WebKit (the Linux build) freezes
  about 1 open in 10 while Home's hello draws on its canvas, then kills the page about 27 s later (880 opens measured by
  `tests/tools/webkit-crash.cjs`, three rounds; `docs/FACTS.md`). Jose's iPhone: 0 freezes in 30 opens, so the hello is unchanged.
  `startup-work.cjs` now names a browser freeze and opens once more. The probe stays as a hand-started job. No app change.
- 2026-11-11 The cleanup audit, the first on record (`docs/cleanup-audit.md`; a report, nothing removed). `docs/CLEANUP.md` lists 20 items:
  unused script and styles, repeated code, one 520-line function, leftover files. `knip` and `depcheck` see nothing useful in an app with
  no import lines; the list comes from a script count of every name, checked by hand. Then, Jose's pick ("Clean up the low-risk ones"),
  items 1, 2, 3, 18 and 19 were removed: nine unused pieces of script, two unused settings, 214 lines of styles nothing draws, ten
  unused `export`s. Nothing visible changed, so the User Guide needed nothing.
- 2026-11-11 `AGENTS.md`'s four stale lines corrected with Jose's OK (accounts are optional since email sign-in; `index.html`'s
  real size; where the other screens' code lives; "Not building" confirmed). Notes only.
- 2026-11-10 The notes trim (#264; Jose: "critically analyze my CLAUDE.md and all the .md files, optimize them"). `docs/PLAN.md`
  116 KB to 13 KB (Done and Facts moved here and to `docs/FACTS.md`, word for word), `CLAUDE.md` 42 KB to 34 KB (repeats folded,
  design values and history to `DESIGN.md`). A separate reviewer found 13 dropped or changed clauses, all put back. What the sweep
  of the other notes found is in `docs/PLAN.md`, Later, "Notes that have drifted from the code". Notes only, no app change.
- 2026-11-10 Faster app checks on GitHub (Jose's pick; tooling only, no app change). One machine ran all the suites in
  37-42 min, for every change, a notes-only one included. Now: the suites run as six even shares side by side
  (`tests/run.cjs --shard=K/N`, split by each suite's seconds in `tests/shard-times.json`; `tests/suites/shards.mjs` fails
  if a suite is in no share), a change to nothing but `docs/`, `.claude/` and `*.md` skips them (no suite reads those;
  any doubt runs them), and "App checks result" says in one line how the run went (the job to name if `main` ever gets a
  "checks must pass" rule). Measured: 41 min 58 s before (#261), 7 min 58 s on #262 and 8 min 43 s on `main` after the merge (ac3671d), all green.
  Also: the WebKit job failed once on `main` (a0d66e0) on the same code that passed in #261, in `startup-work`'s "the name
  itself is shown", at 32 s, before the wait's own 40 s limit; the cause is not known (its saved output could not be
  downloaded from a cloud session), so that check now prints why its wait ended and what the page showed.
- 2026-11-08 The campus's leaves after Jose's iPhone screenshots (speckle, black specks, flat patches, square petals): readable leaves,
  no black fringes, light across each card, edge-on cards hidden, lumpy masses, real petal shapes. `real-map/README.md`, "The trees". Not
  measured on his iPhone when this was written.
- 2026-11-08 No white screen on slow Wi-Fi (Jose's screen recording: 3 s of plain white on every open; his pick "1 s wait,
  update next time"). `sw.js`: the app's page has 1 s to arrive whole (`PAGE_WAIT`), else the saved copy opens with its saved
  code (`fromSaved`) and nothing late is written back; `index.html`'s update check reloads an older page only once the app is in
  the background, never in use. Measured with `tests/tools/slow-open.cjs` (0.8 s to first byte, 1.5 Mbps, CPU 4x): slow, nothing
  new, the opening at 5.2 s -> 2.4 s, Home under it 4.6 s -> 1.8 s; slow after an update 4.9 s -> 2.1 s (the old version once);
  fast unchanged (Home 0.8 s). Guarded by the `slow-open` suite; `deploy-open`'s older page now reloads in the background.
  User Guide: "The app looks out of date" rewritten. Not measured on his iPhone yet. Also found in the recording, not fixed
  here: an apparent restart on CoreCHI Practice while the campus loads (likely memory), the tab bar over the opening for ~1 s,
  Team Chat's messages vanishing ~1.2 s when the box is tapped.
- 2026-11-07 The campus's trees after Jose's picture: a twisting trunk with roots, curved limbs, dense masses of detailed leaves, each
  tree in its own colours (every cherry pink, the Don Imus sakura too; the rest green; the back's red ones red), `real-map/README.md`,
  "The trees". 3D view only; the card keeps the old trees. Triangles +5%, the 3D page about 1.42 MB; not measured on his iPhone when
  this was written.
- 2026-11-07 The campus's benches from Meshy, rebuilt on boxes (Jose asked for trees and benches, then picked the bench only):
  `real-map/README.md`, "The Meshy bench". 3D view only; the card keeps the old bench.
  Jose on 2026-11-07: the 3D campus is smooth on his iPhone with the Meshy ambulance and helicopter (by feel, no fps number).
- 2026-11-07 The tab bar test steadied on WebKit (`tests/suites/dock-tuck.cjs`, the harness): Dr. Smiley measured with his
  scroll sway taken off (a 0.17 degree lean read him 0.3% big, #248's red run; the same numbers reproduced in Chromium),
  "still moving after 3 s" logged with what was moving, a page crash logged, and the first page opened again once if it
  died while loading (#245's red run). The old test did not fail in 24 WebKit runs on GitHub, the new one passed 24 of 24.
  Test only; no User Guide change.
- 2026-11-07 The campus's helicopter from Meshy, slimmed in Blender (Jose's pick after the ambulance): `real-map/README.md`,
  "The Meshy helicopter". 3D view and the card (its two frames only). Meshy's blades cut off, the app's rotor kept. Triangles
  +1.3-1.5%, 3D page 820 KB to 1.05 MB. `ambulance_bake.cjs` is now `meshy_bake.cjs`, for every Meshy model.
- 2026-11-07 The tab bar, slim when you scroll (`docs/features/tab-bar.md`,
  PR #240, live b1107.0125; Jose's pick B of four mockups). Scrolling down
  makes it 46 px with icons only, every tab still one tap (was a 142 px
  capsule, two taps). Only on a real scroll (60 px down, 30 up); the 4 s
  idle timer is gone; full at the top and bottom of a page, no flicker
  from the bounce. Facts: mobile WebKit has no mouse wheel and CI's WebKit
  delivers scroll events late, so `dock-tuck.cjs` scrolls with
  `scrollBy` and waits for each event. Team Chat measured its box during
  the screen's slide-in (6 px short of the bar), hidden until now by the
  timer's refit; `fitChatPanel` fits again when that ends. The full test
  run takes 37-41 min on GitHub, so its cap is 55 min (was 40).
- 2026-11-06 The campus's ambulance from Meshy, slimmed in Blender (Jose: use Blender and the Meshy API to make the campus
  better; his pick, one ambulance as a test, then "Yes, add it"): `real-map/README.md`, "The Meshy ambulance";
  `docs/features/practice-dashboard.md`. 3D view and the card (only its four ambulance frames re-rendered, in Blender 5.2; the other `city/` files are unchanged). Traffic check 120 s all zero. Triangles +1.2-1.7%, 3D page 553 to 820 KB. The rest of the
  list (fountain, helicopter, benches, trees; buildings detailed in Blender) waits on how it does on his iPhone.

- 2026-11-06 More, grouped (`docs/features/more-sheet.md`, PR #236, live
  b1106.2156): Ask the Hub, then Study, Doctors, Reference and You; the
  domains behind one row; Translate and Team Chat out (tabs); counts only
  when they need you (`reviewedDueCount`, `eventsNewCount`); Your account,
  Opening and the smoothness meter in their own sheet over More (‹ More).
  54 rows and 3,837 px became 25 rows and 1,615 px. Home's sections renamed
  Study and Reference. `tests/suites/more-sheet.cjs` fails when a tool in
  `getToolTiles()` has no place in `MORE_GROUPS` or `MORE_ELSEWHERE`. Next if
  they drift: Home's sections and the sidebar read `MORE_GROUPS` too.

- 2026-11-05 The opening's light by time of day (Jose's pick of four ways
  to raise it): morning gold, midday, evening blue, by the phone's clock;
  the badge in the same light. `docs/features/opening.md`. Facts: a hue
  shift on the badge turns Dr. Smiley blue, so the evening badge gets a
  multiply wash instead; Playwright's `clock.setFixedTime` (harness
  `clock`) sets the hour for a suite.

- 2026-11-05 The opening, Badge in (`docs/features/opening.md`): every
  start on a phone, your badge on its lanyard over the pavilion, tap, scan,
  green, "Welcome in", the ring opens onto the live Home. `features/opening.js`,
  "Opening" block in `app.css`, the pavilion as an 8 s loop in `opening/`
  (0.7 MB MP4, 0.25 MB WebM, rendered once from the mockup), More's Opening
  card, `tests/suites/opening.cjs`. Facts: a script before `<head>` sees a
  980 px page on a phone (no viewport yet), so "phone" is the screen's
  shortest side under 600; iPhones fetch video in Range pieces, so `sw.js`
  cuts them from the saved clip and carries it over between versions.

- 2026-11-05 A domain's name never breaks inside a word on its banner
  ("Hematolog / y" on a phone). `fitDomainBannerName` in `index.html`
  measures the longest word in place and steps the banner down (is-long,
  then is-longer) until it fits; on a wider screen it steps back up.
  `glossary-hero.cjs` now checks every domain and subgroup.

- 2026-11-05 Idea credits on glossary domains and subgroups (Jose: "also
  give credit to medical terminology domains"). Double-tap the name on
  the colour banner; the tag sits under "N terms"; keyed by the
  domain's id so a rename keeps it; wording for a list of terms ("Terms
  by Ana", "Reviewed by Ana"), and a fifth choice for domains, "Suggested
  it" ("Created at Sylvia's suggestion"; its role needs the rules pasted
  again). `docs/features/credits.md`.

- 2026-11-05 Idea credits (Jose: "Sylvia came up with the idea of
  Sound-Alikes"). Four mockups; Jose picked "line + card". A credited
  screen shows a small purple tag under its title; a tap on it or a
  double-tap on the title opens the card; an owner's double-tap on any
  title gives a credit (Edit, Remove). `features/credits.js`,
  `hub-credits` (new rules: Jose pastes `firestore.rules` into the
  console), `tests/suites/credits.cjs`, guide answer `credits` and a New
  lately card. `docs/features/credits.md`.

- 2026-11-03 Type sizes onto the scale (Jose's picks: 14px to 15, tiny
  text up to 11). Every stylesheet font size is now one of ten `--fs-*`
  steps, Apple's iPhone scale: the old seven plus `--fs-cap2` 11,
  `--fs-call` 16, `--fs-large` 34 (display sizes of 36px and up, and the
  Home hello banner, left as they were). 315 sizes moved (14 to 15 x108,
  12.5 to 13 x43, 11.5 to 12 x38, under 11 to 11 x55, the rest by the
  nearest step, ties upward), 482 already exact became tokens.
  `--fs-footnote` (didn't exist, a second one) fixed. Letter spacing
  re-matched to the new sizes (5 rules); `--tr-xs` gone (nothing under 11
  any more). Guard extended in `type-tokens.cjs`. Measured on 17 screens
  at 360, 393 and 1440px: no clipped text, no sideways scroll, no new
  input under 16px; the one newly "covered" button per narrow screen is a
  row now sitting behind the floating tab bar at rest (scrolls into view).
  No guide change. PR #185.

- 2026-11-03 Doctor list D5, Needs info (Jose's pick): "No floor yet" gone
  from cards; "N need info" counts doctors missing a place, floor or prep
  terms (not photos); tapped, only them, each card saying what's missing.
  Guide: new answer `doctorgaps` and a New lately card (Sound-Alikes card
  dropped), the directory answer's floor line. `doctor-page.md` "Needs
  info"; checks in `doctor-list.cjs` (66).

- 2026-11-03 Doctor list D4, arrangement (Jose's pick from the directory
  review, "Trim + Recent + Sort"): Recent (last 5 opened, per phone), Sort
  by Place / Specialty / A to Z by last name (per phone), a letter strip in
  long A to Z lists, Collapse all on the Sort row, group headings as labels
  instead of cards, the region question in one line, the specialty broken
  at its slash ("Oncolo / gy" fixed). Measured at 393x759, 26 doctors,
  region not picked, Recent full: first card 530px (was 552px with no
  Recent); the strip itself is the fast path. Guide: the Doctor Directory
  answer and its steps rewritten, a New lately card (Campus card dropped).
  `doctor-page.md` "Arrangement"; checks `tests/suites/doctor-list.cjs`.
- 2026-11-03 Type tidy + `DESIGN.md` (Jose's pick, after reading a
  Cloudflare-style DESIGN.md he found: its type discipline, not its look).
  Letter spacing from seven `--tr-*` tokens by size band (was 37 values),
  Inter weights 400/500/550/650 (was 9: 600 to 650, 700-900 to 650, 450 to
  500; `b`/`strong`/bare headings 650), `--fs-subhead` (doesn't exist) fixed
  to `--fs-sub`. Guard: `tests/suites/type-tokens.cjs`. `DESIGN.md` at the
  root, pointed to from `AGENTS.md` and `CLAUDE.md`. Measured: 766 of 6,252
  text pieces changed weight, 544 spacing (median .015em); 0.1-3% of pixels
  per screen. No guide change: nothing new to learn. PR #179.

- 2026-11-03 New pins, Soft studio 3D (Jose's pick "02" from his own
  example sheets, checked on the real Home first): all 41 `pins/*.webp`
  replaced, same names and size (192 px), cut from four sheets Jose made
  with his image tool (`docs/art/pin-prompts-soft-3d.md`, sources and
  `cutsheet.py` in `docs/art/pin-sheets/`). Guide answer `pins` and a New
  lately card (#178, live b1103.1233). Round 2 the same day: the 32 icons
  still cut from `pin-icons-sheet.webp` (DOMAIN_ICONS, tab bar, side menu,
  quick cards) now name files in `pins/`: 18 reuse round 1's pins, 16 new
  from sheet 5 (home, search, more, all-tools, procedures, tips, templates,
  contacts, favorites, self-care, locations, infection-control, globe,
  notes, education, trash); Recently deleted gets `TRASH_PIN`; the old
  sheet is no longer drawn or precached. Still open: OB/GYN shows the
  cardiology heart (asked Jose whether that's meant).

- 2026-10-29 Sound-Alikes, first version (Jose approved the plan in the
  chat "Nesting feature application"): `soundalikes/list.js` (45 sets),
  `features/sound-alikes.js` (Study with a speaker on every word, Drill
  heard not read), tile, Home rail, global search, guide answer and New
  lately card, `tests/suites/sound-alikes.cjs`. Waiting on Jose to check
  the Spanish (`esChecked`). Spec: `docs/features/sound-alikes.md`.
  Then dressed like CoreCHI Practice (Jose: "make it similar to the cchi
  section", look only, no progress kept): the blue card with Drill by ear /
  Study the list, the groups as its domain rows with List and Practise, its
  quiz header and Exit.
- 2026-10-26 `api/term-check.js` uses `_routine.js`'s `clip` (same trim and
  600-character cut); its own copy and `MAX_FIELD` are gone.
- 2026-10-26 The campus, alive (Jose: "how can we make it more alive";
  he picked all four): lamps, headlights and bloom back; warm lit windows
  on the painted floors (`<key>-glow1..10`, flickering); a crane on each
  roof until the building is fully painted, swinging; the people about as
  two-frame sprites (one picture for all of them, one for the cranes);
  the paint climbing a tenth at a time after practice, with a flash
  (`ih_campusLv`). New suite `campus-alive.cjs`. Guide answer updated.
  Then from Jose's Google Maps screenshots: the HMH tower red brick, the
  right of the drive one big dark stepped building (Culture). Built on
  #157. Not measured yet: smoothness on an iPhone with this much
  moving (the smoothness meter in More can tell).

- 2026-10-26 The campus as a floating diorama (Jose's video, "in this
  style"; his picks: busier, paint for progress, corner view). New source
  `docs/mockups/cchi-city/diorama.html` + `builddiorama.cjs`; `city/`
  re-rendered (lit layers gone, `-paint1..10` per building); card restyled
  light; badges in three hand-set rows, Dr. Smiley steps right when needed,
  tap areas back to front. Guide: the CoreCHI answer rewritten, a New
  lately card (replaces the film's). Suites: campus-pick, -life (the lot
  car's last stretch threshold for the new angle), -depth; full run.
  Then, on Jose's "looks flat" and "I like the original colors more":
  the live campus's colours and golden-hour light on the new board,
  evening card kept, unstudied buildings faded (not white). Note: `docs/features/practice-dashboard.md`.

- 2026-10-26 S9 Home taps, part 2: **closed, no app change** (Jose's pick
  after the findings). Taps meet the wait target on his phone; what's left
  of a screen change's hiccup is drawing the new screen itself. Tool:
  `tests/tools/screen-trace.cjs`. Findings and the rejected fixes:
  **Jose's run, 2026-10-26** (b1026.1522, iPhone iOS 18.7, 60 Hz, 80 s,
  one run): taps wait 20 ms middle / 51 slowest (target < 20: met),
  drawn 81 ms middle / 125 slowest. Every stall over 100 ms came within a
  second of a tap, as the new screen was drawn (Home and domains 117-177
  ms, 3D Body 256 ms with nothing named, likely the atlas frame), named
  "render, pins". Scrolling Home 64 ms/s, unchanged (62-78 before).
  **Lab split** (`tests/tools/screen-trace.cjs`, 4x, Home -> domain and
  its Back; 700 ms after the lift, medians): pins ~8 ms (2%, it only runs
  in the same frame); the click's JS ~100-150; style 105-170 (the biggest
  piece: a whole new screen styled against ~470 KB of CSS); paint +
  layerize ~110-190; layout ~55. Tried and **rejected**, with numbers:
  (1) top bar height cached instead of read in every render: worse
  (Back's second task 117 -> 190 ms, domain's 51 -> 80, 5 runs each;
  the early read apparently splits the style work well); (2) fitWave's
  two refits skipped when fonts are in, and heroPetals' second read:
  no change measured; (3) pins without `will-change` (172 -> 131
  layers on Home): within noise; (4) `content-visibility:auto` on Home's
  sections: worse (Back's style 170 -> 224). Back to a scrolled Home also
  opens the tab bar then tucks it again at once (dockAfterRender, then
  the restore's scroll event): two morphs, ~20 ms at 4x; fixing it
  changes whether the bar ends open, so it needs Jose. **Selectors are
  not it** (Chromium selector stats, both taps): matching is ~14 ms of
  ~300 ms of style passes (~5%), spread over 1,364 selectors, none over
  0.5 ms. The style pass is simply the new screen: ~700 elements for Home
  (the phone's hidden sidebar is display:none, so it costs ~nothing),
  then small per-frame passes from the animations; no pass restyles the
  page for a small change. What's left would be structural: drawing
  Home's lower sections a frame later (risk: Back's scroll restore needs
  their real height).
- 2026-10-25 Split `index.html`, phase 3, the terminology backfill
  (#152, live b1025.1713):
  `features/backfill.js`, declarations only. Proof: byte rebuild; which
  doctors need it, the banner, a run that fails (no answer) and one that
  works (both doctors saved with tiers, then "up to date"), globals
  identical. No suite covers it; the probe did.
- 2026-10-25 Split `index.html`, phase 3, duplicate doctors
  (#150, live b1025.1607):
  `features/duplicate-doctors.js`, declarations only. Proof: byte rebuild;
  name parsing, the groups, the banner, a merge and its result identical
  (a new random tip id aside); doctor-page.cjs on both.
- 2026-10-25 Split `index.html`, phase 3, CSV export / import
  (#148, live b1025.1453):
  `features/csv.js`, declarations only. Proof: byte rebuild; the export
  file, parsing, an import's preview (1 new, 1 updated), the saved term and
  globals identical. No suite covers CSV; the probe did.
- 2026-10-25 Split `index.html`, phase 3, the doctor sheets
  (#147, live b1025.1140):
  `features/doctor-sheets.js` (the place picker, the doctor's add and edit
  sheet), declarations only. Proof: byte rebuild; add sheet, picker, add a
  place, pick, save, edit sheet, globals identical; provider-where.cjs and
  doctor-page.cjs on both.
- 2026-10-24 Split `index.html`, phase 3, the guide's front page
  (#145, live b1025.0157): `features/guide-front.js`, declarations only. Proof: byte rebuild; the
  front page, searches, sections, install steps, globals identical;
  guide.cjs on both.
- 2026-10-24 Split `index.html`, phase 3, your knowledge brain's Hub side
  (#143, live b1024.2150): `features/knowledge-brain.js`, declarations only. Proof: byte
  rebuild; its data, the small brain, globals and humc-brain's
  knowledge-brain checks identical before and after.
- 2026-10-24 Split `index.html`, phase 3, False Friends' screen (#141, live b1024.1920):
  `features/false-friends.js`, declarations only. Its section also held
  the Practice screen with no banner between; that half stays inline
  under a new banner. Proof: byte rebuild; Study, Drill, an answer, the
  Practice screen and globals identical in the browser.
- 2026-10-24 The 3D Body's resize listener (`features/3d-body.js`, since
  #127) read `activeCategory` before `index.html`'s script declared it
  when the window resized during load: "activeCategory is not defined", a
  console error that failed daily-drill, smiley-quiz and springs now and
  then (#140, live b1024.1804). Guarded with `typeof`; new suite `load-order.cjs` holds
  the gap between the `features/` files and `index.html`'s script open
  and resizes, presses a key and posts a message in it (fails on the old
  code, passes on the new).
- 2026-10-24 Split `index.html`, phase 3, the campus (#139, live b1024.1553):
  `features/campus.js`, verbatim, its Escape listener included (the
  earlier keydown listeners neither stop the event nor touch the campus).
  `campusLife`/`campusDepth` stay inline. Proof: old `index.html` rebuilt
  byte for byte; campus markup, tables, a pick then Escape, globals:
  identical in the browser; first paint the same (slow Wi-Fi +0.02 s,
  Home the same or sooner). `docs/split-index.md`.
- 2026-10-24 Split `index.html`, phase 3, Dr. Smiley's performances (#137,
  live b1024.1338): `features/smiley-performances.js`, verbatim, except the one line
  that fills `DR_FACE_SEQ` (it stays in `index.html`; Jose's pick, the
  table is defined earlier there). Proof: old `index.html` rebuilt byte
  for byte; every performance built with three seeds, the table, globals
  identical in the browser, phone and computer. Plan tidy (#134) merged;
  Voice and mic check (#131) live as b1023.2011.
- 2026-10-23 Plan tidied (#134): the finished items below left
  **Next**; the ones that had no line here get one now:
  - 2026-10-23 3D promo remake, final cut (#128): `media/hub-promo.mp4`
    (720p), its still and Home thumbnail; User Guide answer and a New
    lately card. How it was built: `promo/hub-blend/BRIEF.md`.
  - 2026-10-21 K1 your knowledge brain (#116) and K2 Term Review privacy
    by name (#117; waits on Jose publishing the rules, under **Next**):
    `docs/features/knowledge-brain.md`.
  - 2026-10-20 F1 Dr. Smiley reacts in quizzes (#81; `dr-smiley.md`
    "In a quiz"). F2 (#82) and F3 (#102) already have lines below.
  - 2026-10-20 Memory trainer M2 the trainer (#73), M3 record yourself
    (#77), M4 span chart (#80), M5 auto-marking (#91; one round from
    Jose still wanted, under **Next**): `docs/features/memory-trainer.md`.
  - Already recorded below, removed from **Next** as done: S4 (#105), S5
    springs, the AI model updates, one Claude helper, Home styles in
    layers, dead CSS in `home-polish.css`, stale numbers.
- 2026-10-23 Split `index.html`, phase 3, Voice and mic check (#131):
  `features/voice-check.js`, verbatim, declarations only (`audioMode`,
  which the memory trainer calls, comes with it). Proof: tokens identical
  when put back; the More button, the open sheet, its report and closing
  identical in the browser, phone and computer, globals unchanged.
  Looking a term up (#129) live as b1023.1250.
- 2026-10-23 S9 Home taps, part 1: the meter times taps (#132; Jose's
  pick: phone timing first). Lab (`tests/tools/tap-hold.cjs`, new: a 90 ms
  finger, timed from the lift, UA=chromium 4x, 3 runs): lift -> click
  starts 65-114 ms median by target (tile 78, quick tile 114, View all 65,
  Chat tab 98); lift -> paint 256-496. Playwright's `tap()` presses and
  lifts at once, so tap-trace's "wait" also counted the touchstart work a
  real thumb hides. Traced (TRACE=1): one frame (~20 ms: the press look,
  Layerize, Paint), then inside the click's own task ~45-58 ms before the
  click runs: hit tests, the compatibility mouse events (mousedown/up/move,
  `drInputEvent` on each), forced style. No single app handler; mostly the
  browser's own tap work, which the lab can't size for an iPhone. So the
  meter now times every tap of a run on the phone (wait and drawn, from the
  lift; `frame-meter.md` "Taps") and lists the six slowest. Next: Jose's
  runs say which taps are slow there, then fix those. Guide: the
  smoothness answer explains Taps.
- 2026-10-23 S8 Home scroll, round 3 (#130; Jose's pick after asking
  what happened to the smoothness work). New lab tool
  `tests/tools/scroll-trace.cjs` (style passes while scrolling Home and
  what set them off): 1,736 style passes in 19 s, median 9 elements each,
  so it's the number of passes, not their size. Causes: Dr. Smiley's sway
  writing `rotate` every frame, and infinite CSS loops. Of the two Smileys
  one is always unseen (the dock one faded out at the top, the Home badge
  off screen lower down), and both swayed and breathed. Now only the one
  you can see is pushed (`smileySway`'s `shown` + an IntersectionObserver;
  a lean under way still settles), and the unseen loops pause (the badge's
  breathing and the Ask ring with `.home-greeting.is-offscreen`, set by
  the petals' observer; the dock bob without `dock-has-smiley`; no
  heartline draw off screen). Same look. `scroll.cjs` UA=chromium 4x, 4+4
  interleaved: hitch ratio while scrolling 143 -> 114 median (-20%),
  dropped 20.4 -> 16.1%, style 8.2 -> 6.7 s (every new run below every
  old one). Experiments, not shipped: sway off entirely halved style time;
  every animation paused, style -22%. Lab only; Jose's phone decides
  (3 runs before on b1023.1111, 3 after). smiley-gaze and home-rest check
  both places. Guide: nothing visible changed.
- 2026-10-23 Split `index.html`, phase 3, Looking a term up (#129):
  `features/term-lookup.js`, verbatim, declarations only. Proof: tokens
  identical when put back; a lookup, its results, closing and the cached
  reopen identical in the browser. 3D Body (#127) live as b1023.1056
  (its WebKit CI timed out twice installing the browser; passed on a re-run).
- 2026-10-22 Split `index.html`, phase 3, 3D Body (#127): the Hub's side
  of the 3D Body is `features/3d-body.js`, verbatim, before the app's
  script. Proof: tokens identical when put back; the frame, its wall, the
  resize placement, a forged message and closing identical in the browser
  (no suite covered it, so a probe did). `3d-body.md`, `AGENTS.md`,
  `CLAUDE.md`. Translate (#126) live as b1022.1541.
- 2026-10-22 Split `index.html`, phase 3, Translate (#126): the
  Translate section is `features/translate.js`, verbatim, loaded before
  the app's script (declarations only). Proof: tokens identical when put
  back, the screen and a translation identical in the browser, globals
  unchanged. `sw.js` (any `features/*.js` network-first), the harness (serves
  `features/*.js`), `first-paint.cjs`, `brain-data.cjs`,
  `AGENTS.md` (a feature's code lives in its file), `CLAUDE.md`.
  False Friends (#125) merged on Jose's "Push", live as b1022.1233.
- 2026-10-22 Split `index.html`, phase 2, False Friends (#125):
  `FALSE_FRIENDS` is `falsefriends/list.js`, loaded like the guide and the
  practice bank; `ETHICS_CONTENT` stays, under a "Code of Ethics"
  banner. Identical in the browser; `sw.js`, harness, `first-paint.cjs`,
  `brain-data.cjs` ("Code of Ethics" takes its place in the data group),
  `AGENTS.md`/`CLAUDE.md`. Nothing visible, no guide change.
- 2026-10-21 Split `index.html`, phase 2, the practice bank (this PR):
  `CCHI_DOMAINS` and `SEED_QUESTIONS` are `practice/questions.js`, loaded
  like `guide/topics.js`. Identical in the browser before and after;
  `sw.js`, the harness, `first-paint.cjs`, `brain-data.cjs` (the section
  is gone from the census), `AGENTS.md`/`CLAUDE.md`/`daily-drill.md`.
  Phase 2's guide (#115) merged on Jose's "Push", live as b1021.1248.
- 2026-10-21 Notifications that reach a closed phone (Jose: "notifications
  aren't being delivered", owners should send them, "like a normal app";
  his picks: owner-code phones send, push for Team Chat and new training).
  Web Push with no package (`api/push.js`, `_push-team.js`, `_webpush.js`),
  `sw.js` push + badge + `?open=`, More → Notifications for everyone with
  Send to the team for owners, `push-subs`/`push-sent`/`push-log` rules,
  the events watcher notifies. Guide answer `notifications` + New lately.
  `tests/suites/push.mjs`. Needs Jose: the VAPID keys in Vercel and the
  rules published (`docs/features/notifications.md`, Setup).
- 2026-10-21 Split `index.html`, phase 2, the guide (this PR):
  `GUIDE_SECTIONS` and `GUIDE_TOPICS` are `guide/topics.js`, a plain
  script loaded just before the app's own (Jose's pick over fetching it on
  demand: Home's tile, search and Ask read it from startup). Identical in
  the browser before and after; `sw.js` precache + network-first, the
  harness, `AGENTS.md`/`CLAUDE.md`/`user-guide.md` updated. Weak Wi-Fi
  first paint +0.08 s, Home up to 0.1 s sooner; 4G no worse.
  Phase 1 (#112) merged on Jose's "Push it", live as b1021.1058.
- 2026-10-21 HUMC Brain (Jose's ask, this PR): the census as a 3D brain with
  a quantitative workup, `brain/` (page, data, vendored Three.js), opened for
  everyone by a double-tap on Dr. Smiley's head in the hello; one tap still
  opens Ask (320 ms on his head, 200 below). Guide answer `brain` + New
  lately card. `tests/suites/humc-brain.cjs`. `docs/features/humc-brain.md`.
- 2026-10-21 Split `index.html`, phase 1 (this PR, merge only on Jose's
  call): the `<style>` block is `app.css`, verbatim plus `@charset`,
  linked where it was, before `home-polish.css`. `sw.js` precaches it,
  network-first with the page; the harness serves it; `springs.cjs` reads
  it; `AGENTS.md`/`CLAUDE.md` say styles go there. Measured with two new
  tools, `first-paint.cjs` and `style-proof.cjs`: weak Wi-Fi first paint
  +0.33 s, Home -0.30 s; 4G both under 0.1 s; looks identical (only the
  noise two runs of the old version show). Nothing visible, no guide change.
- 2026-10-21 Split `index.html`, phase 0 (this PR): `tests/tools/census.cjs`
  (acorn added to `tests/`) maps every top-level name of the inline
  scripts to its section and who uses it, code and `on...=""` handlers
  both; 35 banners added and 3 sub-headings promoted, so the script has
  118 one-feature sections. Proof: the inline code's tokens and the page's
  markup and CSS are identical to `main`'s. The table and its reading (the
  shared core is ~60 KB; the leaves; what moves as a group) are in
  `docs/split-index.md`. Nothing visible, no User Guide change.
- 2026-10-20 Journey flake (this PR): "Term Review on 5 of your
  still-learning terms" failed on two PR runs within 30 minutes (#94,
  #98; neither touches that path) while passing on main's head and
  locally: Practice 5 loads the reviews lazily, and the check read the
  state after a fixed 2.2 s. It now waits for the review screen (up to
  10 s) and prints the state it found when it fails.
- 2026-10-20 AI backup models (this PR): Translate's backup
  `claude-sonnet-5` -> `claude-sonnet-5-5` (effort set explicitly, medium);
  the term check's backup `claude-opus-5` -> `claude-opus-5-5` (effort
  low, set explicitly: its default is medium and thinking can't be turned
  off). The backups only answer when Haiku 5.5 declines or fails, so
  nothing to see in the app; Jose can't test it on purpose.
- 2026-10-20 Stale numbers in `CLAUDE.md` / `AGENTS.md` (this PR): file
  map counts re-measured (`index.html` 31,214 lines, 1.8 MB; the city has
  99 files; rules 213/33), a line under the table saying counts drift and
  to re-measure; the "Known gap" paragraph rewritten from a measurement
  (tokens exist, 65 font-size and 99 spacing uses against ~900 and 1,737
  px values; the 6/9/13/17/26 scale covers 42% of px spacing); AGENTS.md's
  "~21,000-line, 1.1 MB" and the Open item's 1.1 MB fixed. Found on the
  way: three rules use token names that don't exist (`--fs-headline`,
  `--fs-title1`, `--fs-footnote`, index.html ~1215, ~1216, ~2005) and run
  on their px fallbacks; same sizes, so nothing shows. Rename them to
  `--fs-head`/`--fs-t1`/`--fs-foot` in the next PR that bumps the build.
- 2026-10-20 One Claude helper, last move (this PR, on top of Ask's):
  Doctor Prep on `callClaude`, which learned `retryOutput` (what to send
  as `output_config` when the first is rejected; Doctor Prep keeps its
  effort, the others send nothing, as before). Its `api_error` /
  `refused` / `truncated` throws and the loose parse without a schema
  stay in `doctor-research.js`; its own fetch, retry and text helpers are
  gone. 24 Doctor Prep cases in `api-helper.mjs` (115 checks). Item 2
  done: every request to the Messages API goes through `_routine.js`;
  the one behaviour change across the three moves is that a 400 naming
  `effort` on Doctor Prep now retries once with the effort alone before
  failing (it failed at once before). `clip()` lives in one place.
- 2026-10-20 One Claude helper, second move (this PR, on top of the
  first): Ask the Hub on `callClaude`, which learned a `beta` option
  (header + body; dropped first on a 400 naming it, then `output_config`,
  one retry each, as Ask's own loop did) and `parseAnswer(result, text)`
  for a caller without tools; `clipLine` (whitespace folded) is Ask's
  clip. Same requests, same answers; 27 Ask cases added to
  `api-helper.mjs` (91 checks).
- 2026-10-20 One Claude helper, first move (this PR): `_routine.js` grew
  `callClaude` (one request, the retry without `output_config`, the
  web-search failure log, `answer` = the last text block under a schema),
  `parseAnswer` and `clip`; `callRoutine` is built on it, same behaviour
  (Translate and the term check untouched). Term lookup uses it: same
  requests, same answers, its own `clip` and request code gone. New suite
  `tests/suites/api-helper.mjs` (64 checks, no browser).
- 2026-10-20 Home styles in layers, the text block and the banner (this
  PR, on top of the row's): `.home-greeting-text` 10 rules in five
  places (the old frosted card and its phone widths, all dead under the
  Panorama reset; Dr. Smiley's --hw-* numbers) folded into one block in
  the wave block with their comments; `.home-greeting` 10 rules in six
  places folded into one base rule and five media rules at the Panorama
  comment, the sign's band (padding-bottom per mode) left with the photo
  rules on purpose. Same proof: 30 states identical, 0 differing pixels.
- 2026-10-20 Home styles in layers, the name row (this PR, on top of the
  quote's): 7 rules in five places folded into one block with one
  breakpoint (the flex row, the 3-column grid and margins of 3, 2, 73 and
  34 px gone). Same proof: 30 states identical, 0 differing pixels.
- 2026-10-20 Home styles in layers, the quote (this PR, on top of the
  name's): 20 rules (12 for the quote, 8 for its `cite`) in six places
  folded into one commented block with two breakpoints; the dead layers
  (13/11.5/22/23/21 px, three margins, `#f5faff`/`#daecf8`/`#e7f5ff`)
  gone; the `font` shorthand kept so the same longhands reset. Same proof
  as the name: 30 states identical, 0 differing pixels.
- 2026-10-20 Home styles in layers, the greeting name (this PR, on top
  of the dead-CSS PR): 21 rules (13 for the name, 8 for `.is-long`) in
  six places folded into one commented block with three breakpoints;
  the dead layers (42/31/39/48/52 px, weight 600 then 500, the old
  letter-spacing) gone. Proof: every computed property and box under
  `#homeGreeting` identical before/after in 30 states, and 0 differing
  pixels in the banner at phone and computer size, short and long name.
- 2026-10-20 Dead CSS in `home-polish.css` (this PR): the 2026-10-14 method
  (a class is live if its name appears anywhere outside the stylesheet;
  names built in code checked by prefix) finds three classes nothing
  makes: `domain-family-kid`, `home-face-marks`, `home-wave-wide-name`.
  Five rules and one orphaned comment removed, and the two selector lists
  that paired `.home-greeting-name-row` with `.home-wave-wide-name` cut
  to the live selector (587 -> 582 rules). Proof: every element's and
  pseudo-element's computed style identical before/after on Home at rest,
  scrolled and with a domain opened, phone and computer, light and dark
  (reduced motion so nothing is mid-animation; the one difference seen was
  the Home tip's text, `SESSION_TIP` is random per session). Lesson: deleting a line
  of a selector list hands its selector to the next rule; the first pass
  did exactly that and the proof caught it (the greeting row lost its
  grid), so delete whole rules, never lines.
- 2026-10-20 The three type tokens that didn't exist (this PR, on top of
  S5): `--fs-headline`, `--fs-title1`, `--fs-footnote` (the frame meter's
  heading and big number, 3D Body's waiting line) renamed to the real
  `--fs-head`, `--fs-t1`, `--fs-foot`; same sizes, the px fallbacks gone.
  Proof: computed font-size identical before/after on each. Found in the
  stale-numbers pass (#90).
- 2026-10-20 S5 springs (this PR; Jose's pick: S5, keep F2's buttons).
  `--spring0`, Apple's bounce-0 spring as one `linear()` shape (`--ease`
  where unsupported), on the plain taps: tab bar icon (.368s) and lens
  (.588s), the Home section panel (.588s), the week dots' and level-up
  pops, the chat reaction pop and heart, the memory trainer's switch and
  option buttons, the candy button release, the trend dot, the campus
  badge, the tilt tiles. Kept on purpose: `--spring` itself (F2's
  fallback), F2's `--spring-settle`, and Dr. Smiley's acting (face lean,
  brows, cheer, dock move: `dr-smiley.md` calls the brow overshoot his
  follow-through), which the S5 question to Jose had listed as changing;
  his motion rules won. Suite `springs.cjs` (frame-by-frame: no swing past
  the target, settled within the press time). Guide: nothing to change.
- 2026-10-20 Campus card to golden hour (Jose's pick after F3): the card's
  sky violet instead of night navy, no stars, a warm glow top left. Lower
  colours unchanged. Found, not changed: the chips (4.1-4.4:1) and Exam sim
  (2.9:1) were already under the 4.5:1 text contrast minimum before this.
- 2026-10-20 S4 glossary taps. Profiled a domain tap (`tap-trace.cjs`
  PROFILE=1): ~150 of the handler's ~220 ms was the browser laying out the
  new screen, forced early by `smileyElsewhere`/`watchDomainDock`; ~38 ms
  building the HTML. A screen draws up to 120 cards (~6,600 elements on a
  real domain; the test seed has 28), so term cards now skip layout and
  paint off screen (`content-visibility:auto`, guessed 172 px). Same look:
  cards already clip, and every box on screen sits where it did to 0.05 px
  (pixels differ only by one device pixel of text snapping). Guessed
  heights above the screen would move what you read in Safari (no scroll
  anchoring), so `#content.cv-all` lays every card out for a redraw in
  place while scrolled down (`cvFresh`), Back's restore, `revealTerm` and
  Show me; removing either guard makes the suite fail. Interleaved 6+6 taps
  on 150-term domains (`BIG=150`, 4x, this session's slow machine): handler
  median 783 -> 494 ms, tap to paint 1,564 -> 1,212 ms. Suite
  `glossary-cv.cjs`. Not measured on an iPhone.
- 2026-10-20 F3 campus golden hour + depth (Jose's film brief). The scene
  re-lit in `entrance.html`: a low warm sun from the left with long shadows,
  lavender fill, a pink rim backlight, a peach-to-lavender sky with the sun's
  glow, haze toward the horizon, a green town with a pastel skyline, and a
  grade so nothing ends pure black or gray. It is now three pictures (sky,
  far town, campus), and `campusDepth` slides the back two up to 10 px by
  scroll and sideways drag, springing back; a drag never picks a building.
  The lit windows were reused (same camera), so the full render took 46 s,
  not the planned ~30 min. Suite `campus-depth.cjs` (19 checks). Guide:
  `practice` answer and a "New lately" card. Not done: the card around the
  scene keeps its night-navy top, which now reads as the high sky.
- 2026-10-20 Version lines bump themselves (Jose's pick, before S1b). Every
  PR edited `BUILD_ID`/`BUILD_TIME` (`index.html`) and `CACHE_VERSION`
  (`sw.js`), so every open PR conflicted with the next merge. Now
  `.github/workflows/bump-version.yml` runs `.github/bump-version.cjs`
  after each push to `main` that changes the app. It pushes one commit,
  "Bump version to bMMDD.HHMM" (cache name `interpreter-hub-v<n>-<BUILD_ID>`),
  and retries on the new `main` if another push landed first (tested
  against a local remote with a race). PRs and direct pushes leave those
  lines alone (`AGENTS.md`, `CLAUDE.md`, comments at both lines). Each
  merge now deploys twice, about a minute apart: the merge with the old
  version lines, then the bump.

- 2026-10-20 Dr. Smiley E4, his drawn faces seen (Jose: "what happened to
  these faces?"; they showed 0.26-0.7 s at rare moments). Each now holds
  about a second (pet's startle 0.6 s, the quiz wince 0.65 s), and a
  study-streak milestone opens with the surprised face (`wow`) before the
  cheer. Note `docs/features/dr-smiley.md`; checks in `smiley-brows.cjs`,
  `smiley-quiz.cjs`. Guide: `askmoves` answer and card.
- 2026-10-20 R5, Provider Pictures on the Where picker (Jose's pick). The
  provider sheet's facility text became the doctors' Where button plus a
  "Department or unit" line; one picker serves both sheets (`placePickFor`),
  its rows count doctors and providers. Saved: `locationGroup`, `unit`;
  `facility` follows the doctors' rule. Guide: the Provider Pictures answer
  and steps, a New lately card. `docs/features/places.md`.

- 2026-10-20 D1b, doctor page: terms sooner, layout A kept. Jose picked B
  plus smaller rows, saw it, and kept A for its look ("find another way").
  So: A's bento made compact (hero 64px, place and tip up to 3 lines, short
  empty-tip text), sticky tabs, "+ Glossary" pill under EN / ES (no foot
  line on research rows), and "From Doctor Prep, not checked by the team."
  with the tab's description over research rows (his yes). Typical doctor
  at 393x759: first term 562 to 503px, 1 full row on open (was 0).
  `docs/features/doctor-page.md`.

- 2026-10-19 D3, Doctor list (Doctors redesign; mockup `list.png`). Cards
  two to a row on a phone (`doctorListCard`): photo or specialty pin with
  initials, name, specialty dot, floor or "No floor yet", labels terms
  (research + team) / traps / tips, "+ Prep terms" with no research (only
  once the directory has loaded). Navy "+ Add" by the title (the topbar's
  "+ Add doctor" gone); "All regions" is "All"; duplicates and old
  terminology are one "N things to tidy" button opening a sheet. Delete moved
  from the card to the doctor's sheet. The saved copy keeps `_n` counts for
  the labels (never written to the database). Place headings unchanged.

- 2026-10-19 D2, Team tips (Doctors redesign). `tips` on the doctor's
  document, a sheet from Add tip and the tip tile: everyone's tips, add,
  edit and delete your own (by phone, else name), activity log. Old `notes`
  is the first tip until edited. Notes box gone from the edit sheet (Jose's
  pick). Whole-doctor saves no longer write `tips`/`notes` (`mergeFields`),
  so a stale save can't erase a teammate's tip. Back closes the top sheet.
  `docs/features/doctor-page.md`; checks in `doctor-page.cjs`.

- 2026-10-20 Campus life round 2 (this PR): the car backing out of the lot,
- 2026-10-19 Dr. Smiley E3, squash and stretch (Jose's pick B, 4%, from
  phone-size clips of 0 / 4% / 9%): only the cheer's and the greet's
  spring, Lively only, on his picture, worked out from the head keys
  (`drSquashKeys`). AGENTS.md's "never squash" rule rewritten to this one
  exception. Suite `smiley-squash.cjs`; note `docs/features/dr-smiley.md`.
  Guide: `askmoves` answer and its news card.
- 2026-10-20 Campus life round 2 (#78): the car backing out of the lot,
  the ambulance bay with doors that open as the ambulance pulls in, people
  on the benches, a flock crossing the sky; round 1's street cars faced the
  wrong way, fixed. Not picked by Jose: parallel tilt, day-to-night. Suite
  `campus-life.cjs`; note `docs/features/practice-dashboard.md`.
- 2026-10-19 Watch bubble always on Home (Jose couldn't find it: he had
  watched the video, and the once-only rule had hidden it). After watching,
  the ring stops turning (`.is-seen`). Guide: `promo` answer reworded.
  Same PR: the video has its own controls and full screen with an X that
  never hides (Jose: full screen had no X; that was the iPhone's own player,
  which hides it while playing). Closing the sheet now pauses the video (Back
  used to leave it playing behind Home).

- 2026-10-19 Campus: each building's badge names its exam area; first tap
  picks it (windows lit, scene dimmed, a card with the area's name,
  questions, share of the exam, Practise), second tap starts (Jose: "we are
  clicking on the building without knowing which content"). Suite
  `campus-pick.cjs`; note `docs/features/practice-dashboard.md`.
- 2026-10-19 Your HUMC campus on CoreCHI Practice (Jose: a game look,
  then "make it look like Hackensack", from his photos and Google 3D
  screenshots, then "alive"). The main entrance at dusk, pre-rendered 3D
  (`city/`); each exam area is a building whose windows light up with
  mastery; the glossy readiness donut in the card; cars, an ambulance, a
  helicopter, flags, the fountain, people walking and street traffic, all
  paused off screen; Dr. Smiley pinned by the area to focus on; Your domains
  rows right under. Note: `docs/features/practice-dashboard.md`; pipeline
  `docs/mockups/cchi-city/` (`buildentr.cjs`, `NOLIT` to keep the lit layers).
- 2026-10-19 Watch button became a story bubble (Jose's pick of three):
  the video's still in a turning ring of the promo's colours, a play badge,
  "Watch" on a dark chip. Same corner, same rules; 3 KB thumbnail.

- 2026-10-19 Dr. Smiley acting, E1 (Jose: "expressive like Disney
  characters"; plan below under Next). Code only, his own art: brows that
  never mirror, anticipate big raises and overshoot as they settle; an
  eyebrow-flash hello, knit-then-aha thinking, a startled take before the
  giggle when held, worried-then-reassuring when the connection drops, a
  raised brow on general-knowledge answers, a new `surprise`. Guide:
  `askmoves` answer and its news card.

- 2026-10-19 The 45-second video in the app (Jose's ask): User Guide answer
  `promo` (video in the answer, "New lately" card, oldest card dropped) and a
  "Watch 0:45" button bottom-right of Home's hello banner, beside the sign,
  until watched once on the phone (`ih_promoSeen`: the end or past 15 s). Web
  copy `media/hub-promo.mp4` (720p, 8 MB, tap to play); `sw.js` leaves
  `media/` alone. Not on the members-only screen yet: Jose to decide after
  the CEO pitch (anyone with the link sees that screen).

- 2026-10-19 Dr. Smiley's brows, bigger (Jose on his phone: "the brows
  don't move much"). Every `DR_BROWS` pose about 2x (looking up 2 to 4.2
  drawing units, caring 6 to 11 degrees); his pick of 1.5x / 2x / 3x was 2x.
  Raised brows still clear the cap brim, mirror band and grad cap.

- 2026-10-19 CoreCHI Pixar finish (stacked on the dashboard PR): clay tiles,
  glossy donut, candy buttons, glossy beads, lean-toward-finger, squash
  landings. CSS + one small pointer handler; nothing runs at rest.

- 2026-10-19 CoreCHI dashboard + motion (Jose's ask, options picked:
  regroup + trend, native animation). Score-trend tile (last 12 sessions,
  tap a point), Focus next tile, "My progress" card folded into the trend
  tile and the domain rows, staggered arrival, count-ups, self-drawing
  line, resumable motion. Note: `docs/features/practice-dashboard.md`.

- 2026-10-19 Dr. Smiley's brows move (Jose's pick of four ideas for more
  expression; the others were an Expression Studio page, new drawn frames
  and 3D with face shapes). Brows cut out of his own art into
  `drsmiley/brow-l.webp`/`brow-r.webp`, forehead repainted, a pose per
  face frame plus caring holds on `composed`/`encourage`
  (`docs/features/dr-smiley.md`). Art total 334 KB to 324 KB. Guide:
  `askmoves` answer and a news card.

- 2026-10-19 S3b startup, what's left (invisible). The first idle tuck set
  `--mini-w` on `<body>` (911 of 1,420 elements restyled, a 290-550 ms task
  ~7 s after opening at 4x in 5/5 runs); now on the tab bar, kept in its
  markup: 0/5. Bar sizes identical (Home, Chat, redraw while tucked).
  Lens glide as a Web Animation and moving Home's layout reads to the frame
  were measured (no gain; worse) and dropped; "draw less at first" moved
  to Later. Facts: "S3b measurements". Rules added: always say the
  recommendation; a chat's title says what it works on.

- 2026-10-19 S7 Home scroll part 2 closed (Jose). S7a-S7d below. On his
  iPhone (393x852), scrolling Home went from 85 ms/s, 10.5% late (before
  part 1) to 62-78 ms/s, 7.9-8.9% (3 runs on b1019.1228); still Apple's
  "distracting" (10+). The still-Home stall (120-141 ms, ~26-29 ms/s) did
  not come back in those 3 runs (~3-8 ms/s, nothing over 51 ms); cause
  never found. The meter lists any stall with what ran, if it returns.

- 2026-10-19 S7d, the meter names its stalls (diagnostic; visible only in
  the meter's results). Every frame over 50 ms is kept with its time into
  the run, time since the last scroll, screen, time since opening and the
  app jobs that ran in it (`fmNote(tag)`: render, greeting word, heartline,
  pins, tab bar tuck/open, Dr. Smiley's performances, time labels, time of
  day, glossary saved, the six data listeners, the meter itself, More
  closing). The six longest show under the table and in Copy numbers.
  Names are matched by time over the stall and the frame before it (a held
  frame carries its due time, so the stall lands one frame late; the first
  version missed every name). New lab tool `tests/tools/idle.cjs` (Home
  left still, optional scroll first, trace of every task over 50 ms with
  what ran). frame-meter suite checks the list, the sheet and the copy
  text. User Guide: the smoothness answer explains the list.
  jvtomax99/Interp#54.

- 2026-10-18 S3 startup (invisible). Measured with the new
  `tests/tools/startup.cjs` (each long task's pieces, the lines that forced
  layout, CPU profile). The plan's "top CPU" list was mostly forced layout
  billed to whoever measured first. Changes: the name pen's path is traced
  in a worker (`penTrace`, plain worker, no OffscreenCanvas; same path to
  the byte for Jose, Moisés, Elizabeth Lind-Smith; WebKit needs the blob
  URL kept, CI caught it); the categories listener's first snapshot (the
  document `loadData` just read) no longer repaints Home; the petals (hero
  and rank card), the heartline's placing, `fonts.ready`/`fonts.load` and
  `applyHeroDrift` run in the next frame, before it paints (`beforePaint`
  in `home-polish.js`); `dockAfterRender` settles the lens with a style
  read, not a layout. Kept immediate on purpose: anything that changes
  Home's height (rail dots, the name fit `fitWave`), since Back restores
  the scroll right after the render (destination-labels caught a 7 px miss),
  and Dr. Smiley's dock check (WebKit's dock-tuck). 4x, iPhone UA, 3+3
  interleaved: `render()` CPU first visit 909-1152 -> 568-627 ms,
  returning 841-1102 -> 599-765 (every after below every before); tasks
  over 200 ms first visit 4-6 -> 1-3; worst task 441-610 -> 418-462 and
  238-388 -> 238-290 (overlapping, so not proven). Total long-task time
  unchanged. Target (no task over 200 ms) not reached: S3b. New suite
  `startup-work.cjs` (also in the WebKit CI job). No User Guide change.
  jvtomax99/Interp#52.

- 2026-10-18 S7c, pin burst stops when a scroll takes the touch (visible,
  Jose's pick). Jose first picked option 1 (burst on lift); measured first:
  a tap navigates at once (card gone 22-56 ms after the click), so every
  burst frame seen today plays while the finger is down (117-234 ms for a
  110-200 ms tap, 0-1 frames after lift); on lift would have removed it
  from taps. Asked again: option 2. The burst still starts on
  `pointerdown`; on `pointercancel` for that touch it stops (`pin-icons.js`).
  Taps: same burst frames before/after (9/9/9 at 110 ms, 13-14 at 200 ms).
  Drag from a card: burst on screen 650-735 ms -> 46 ms (3 frames, the
  cancel comes ~50 ms in). Trace at 4x on a card with burst rings, 3
  drags x 3 runs each side: layout 31-41 -> 9-17 ms per drag (every after
  below every before), raster tasks 275-294 -> 128-144 (time overlaps),
  paint time unchanged. New suite `pin-burst.cjs` (old code fails it). No
  User Guide entry mentions the burst, so none changed. Jose's phone
  decides. jvtomax99/Interp#51.
- 2026-10-18 S7b, tuck restyle (invisible). Cause, from a Chrome trace
  with invalidation tracking (`tests/tools/tuck-trace.cjs`): the two
  `body.dock-mini` rules for the tab's name ended on a bare `span`, so
  each tuck/open restyled every span on the page (471-510 of 1,420
  elements, 269 spans). The name span now has class `tabbar-name`; rules
  read `span.tabbar-name:not(.tabbar-icon)`, same weight (0,2,1).
  Restyled per tuck/open 93-120; style work at 4x median 54 -> 19 ms,
  worst 105 -> 28 ms (5 tucks + 5 opens each). Computed styles identical,
  656,806 values incl. ::before/::after, 13 states (`tests/tools/tuck-styles.cjs`);
  screenshots 0 px different (Home and a domain, open and tucked).
  `scroll.cjs` UA=chromium 8+8 interleaved: no difference measurable (all
  16 runs in the bad band; ~280 ms saved per run is under the spread).
  dock-tuck: new guard, rules on body state classes must not end on a
  bare tag (fails on the old code). Harness `POLISH_DIR` for before/after
  of the Home files. Jose's phone decides. jvtomax99/Interp#50.
- 2026-10-18 S7a, overlay rules (invisible). The 6 `body:has(.overlay.show)`
  / `.gs-overlay` / `.dm-overlay` rules now read `body.ov-open.ov-open`,
  `.gs-open`, `.dm-open` (same weight), kept by one MutationObserver
  (`overlayFlags`, `index.html`, by `closeAllOverlays`), so new overlays
  need nothing. Computed styles old vs new identical: 398,040 values, 24
  states (phone + computer, each kind open and closed;
  `tests/tools/overlay-styles.cjs`). dock-tuck checks the classes follow
  each kind before the next frame. `scroll.cjs` UA=chromium 4x, 8+8
  interleaved: style time 5232 -> 3728 ms median (every after run below
  every before run), late while scrolling 26.7 -> 23.8% (runs overlap),
  script +160 ms (the observer: at most ~90 ms a run, counted). Rule added
  to `AGENTS.md`: no `:has()` for state on big containers. Merged
  2026-10-18. jvtomax99/Interp#49.
- 2026-10-17 Home scroll, part 1 (Jose: before S3). Tab bar's 5
  `:not(:has(.tabbar-btn.is-active))` rules replaced by `.tabbar.no-current`
  set at draw (doubled class, same weight; all 69 tab bar elements'
  computed styles identical, 12 states). `scroll.cjs` UA=chromium 4x,
  8+8 interleaved, bad runs left out: late frames while scrolling 9.1% ->
  6.7% median (every after run below every before run), style time 10.6 ->
  9.2 s. Jose's phone decides. Tried and reverted: reading the scroll position once per frame
  for the photo drift, tuck and sway (no gain measured on its own; in CI's
  WebKit the tuck then landed after the dock-tuck test moved on).
  jvtomax99/Interp#47.
- 2026-10-17 S6 smoothness meter (Jose asked; before S3): bottom of More
  (the app has no Settings screen), above the build. Timer pill, results
  in Apple's hitch ms/s, per screen and while scrolling, runs kept with
  their build (`ih_frameMeter`). `docs/features/frame-meter.md`, suite
  `frame-meter.cjs`. jvtomax99/Interp#46.
- 2026-10-17 S2 tab bar tuck, transform only (`dockMorph`, `.dk-skin`
  pieces): at rest pixel-identical, layout per move 19 -> 6-8 ms; top bar's
  6 px shift left on Jose's call. Gain on Safari unproven in Chromium; S6
  measures it on the phone. jvtomax99/Interp#45.
- 2026-10-15 Team Chat titles (Jose asked): "Admin" under the names of
  owner-code phones (`hub-admins/{uid}`; messages now carry the sending
  phone, held to it by the rules) and a "Supervisor of Language Services"
  ribbon for Liz Lind (by name; Elizabeth Lind, Liz Lind-Smith too).
  Rules tested in the emulator; Jose pastes `firestore.rules` into the
  console. `docs/features/team-access.md`, suite `chat-titles.cjs`.
- 2026-10-10 CCC watcher source: moved, then switched off (site answers
  403 to the watcher). jvtomax99/Interp#22, #23.
- 2026-10-13 Phase 1 cleanup: 16 dead functions, 6 unused files, internal
  files no longer served. #24.
- 2026-10-14 Startup: 2 finished migrations + old blob code removed. #25.
- 2026-10-14 `CLAUDE.md` slimmed 584 → 350 lines: 11 feature write-ups
  moved verbatim to `docs/features/`, one pointer line each. #27.
- 2026-10-14 Dead CSS: 163 rules (24 KB) removed from `index.html`;
  computed styles identical before/after on 40 screens and sheets x phone,
  computer, light, dark; all suites pass. #29.
- 2026-10-14 Doctor Prep on Sonnet 5.5: effort `medium` set explicitly,
  max_tokens 8000 → 16000, refusals answered plainly, JSON read from the
  last text block. Smoke-tested with a mocked API. #30.
- 2026-10-14 Places: one "Where" picker on the doctor sheet (search,
  by region, add a place), shared place icons from the pin artwork in
  `terminology-meta/places`. `docs/features/places.md`. #32.
- 2026-10-14 Regions R1-R3 (South joins): North/South picker, Team Chat
  channels (Everyone, North, South), Doctor Directory by region, namesake
  fix. No rules change, no migration. `docs/features/regions.md`. #31.
- 2026-10-15 S1b petals: banner and rank-card petals drawn on one canvas
  per place from a Web Worker (OffscreenCanvas; same painter on the page
  where unsupported). Same seeded values, artwork and keyframe math: every
  petal's box matches the old computed transform to 0.01 px. Idle settled
  75% -> 24%, tap waits ~160 -> ~82 ms (medians of 6). Taps stay in S1b.
- 2026-10-15 S1 Home rests after arrival: #37 stopped the petals (one
  shower), the heartline (draw once), the badge breeze, halo glow and card
  ring after arrival. Idle settled 94% -> 4%. Jose then asked for the
  petals and the heartline looping again (part of the look): restored as
  before but with no per-petal `will-change`; badge, halo and ring stay
  settled. Numbers for this in the PR.
- 2026-10-15 Smoothness measured (no app change): baseline, causes and the
  S1-S6 plan above; `tests/tools/perf.cjs`.
- 2026-10-14 Doctors D1, the doctor's page: header with specialty pin,
  bento (count, Where, tip), tier tabs, terms read aloud, glass bar (Start
  appointment, Flashcards, Add tip). `docs/features/doctor-page.md`. #35.
- 2026-10-14 Term lookup on Sonnet 5.5: effort stays `medium`, refusals
  logged and answered as "nothing found", JSON read from the last text
  block. Same mocked-API check. #30 (Jose asked for it in the same PR).

## Moved out of Next, 2026-11-10

The old "Next (in order)" list, word for word as it stood, kept for its
history: every numbered item in it was finished, parked or waiting on Jose.
What was still open went back to `docs/PLAN.md` ("Waiting on Jose",
"Later").

0. **Feel audit (Jose, 2026-11-04): the app glitches on open, Dr. Smiley
   stutters, moving the app feels off.** Plan and leads in
   `docs/feel-audit.md`; phase 0 (measure) first, then one PR per phase.
   Phase 0: #199 (the plan, two tools, the findings: after every deploy
   the app reloaded itself mid-hello; the opening's jam; his face timers
   late; the bold look cleared). Phase 1, no reload on a normal open:
   #200, live b1104.1206. Phase 2, a quieter opening (pins re-applied
   39 -> 3 in the opening, the pen's forced layouts gone, the update check
   after the hello): #202. Phase 3, his face frames on the sequence's own
   clock (a performance's end used to land 61-434 ms late at 4x, now
   within one late frame): #203, live b1104.1348. Phase 4, scrolling
   and screens (the dock companion searched the whole page for faces and
   forced a layout on every scroll frame; a 150-term domain's scroll
   script fell 60%, dropped frames 42% -> 31%; glass is never stacked, so
   nothing cut): #205, live b1104.1832. The hello's canvas
   draw is the opening's floor now: Jose's call (options in the audit
   note). Phase 5, step 1, the measuring pass over 26 screens
   (`tests/tools/finish-check.cjs`: press feedback, empty flashes, layout
   shift, the keyboard, dark mode, safe areas; findings table in the audit
   note): #207. Step 2, the fixes by group (press feedback for about 30
   kinds of control, the faint ink token darkened on Jose's call, five
   contrast spots): #208, live b1104.2144. Step 3, the guard suite
   (`tests/suites/feel.cjs` in `run.cjs`; it found the term and doctor
   cards' press glow dead under their entrance animation's forwards fill,
   fixed): #209, live b1104.2150. **The feel audit is done** (phases 0-5,
   2026-11-04). Still owed by Jose: five phone screenshots
   (Ask and Team access with the keyboard up; a doctor's page, the
   doctor list's A-Z strip, a toast) and his meter numbers.

Tidied 2026-10-23: finished items left this list for **Done** (a line
each; the long notes live in `docs/features/`). What's left is the work
under way, then what waits on Jose, then small leftovers.

1. **Split `index.html`, phase 3: features to their own files**, one per
   pull request, leaves first, nothing else in flight (Jose, 2026-10-20).
   Plan, census and the method: `docs/split-index.md`; where it stands:
   the split entry under **Later** and `docs/handoff.md`. The campus:
   #139, live b1024.1553. Now (Jose, 2026-10-24: small pieces first): the
   leftover small leaves, one per PR: False Friends' screen #141 (live
   b1024.1920), the knowledge brain #143 (live b1024.2150), the guide's front page
   #145 (live b1025.0157), the doctor sheets #147 (live
   b1025.1140), CSV #148 (live b1025.1453),
   duplicate doctors #150 (live
   b1025.1607), the backfill #152 (live b1025.1713): the small leaves
   are done. The Ask the Hub group #154 (live b1025.1947). Dr.
   Smiley's engine group #155 (live b1025.2317). **The split is done**;
   what's left stays inline by design (phase 4, `docs/split-index.md`).
   The 1-minute promo: made (#151, #156), in the app as Home's Watch video
   with a voice fix and 10% faster (#158); `promo/hub-blend/BRIEF-60s.md`.
2. **Campus: alive and interactive (Jose, 2026-10-26; previews in the
   third campus chat; he picked all seven). Done 2026-11-08 (b skipped, see b).** Waits on #157, then
   `claude/campus-alive`. Order, one PR each:
   a. **Live 3D test on his iPhone first** (an Artifact page: the campus
      drawn live with three.js; spin, pinch, tap to lift, an hour slider,
      floors rising). Gate: smooth on his phone (frame meter) and as good
      as the pre-rendered look. Yes: b. No: the picture route (1 as
      per-hour background and window pictures, 3 as picture layers, 7
      dropped) and say so.
   **2026-10-26: a first piece is in** (Jose's pick): the card stays the
      picture, its **3D** button opens the campus full screen (`campus3d/`):
      drag to turn, pinch to zoom, tap a building, "See it finished". Still
      waiting on his frame-rate reading of it on his iPhone.
   **2026-10-27 (Jose):** a time-of-day slider in the 3D view, and the sun
      where the real one is over HUMC for that date and hour (it lit the
      campus from the north before). `claude/campus-time`. Frame-rate
      reading still owed.
   **2026-10-27/28 (Jose): the campus on the real map, front and back.**
      Preview only, not in the app: every building from his OpenStreetMap
      export at the same scale (2026-10-28: the front's three too, "still
      not accurate"), the diorama's ground at the front refitted round
      them; Terminology = Helena Theurer Pavilion (the map's "Patient
      Pavilion"), Encounter = the real John Theurer across 2nd Street; the
      corner of Atlantic and 2nd from his photos.
      `docs/mockups/cchi-city/real-map/` (README: build, decisions, open
      items), `claude/campus-real-map`. 60 fps on his iPhone (2026-10-28).
      Next: his OK on the look, then wiring it into `campus3d/` and the
      card's pictures (own PR).
   **2026-10-28 (Jose): the card's pictures from Blender** (his picks: Blender for
      pictures, "the CoreCHI Practice card", "together": the moving things re-made at
      once). `claude/campus-card-blender`, own PR. Plan: (1) `card_capture.cjs` on
      the built preview, camera = the card's (diorama.html's direction, pulled back to
      the whole board, fov 18.77, 960 x 840 at 2x): every moving thing alone with the
      rest as depth (clouds, flags, spray, cars, ambulance, helicopter, street cars,
      walkers, sitters, birds, the people about), their paths projected; the domain
      buildings' labels; the GLB with the moving things hidden. (2) `toy_render.py
      card`: painted, clay, building-id, height and lit-window passes from that
      camera. (3) `card_build.py`: near (clay), sky, far, each building's paint and
      glow in tenths (id mask x height cut, occluded by the id pass), tap boxes, the
      manifest into `CAMPUS_MAP`, files into `city/`. (4) `features/campus.js`
      places renamed to the real buildings; the campus suites; the guide answer and a
      New lately card. The ambulance bay doors and the backing-out car belonged to
      the old front (gone on the real map); Jose (2026-10-28): move them: the
      ambulance pulls up at the real ER on Atlantic Street with its doors opening, a
      car backs out of a spot in the Visitors parking court.
      **Done 2026-10-29 (`claude/campus-card-blender`):** the card shows the real campus from Blender
      (`real-map/card_*`, README "The card's pictures"). Both spots Jose placed are hidden from the card's
      camera (checked with rays); his pick "move them into view": the ambulance stops at the curb on
      Atlantic Street at the mouth of the ER's court, back doors opening; the lot car backs out on the
      Visitors Parking garage's top deck. **Done 2026-10-29:** `campus3d/` from the real map too
      (`real-map/build.py --app`, Jose: the 3D button still showed the old campus).
      **2026-10-29 (Jose): make the campus act like real life, in his four prompts, in order.** 1 the audit
      (`real-map/audit.cjs`; done: 269 spots fixed, `claude/campus-audit`), 2 traffic (lanes, one-way streets, stops
      at signs and crosswalks, turning, no overlaps; done in 3D 2026-10-29, `claude/campus-traffic`: `real-map/traffic.js`,
      checked by `traffic_check.cjs`; the card not re-rendered), 3 people (done in 3D 2026-10-29, `real-map/people.js`; sidewalks, crosswalks, doors, pairs, wheelchairs,
      waiting), 4 the buildings checked against the real campus with sources (#176: four floor counts from HMH and
      the builders' pages, garage gates where the map's driveways meet the walls; sources and the unproven list in
      `real-map/README.md`, "The buildings, against sources". Opened 2026-10-30 as #176, redone on main as #210, 2026-11-04, live b1104.2338, after the
      card's pictures were re-rendered at 1200 wide under it: the same scene changes, the pictures rendered again
      with Blender 5.2 as `bpy` on Python 3.13, `campus3d/` rebuilt). Live behaviour (giving way) is 3D only;
      the card's movers follow fixed paths.
   b. **Skipped (Jose, 2026-11-08), so the campus is done.** It would add ~1.8 MB per open
      of CoreCHI Practice (`campus3d/index.html` 1 MB + three.js) and GPU work while the
      card scrolls, and mostly repeat what the card's 3D button already gives (spin, tap,
      the sun by the clock, 60 fps on his iPhone). Forest and Duolingo keep the dashboard
      picture light and put the heavy view behind a tap, as the card does. Open again only
      if he asks. The original plan: Campus drawn live in the app (`features/campus.js`), pictures kept
      as the fallback (no WebGL, reduced motion, slow phone), windows on
      all sides. Brings 7 (spin), 2 (tap lifts it), 1 (sky follows the
      clock: sun moved live, no extra pictures) and 3 (floors rise,
      replacing paint).
   c. Overlays, either route: 4 (tap a person: a term from your glossary,
      counts as practice; tap area bigger than the figure), 5 (fireworks,
      ribbon, gold badge when a building is finished), 6 (weather, the
      friendly half only: sun and a rainbow for a streak, never snow for a
      missed day).
      **2026-11-05 (Jose's pick, the first of these): 5, the celebration.** Spec first
      (`docs/features/campus-celebration.md`, his go the same day), then #213 on
      `claude/campus-celebration`, live b1105.0959: three fireworks around the badge after the last
      climb, a Finished ribbon for the visit, the badge gold with a star for good,
      once per phone (`ih_campusDone`); no sound, no cheer, no finale in this
      version. **2026-11-05 (his pick): 4, tap a person.** Spec first
      (`docs/features/campus-tap-person.md`, his go the same day, "Term Review
      only"), then `claude/campus-tap-person`: one 44 px spot per group of
      people under the buildings' tap boxes, three dots over the group holding
      the word, the card asks the English, Show, Got it / Missed it saved as a
      Term Review answer; the CoreCHI streak untouched. #214, live
      b1105.1156. **2026-11-05 (his pick, the last): 6, friendly weather.** Spec first
      (`docs/features/campus-weather.md`, his go the same day, "as written"), then
      `claude/campus-weather`: the sun from 3 days at the left of the sky, a rainbow
      from 7 over the board, CSS only, sliding with the sky; nothing for a missed day.
      #217, live b1105.1421. **2c is done with this.**
3. **Smoothness: parked.** Home taps are done (S9, Done 2026-10-26).
   Scrolling Home still reads 64 ms/s on the meter (Apple: 10+ is
   distracting), but **Jose, 2026-10-26: scrolling Home feels fine.** The
   meter times the page's own frames; Safari scrolls the page on its own
   thread, so the number is not the scroll he sees. No more scroll work
   unless he notices a hitch (then ask what moves badly: the page, or
   something on top of it like Dr. Smiley's lean or the tab bar). Back
   to a scrolled Home opens the tab bar and tucks it again in the same frame (never seen; frames
   checked 2026-10-26). Skipping the open was tried and **dropped**: the
   rebuilt bar starts at the last screen's capsule width, so without the
   second morph it visibly grows (132 -> 142 px over ~250 ms); an exact
   fix needs more dock code than its ~20 ms (4x) is worth.
   Background, the S-steps so far:

**Smoothness: feel like iOS on an iPhone (Jose approved 2026-10-15).**
Measured first (`tests/tools/perf.cjs`, iPhone size, CPU 4x, Chromium as a
stand-in for Safari; compare the median of 3 runs, startup varies 2x between
runs). One PR per step, re-measure after each, User Guide only where something
visible changes. Order approved; S1 approved ("Home rests after arrival").
**Rule (Jose, after S1): visuals never suffer.** Every S-step keeps the
look and motion identical; anything that would change what he sees (S5's
new springs included) is shown to him first.
Baseline 2026-10-15: idle Home 95% busy (reduced motion: 6%); taps on Home wait
109-251 ms before their handler runs (View all 312-440 ms to paint, name sheet
392-456, More 360-408, a domain 288-368); startup worst task 395-676 ms,
40-73 long tasks; 30 animations not transform/opacity.

S1b. **Home taps, still slow (found in S1).** With Home at rest (#37), taps still
   wait 59-90 ms (median, 4x) against the < 20 ms target. They are timed
   ~2 s after an arrival on Home, so arrival work (render, the shower's
   start, `ih:home-paint`'s forced layout) and the tap's own pointer/touch
   handlers (`drInputEvent` and two `pointerdown` listeners: ~38 ms from
   pointerdown to click on a fully rested Home) are what's left. Goes with
   S3 and S4; re-check the target after them.
   Petals done (S1b PR): one canvas per place, painted from a worker, same
   look (frame-by-frame comparison in the PR). Medians of 6 interleaved
   perf.cjs runs, before -> after: idle Home settled 75% -> 24%, first
   window 95% -> 53%; tap waits View all 185 -> 84 ms, domain 165 -> 84,
   name sheet 143 -> 82, More 140 -> 81 (More was missed in 2 of 6
   before runs, 0 after); startup long tasks 76 -> 39 (first visit), worst
   task 497 -> 438 ms. Still open here: taps wait ~80 ms against < 20 ms;
   left for S3/S4 (arrival work, `ih:home-paint`'s forced layout, the
   pointer handlers), then re-check.
   **#40 (merged 2026-10-15): WebKit keeps the old petals.** The worker
   painter (OffscreenCanvas) crashed the WebKit page in CI (1 cold load in
   6; the old CSS petals 0 in 6). Jose's call: iPhones and Safari keep the
   old CSS petals, Chromium (Android, computers) gets the worker painter.
   `PETALS_AS_DOM` in `home-polish.js` picks by engine (`AppleWebKit` and
   not `Chrome/`, `Chromium`, `Edg/`; every iOS browser is WebKit); the
   DOM path writes the same seeded petals with the old inline styles and the
   old `.home-petal` CSS. Same look: styles identical to b970868, reduced
   motion pixel-identical, moving frames within run-to-run noise. home-rest
   checks both (an iPhone Safari user agent in Chromium takes the old path).
   So the S1b numbers above are Chromium's; iPhones are as before S1b.
Later, not Home (from S7): Team Chat's thread tuck reads `scrollTop` in
   the scroll event (index.html ~20912); cheap while layout is clean,
   measure in Team Chat before touching.

4. **Practice scenes: the doctor, nurse and visitor as the speakers in the
   memory trainer** (Jose, 2026-11-04, after the Tripo figures on
   `claude/hub-figures`). Built on `claude/practice-scenes` (#197); Tripo's terms
   read by Jose 2026-11-04: OK to use.
   `docs/features/practice-scenes.md`.

**Waiting on Jose** (nothing to build until he does):
- **K2, Term Review privacy (#117):** publish `firestore.rules` in the
  Firebase console. Until then the "only your own record" rule does
  nothing.
- **M5, auto-marking (#91):** one memory-trainer round with Auto-mark on,
  and one with Record me on too.

**Doctor list, next ideas** (from the 2026-11-03 review; Jose picks):
compact rows instead of two-column cards (mock up first: it reverses D3's
cards), and search that also finds a doctor's terms
and short forms (GI, cardio, peds).

**Doctors redesign (Jose approved 2026-10-14).** Mockups:
`docs/mockups/doctors/list.png` and `page.png` (HTML beside them). Rule from
Jose: it must look like the rest of the app (light background and mesh,
white cards with the standard finish, navy, glass bars, `ds-mode-seg` tabs,
Inter at the `--fs-*` scale), never a different app; and terms must be easy
to read. Nothing in a doctor's research is lost: all five tiers (core,
procedures, drugs, anatomy, falsefriends), hand-added `customTerms` and
photos stay. One PR per step; User Guide in each.

D1c. **Needs Jose** (`docs/mockups/doctors/d1-review.md`): the real-data
   replay (he sends `doctors.json`, steps in the review); the 5-minute
   interpreter test on iPhones (Spanish voice on ES included).
5. **The opening, Badge in (Jose, 2026-11-05): built,** waiting for his
   OK (see Done); live b1105.2126. Its light by time of day: see Done.
   Other ways to raise it, offered 2026-11-05, not picked yet: pins you
   earn on your lanyard (my pick), a quick second open later the same day,
   drag the badge onto the reader with better sounds. Later, if he asks:
   tilting the phone to swing the badge, playing on a computer.
   **2026-11-06:** your own photo on the badge, opt-in in More (#228,
   live b1106.1246; `docs/features/opening.md`, "Your photo on the
   badge"); with it on, Dr. Smiley stands by the reader, full body, from
   Jose's clips (#231, live b1106.1507). Adjust your photo before it's
   saved, the name sheet (#232, live b1106.1641;
   `docs/features/photo-adjust.md`). Not checked yet: how smoothly he
   plays on a real phone (no graphics chip in the cloud machine).
   **2026-11-07:** pins on your lanyard, each practice badge an enamel
   pin, a new one clicking on (`docs/features/opening.md`, "Pins on your
   lanyard").
6. **Tool banners (Jose, 2026-11-06, "Plan it for real", then "Build it"): built,** waiting for his OK. Translate, Term
   Review's start, Ask the Hub and Doctor Directory get the domains'
   colour banner with their pin, and the Home pin you tap flies into it.
   Plan, what it won't do yet, cost in height, checks:
   `docs/features/tool-banners.md`. One pull request. Came from his ask for
   ThreeUI and Meshy ideas; the other picks (thinking trace, card stack,
   practice certificate, Meshy equipment drill, spinning pins) are listed
   there as later ideas, mockups in the chat only.
7. **Email sign-in, one account on every phone (Jose, 2026-11-06).**
   A 6-digit code emailed to you, typed into the Hub; your name, photo,
   practice and settings follow you to any phone. Spec, the "not in this
   version" list and Jose's one-time setup: `docs/features/email-sign-in.md`.
   Three PRs: E1 sign in, E2 sync, E3 Term Review and titles by account.
   Sender: a new Gmail just for the Hub (Jose's pick). E1 built
   2026-11-06 (sign in, the team place and owner carried over, the name
   follows); works once Jose's setup is done (the Gmail, its app password
   in Vercel, the `accounts` rule published). Gmail set up and sending
   (2026-11-06). Then "Sign in with email" on the team-code screen, for an
   account already in the team. E2 built 2026-11-06
   (`features/account-sync.js`: practice, streak, badges, memory trainer,
   Daily Drill, campus, knowledge count and settings joined between phones;
   Dr. Smiley's memory of you stays on the phone, `AGENTS.md`, Jose's
   call). E3 built 2026-11-07 (Term Review by account, titles given to an
   account on Team access; Jose: typing the name stops earning a given
   title), live b1107.1257. All rules published 2026-11-07. **Email sign-in
   is done.** The Hub locked the same day (41 phones in; `CLAUDE.md`, Open
   items).
R4. **Regions: pins, events, the top bar** (Jose, 2026-11-08, all three;
   South reads Hackensack Meridian Health): built, `docs/features/regions.md`
   (R4). Doctor Prep's default location stays "Hackensack Meridian Health".

Watch after South joins: Firestore reads (Usage page) a week later. More
people = more reads at every launch; the 50K/day trigger under Later may
come from this alone.

**Small leftovers**, for whoever next touches the file: none.

### From "Later": the split of `index.html` (finished)

- **Split `index.html`** (1.86 MB) into CSS + JS by feature. The plan,
  measured: `docs/split-index.md` (2026-10-20): markers and a census
  first, then the CSS, then the data constants, then features one file
  per PR, leaves first; the proof per move and the three lists every new
  file must join. Jose (2026-10-20): start after the open PRs merge,
  one move at a time with nothing else in flight; phase 1's first-paint
  trade is still his call once measured. Phase 0 (census, markers) done
  2026-10-21. Phase 1 (the CSS to `app.css`) built and measured
  2026-10-21, merged on Jose's call (#112). Phase 2, `GUIDE_TOPICS`:
  #115, live. `SEED_QUESTIONS`: #122, live (b1022.0855). `FALSE_FRIENDS`: #125, live.
  Phase 3 (features): Translate #126, 3D Body #127, Looking a term up
  #129, Voice and mic check #131, Dr. Smiley's performances #137, live;
  the campus #139, live; False Friends' screen #141, live; the knowledge brain #143, live; the guide's front page #145, live; the doctor sheets #147, live; CSV #148, live; duplicate doctors #150, live; the backfill #152, live. Small leaves done;
  next the groups (`docs/split-index.md`).
