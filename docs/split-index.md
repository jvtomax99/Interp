# Splitting `index.html`: the plan

`index.html` is one file, 1.86 MB, 31,738 lines (2026-10-20): one `<style>`
block of 466 KB (lines 50-7356), one inline script of 1,354 KB (lines
7928-31734; two small scripts beside it), and 39 KB of markup. The script
holds 1,670 top-level statements; 313 of them are UPPER_CASE data constants
(296 KB), the biggest `GUIDE_TOPICS` 54 KB, `SEED_QUESTIONS` 44, `FALSE_FRIENDS`
39, `DOMAIN_ICONS` 18, `DR_FACE_SEQ` 11. The CSS is marked by 57 banner
comments. The script had 80 banners, but several covered many unrelated
features (one, "Places (shared)", held 171 names from places to the quiz's
state to onboarding); phase 0 added 35 and promoted 3 sub-headings, so
every one of the 118 sections is one feature or one kind of shared thing. The census below is measured over those.

CLAUDE.md calls this "the main structural cleanup available". It is big, and
ChatGPT edits `index.html` directly, so it runs as its own series of PRs, one
move each, with the same proof every time and nothing visible changing.

## Rules for every move

- **No behaviour change, no build step.** Plain files loaded by `<link>` and
  `<script src>` in the order they had inline; globals stay globals (every
  screen reaches the others by name). No bundler, no modules until the end,
  if ever: `AGENTS.md` has no build step and Vercel deploys the files as they
  are.
- **Proof, per PR:** (1) the suites (`cd tests && node run.cjs`); (2) for a
  CSS move, every element's computed style and box identical on every
  screen and sheet, phone and computer, light and dark (the script from the
  dead-CSS pass, `docs/PLAN.md` 2026-10-14 and 2026-10-20); (3) for a JS
  move, the page's own globals unchanged: `Object.keys(window)` before and
  after, and `node --check` on each new file; (4) startup unchanged or
  better: `tests/tools/startup.cjs`, median of 3, before and after, at
  phone size with the CPU slowed; (5) offline still works: the new file in
  `sw.js`'s precache and in its network-first list (the page and its code
  must arrive together, as `home-polish.js` does), and `.vercelignore`
  untouched.
- **Three lists to update with every new file:** `sw.js` (precache +
  network-first regex), `.github/bump-version.cjs` (which paths count as
  "the app changed" for the version bump), `tests/support/harness.cjs`
  (`route()` serves `home-polish.*` and `pin-icons.js` from the checkout and
  honours `POLISH_DIR`; a new file needs the same). And the file maps in
  `CLAUDE.md` and `AGENTS.md`.
- **Tell ChatGPT.** A line in `AGENTS.md` before the first move: which files
  exist now and that a feature's code lives in its file, not in
  `index.html`. Two tools editing the same thing in two places is how the
  press glow died.
- **Fetch `main` right before each move.** `index.html` moves every day.

## Phases, in order

0. **Markers and a census (one PR, tests/tools only). Done 2026-10-21**
   (comments only in `index.html`: its code is token for token the same,
   its markup and CSS byte for byte; the census and its reading are below). A script
   `tests/tools/census.cjs` that lists, for the inline script, every
   top-level name with its line and the section it sits in, and for each
   section the names it uses from other sections and the sections that use
   its names. Where the script has no banner, add one (a comment, nothing
   else). Output: a table in this file, so the leaf sections are chosen
   from a measurement, not a guess. The CSS is already marked.
1. **CSS out: `app.css`** (466 KB), one PR. The whole `<style>` block as a
   file, linked from the same place in `<head>`, before `home-polish.css`
   (which must still win). Risk: a first visit paints a frame later while
   `app.css` loads (one more request; the inline block painted at once).
   Measure it; if the first paint moves by more than a frame, keep the
   startup-path CSS inline (the shell, the Home banner) and move the rest.
   After the first visit the service worker has it.
   **Built 2026-10-21; measured** (`tests/tools/first-paint.cjs`: each
   version served the way Vercel does, brotli and ETag, Chromium's network
   throttling, iPhone size, CPU 4x, medians; "first paint" is the first
   thing drawn, "Home" the first `ih:home-paint`):

   | Network, visit | First paint, before -> after | Home on screen, before -> after |
   |---|---|---|
   | Weak Wi-Fi (150 ms, 1.6 Mbps), first visit (5 runs) | 1788 -> 2116 ms (+328) | 5497 -> 5195 ms (-302) |
   | Weak Wi-Fi, return visit | 1736 -> 2060 ms (+324) | 4819 -> 4467 ms (-352) |
   | 4G (60 ms, 9 Mbps), first visit (9 runs) | 604 -> 668 ms (+64) | 1871 -> 1836 ms (-35) |
   | 4G, return visit | 540 -> 584 ms (+44) | 1138 -> 1228 ms (+90) |

   So the trade is real: the first paint (the top bar and background) comes
   later, by a third of a second on weak Wi-Fi, because it now waits for
   `app.css` (78 KB compressed) where the inline block arrived with the
   page's first bytes; Home itself comes about as much sooner there,
   because the page it waits for is 467 KB smaller. On 4G both moves are
   under 0.1 s. Looks: every element's computed style and box on 30
   screens and sheets x phone/computer x light/dark
   (`tests/tools/style-proof.cjs`) differ only where two runs of the old
   version differ from each other (chat timestamps, the tab bar's moving
   lens, Home text under a sheet). Jose's call (below).
2. **Data out, one constant per PR**, biggest first: `GUIDE_TOPICS` (the
   guide is opened on purpose, never at startup), `SEED_QUESTIONS`,
   `FALSE_FRIENDS`, `DOMAIN_ICONS` (check: are the icons needed for the first
   paint of Home? if so, it stays). Each becomes a JSON file under its
   feature's folder (`guide/topics.json` like `memory/lines.json`), fetched
   when the feature opens, precached by `sw.js`. Proof: the parsed JSON
   deep-equals the old literal (a one-time check in the PR), the feature's
   suite passes, and it opens offline in the suite's offline case.
   `DEFAULT_DATA` (the glossary's seed) stays: Home paints from it.
   **`GUIDE_TOPICS` done 2026-10-21, differently** (Jose's pick): the
   premise was wrong, the answers are read at startup (Home's User Guide
   tile counts them, global search and Ask the Hub search them, the deep
   link opens one), so fetching them on demand would mean async plumbing in
   eight places for ~16 KB compressed. Instead `guide/topics.js`: plain
   data with `GUIDE_SECTIONS`, loaded by a `<script src>` just before the
   app's script, so nothing reading them changes. Proof: both lists
   JSON-identical in the browser before and after (55,407 chars), Home's
   tile still 66, `Object.keys(window)` unchanged. Measured (first-paint,
   5 runs): weak Wi-Fi first paint +80-100 ms (the extra file's bytes
   arrive with `app.css`; `fetchpriority="low"` made no difference), Home
   -10 to -135 ms; 4G first paint -16/0 ms, Home -6/-147 ms. The other
   constants: same approach (a plain script) unless one is truly read only
   when its feature opens; check every reader first, as here.
   **`SEED_QUESTIONS` done 2026-10-21**, with `CCHI_DOMAINS`, the same way:
   `practice/questions.js` (Home's Practice tile counts them at startup and
   the Daily Drill draws from them). Proof: both lists JSON-identical in
   the browser (42,906 chars, 100 questions), the tile's count unchanged,
   globals unchanged.
   **`FALSE_FRIENDS` done 2026-10-22**, the same way: `falsefriends/list.js`
   (Home's tile counts it; search, Ask, Term Review and the Daily Drill
   read it). `ETHICS_CONTENT`, which shared its section, stays in
   `index.html` under its own banner ("Code of Ethics", 7 KB). Proof:
   JSON-identical in the browser (41,697 chars with the ethics list), the
   tile still 101, globals unchanged. Next: `DOMAIN_ICONS` (used at
   Home's first paint) or phase 3.
   **Phase 3 started 2026-10-22 with Translate** (Jose's pick):
   `features/translate.js`, the section verbatim. Every top-level statement
   in it is a declaration (a constant list, `let`s with literal values,
   functions), so it loads before `index.html`'s script with nothing to
   run; its uses of `index.html`'s names happen inside functions, at call
   time. Proof: the old inline script's tokens equal the new one's with
   the file's tokens put back where they were (224,803); the Translate
   screen, a translation and the language swap read identically before and
   after; `Object.keys(window)` unchanged. The harness serves any
   `features/*.js`, and `sw.js` fetches them network-first. **The check for
   the next feature**: list its top-level statements (acorn) and confirm
   none runs code that touches `index.html` names at load; if one does,
   that feature needs a different place (after the main script) or stays.
   **3D Body done 2026-10-22**: `features/3d-body.js`. Its two load-time
   lines add listeners (window `resize`, `message`); moving them first
   changes their order only against three earlier resize listeners that act
   on other screens (chat, the photo viewer, the guide's tips), so nothing
   depends on it. Proof: tokens identical when put back (222,943); in the
   browser, phone and computer, the frame, its sandbox and referrer policy,
   `--anat-top` before and after a resize, a forged message ignored, the
   frame gone on leaving, globals: all identical.
   **Looking a term up done 2026-10-23**: `features/term-lookup.js`,
   declarations only. Proof: tokens identical when put back (220,786); a
   lookup, its sheet and links, closing it and reopening from the cache read
   identically before and after, globals unchanged.
   **Voice and mic check done 2026-10-23**: `features/voice-check.js`,
   declarations only; `audioMode` in it is called by the memory trainer at
   run time. Proof: tokens identical when put back (216,614 + 2,698); the
   More button, the sheet, its report and closing read identically before
   and after (phone and computer), globals unchanged.
   **Dr. Smiley's performances done 2026-10-24**:
   `features/smiley-performances.js`. Not declarations only: its top level
   fills `DR_PERF` (bounce, wince, wow, celebrate) and sets `drPerfRand`,
   which touch nothing in `index.html`, but one line puts each performance
   into `DR_FACE_SEQ` (Dr. Smiley's art, defined earlier in `index.html`),
   so that line stays where it was (Jose's pick). Proof: the old
   `index.html` rebuilt byte for byte from the file and the kept line; in
   the browser, phone and computer, every performance built with seeds 1,
   7, 42 (direct and through `DR_FACE_SEQ`), the table's keys, the squash
   and effect constants and globals: identical, no page errors.
   **The campus done 2026-10-24**: `features/campus.js` (the section
   "Your HUMC campus (CoreCHI Practice)": `CAMPUS_MAP`, `CAMPUS`,
   `renderCampus`, the pick). Its top level is literals and functions plus
   one `document` keydown listener (Escape clears a pick), which now
   registers before the five `document` keydown listeners that
   `index.html` adds at load (Team Chat's pinned strip, the photo viewer,
   Cmd/Ctrl-K, the promo theatre, the guide coach). None of them stops the
   event or touches the campus, so the order changes nothing; the listener
   moved with the section. `campusLife` and `campusDepth` were never in it
   (they are in "Practice dashboard motion", still inline). Proof: the old
   `index.html` rebuilt byte for byte; in the browser, phone and computer,
   the campus card's markup (inline styles aside, which the motion moves),
   `CAMPUS_MAP`, `CAMPUS`, `campusLevel`'s rounding, a pick then Escape,
   and globals: identical, no page errors.
   **Load-time listeners**: a `features/` file's listener can fire before
   `index.html`'s script has run (the 3D Body's resize did, 2026-10-24).
   It must not read `index.html`'s names then, or must guard them
   (`typeof`). `tests/suites/load-order.cjs` checks the gap.
   **False Friends' screen done 2026-10-24**: `features/false-friends.js`,
   declarations only. The census's "False Friends" section (22 KB) was in
   fact two: the False Friends screen (10 KB) and, with no banner between,
   the Practice screen (`renderPractice`, `startStudy`, the exam timer,
   the weekly board). Only the first moved; the second stays inline under
   a new banner, "CoreCHI practice: the screen, studying, the exam timer".
   Proof: the old `index.html` rebuilt byte for byte; in the browser,
   phone and computer, False Friends' Study, Drill and an answered
   question, the Practice screen (a timestamp aside) and globals:
   identical, no page errors.
   **Your knowledge brain done 2026-10-24**: `features/knowledge-brain.js`
   (the Hub's side: `knowledgeBrainData`, the record, `kbMiniHtml`),
   declarations only. Proof: the old `index.html` rebuilt byte for byte;
   in the browser, `knowledgeBrainData`, `kbMiniHtml`, the Practice screen
   and globals identical; humc-brain's knowledge-brain checks (the record
   lighting it, the Practice tile, the small brain on Term Review, a
   session lighting up) read the same before and after.
   **The guide's front page done 2026-10-24**: `features/guide-front.js`
   ("The guide: installing, the front page": `renderUserGuide`, search,
   the install steps), declarations only. Proof: the old `index.html`
   rebuilt byte for byte; in the browser, the whole front page, four
   searches, every section and the install steps for each platform
   identical, globals unchanged; guide.cjs passes on both.
   **The doctor sheets done 2026-10-25**: `features/doctor-sheets.js`
   ("Doctor and provider sheets: places" and "Doctor directory: the add
   and edit sheet", side by side, one feature), declarations only. Proof:
   the old `index.html` rebuilt byte for byte; in the browser, phone and
   computer, the add sheet, the place picker, adding a place, a pick, the
   saved doctor, the edit sheet and globals identical, no page errors;
   provider-where.cjs and doctor-page.cjs on both.
   **CSV done 2026-10-25**: `features/csv.js` ("CSV export / import":
   `exportTermsCsv`, `parseCsv`, the staged import), declarations only.
   Proof: the old `index.html` rebuilt byte for byte; in the browser, phone
   and computer, the exported file, parsing it, an edited file's import
   preview (1 new, 1 updated), the saved term and globals identical, no
   page errors. No suite covers CSV.
   **Duplicate doctors done 2026-10-25**: `features/duplicate-doctors.js`
   (`duplicateDoctorGroups`, the merge, `duplicateBannerHtml`),
   declarations only. Proof: the old `index.html` rebuilt byte for byte;
   in the browser, phone and computer, name parsing, the groups, the
   banner, a merge's preview and the directory after it identical (but
   the random id of the moved note), no page errors; doctor-page.cjs
   (its tidy sheet) on both.
   **The terminology backfill done 2026-10-25**: `features/backfill.js`
   (`tierBackfill`, `runTierBackfill`, `backfillBannerHtml`), declarations
   only. Proof: the old `index.html` rebuilt byte for byte; in the
   browser, phone and computer, which doctors need it, the banner and the
   tidy sheet, a run whose research fails and one that works (both doctors
   saved with tiers, then "Everything is already up to date") identical,
   globals unchanged, no page errors. No suite covers it. The last of the
   small leaves; what's left are the groups.
   **The Ask the Hub group done 2026-10-25** (Jose's pick, after a
   written plan): all seven sections (Ask the Hub, following a
   conversation, context and actions, what he remembers, your practice and
   the next step, the memory screen, corrections, feedback and sources;
   125 KB) into one file, `features/ask-hub.js`. One file, not two:
   `ASK`'s initializer calls `askConvoEmpty` from another of the seven, so
   two files would only work in one load order. Lines that stay in
   `index.html` where the group began: `ASK_STOP` (built at load with
   `foldText`, found when the first probe saw the whole file fail to
   load; a static scan had missed the arrow inside `.map`), the waiting
   questions brought back and resumed (`askRestoreWaiting`,
   `hubAuthReady`), the `online` and `resize` listeners (they read
   `activeCategory`; load-order.cjs's gap) and `window.openAskHub`. The
   file was run in a bare sandbox to prove it reads no outside name at
   load. Proof: the old `index.html` rebuilt byte for byte; a probe in
   both checkouts, phone and computer, 78 readings identical: asking, a
   failed answer, the patient-info stop (edit, send anyway), Helpful,
   Correct this sent, a source opened, Add as term, the owner's review
   approving a note, the memory screen (set, forget), every one of the 17
   action types (open_term, look_up, start_review, continue_review,
   open_prep and keep_lang succeeding; the rest refusing for real
   reasons), a question left waiting brought back and answered after a
   reload, the panel's fit; globals unchanged, no page errors. journey.cjs
   and guide.cjs cover the rest; all suites pass. HUMC Brain's page broke
   on its now-empty Ask region (`claim` asked for 0 spots took them all;
   humc-brain.cjs caught it): `claim` now returns none for 0. First paint
   (first-paint.cjs, 5 runs): slow network Home painted 4925 to 4702 ms,
   4g 1660 to 1594 ms; within noise. `index.html` 1.15 MB to 1.02 MB.
   Live b1025.1947 (#154).
   **Plan: Dr. Smiley's engine group** (written 2026-10-25, no code yet).
   Four sections side by side, lines 6642-7771 on b1025.1947, about 62 KB
   (his performances already left in #137): his art (`drSmileyArt`,
   `DR_FACE_SEQ`), the animation engine (`DrAnim`, `drAnim`,
   `drFacePlay`/`drFaceIdle`), "how lively" (`drMode`, `drStill`,
   `setSmileyMode`) and his task states (`drTask`, `drMind`,
   `drPerform`). One file, `features/smiley-engine.js`, loaded after
   `features/smiley-performances.js`: the one load-time outside read is
   `DR_PERF` (a bare `vm` sandbox run of the four sections), so the line
   that puts the performances into `DR_FACE_SEQ`, kept in `index.html` by
   #137, comes into the new file. Called from 10 `index.html` sections
   (Dr. Smiley reacts, companion, Team access, Term Review's practice,
   the companion panel, the memory trainer, Home screen's `ICON_WAVE`,
   the smoothness meter, Appointment mode, the markup's
   `setSmileyMode`) and from `home-polish.js`, `features/ask-hub.js`,
   `features/smiley-performances.js`, `features/campus.js`, all at call
   time. Runs at load: the `DR_FACE_SEQ` line, `class DrAnim`, a
   `visibilitychange` listener (own names only), `drReduce`'s `change`
   listener and the `ds-still` class (both reach `smileyModeSync` /
   `fmNote` in `index.html` only when called), and the `offline` /
   `online` listeners (`drMindChanged` reaches `apptActive`). Those last
   two listeners and `drReduce`'s stay in `index.html` where the group
   began (load-order.cjs's gap); the `ds-still` toggle moves, since
   `drStill` reads only its own names (sandbox). It draws Home's first
   paint, so first-paint.cjs before and after decides it; the iPhone
   entrance freeze (`docs/features/dr-smiley.md`) has to hold. Covered
   far better than Ask: smiley-gaze, smiley-brows, smiley-gestures,
   smiley-squash, smiley-quiz, home-rest, dock-tuck, journey,
   memory-trainer, frame-meter. HUMC Brain's motor strip would empty
   except the five later Smiley sections (reacts, career, news,
   companion, panel), which stay.
3. **JS by feature, one file per PR**, leaves first (the census says which:
   sections whose names few others use). Candidates from the sizes alone:
   Dr. Smiley's engine (`DrAnim` 25 KB with `DR_FACE_SEQ`, `DR_PERF`,
   `DR_BROWS`), the memory trainer, the campus (`renderCampus`,
   `campusLife`, `campusDepth`), the User Guide, Team Chat. Each file is
   the section's text, verbatim, loaded by `<script src>` at the place the
   section had, so order and globals don't change. The proof is the
   globals check and the suites; a section whose names are used by many
   others moves last or not at all.
4. **What stays inline:** the shell markup, the startup path (what runs
   before Home's first paint: the cache-first glossary load, `render`,
   `renderHome`, the Firebase bootstrap) and anything the census shows
   everyone uses. `index.html` ends up as the page plus the core, with the
   features beside it.

## The census (phase 0)

`node tests/tools/census.cjs` (from the repo root or `tests/`; under a
second): `--names` lists every top-level name with its line, section and
who uses it, `--section <title>` shows one section's ins and outs, `--json`
everything, `--write` refreshes the table below. Line numbers drift every
day; rerun `--write` before choosing a move, never trust an old table.

How it counts: a section starts at a banner comment outside any code
(`/* ============ X ============ */` or `/* ---------- X ---------- */`;
the four-dash `/* ---- x ---- */` are sub-headings). A use is a top-level
name read, written or called from another section, in code (a local name
that hides it doesn't count) or in an `on...=""` handler, in the markup or
in a string the script writes into the page. Not seen: `window[name]` and
other lookups by a computed name, and the order things run in (a moved file
loaded at the same place keeps the order, so the census needn't).

**What it says (2026-10-21).**
- **The shared core is small.** The ten sections that 25 or more others use
  add up to about 60 KB: `State`, the two "Small helpers" sections,
  `Utilities`, the Firebase loader, the icons (19 KB), the two "Shared
  state" blocks, the name sheet, and navigation. They stay inline (phase 4)
  and load first.
- **Leaves, the first moves for phase 3** (5 KB or more, used by at most 3
  other sections): Following a conversation 20 KB (3 users, all Ask the
  Hub), the campus 19 KB (2), Dr. Smiley's performances 16 KB (3), Voice and
  mic check 12 KB (3), Translate lookup 12 KB (1), 3D Body 11 KB (3),
  Looking a term up 10 KB (3), then a tail of 5-8 KB ones (doctor sheets,
  CSV, duplicates, backfill). Split dock 21 KB, Home screen 13 KB and
  Loading the glossary 7 KB are leaves too, but they run before Home's
  first paint, so they stay inline (phase 4).
- **Features that move as a group**, since they mostly use each other: Ask
  the Hub with Dr. Smiley's conversation, context and memory sections (7
  sections, about 125 KB); Dr. Smiley's art, engine, performances, "how
  lively" and task states (5 sections, about 78 KB; 12 sections call his
  task states, so they move together or not at all).
- **The data constants are as large as the plan said** and used by few:
  `GUIDE_TOPICS` (section "The guide", 74 KB, 12 users), `FALSE_FRIENDS` 44
  KB (11), the CoreCHI bank 44 KB (8). Phase 2 stands as written.

<!-- census:start -->
Census of `index.html`: 3 inline scripts, 95 sections, 1330 top-level names (`tests/tools/census.cjs`). The markup's own on... handlers use 54 names from 24 sections.

| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |
|---|---|---|---|---|---|---|
| 1 | Dark mode before the first paint | 4-12 | 0.3 | 0 | 0 / 0 | 0 / 0 |
| 2 | Firebase: config, and the SDK loading in the background | 566-622 | 2.6 | 6 | 0 / 0 | 34 / 43 |
| 3 | Seed data (from the shared reference doc) | 643-734 | 8.3 | 2 | 0 / 0 | 1 / 1 |
| 4 | State | 735-750 | 0.8 | 8 | 0 / 0 | 53 / 75 |
| 5 | Location grouping | 751-827 | 5.0 | 7 | 0 / 0 | 5 / 15 |
| 6 | Regions | 828-907 | 3.8 | 14 | 11 / 16 | 11 / 25 |
| 7 | Places (shared) | 908-1061 | 7.3 | 16 | 13 / 17 | 6 / 11 |
| 8 | Collapsible groups: doctors by place, domains by parent | 1062-1158 | 4.4 | 11 | 8 / 13 | 6 / 14 |
| 9 | Your name on this phone | 1159-1172 | 0.7 | 2 | 0 / 0 | 4 / 4 |
| 10 | Team members' faces | 1173-1324 | 6.5 | 15 | 7 / 8 | 6 / 14 |
| 11 | Shared state: search, editing, providers, quiz | 1325-1350 | 1.0 | 23 | 0 / 0 | 22 / 57 |
| 12 | Practice record: what you personally know, question by question | 1351-1641 | 12 | 30 | 6 / 6 | 4 / 25 |
| 13 | Shared state: Term Review, domains, chat, events, activity | 1642-1791 | 6.9 | 62 | 2 / 5 | 30 / 110 |
| 14 | First-run onboarding | 1792-1875 | 3.6 | 12 | 5 / 5 | 7 / 15 |
| 15 | Storage | 1876-1900 | 0.9 | 2 | 0 / 0 | 13 / 16 |
| 16 | Loading the glossary | 1901-2100 | 6.9 | 2 | 8 / 12 | 1 / 1 |
| 17 | Slang domains | 2101-2197 | 6.4 | 20 | 3 / 4 | 4 / 19 |
| 18 | Domain fields and the first seeding | 2198-2235 | 1.6 | 2 | 2 / 3 | 2 / 2 |
| 19 | Local glossary cache | 2236-2405 | 7.0 | 15 | 9 / 12 | 5 / 9 |
| 20 | Recently deleted | 2406-2542 | 5.0 | 9 | 15 / 19 | 6 / 11 |
| 21 | Healthcare Providers | 2543-2657 | 5.3 | 8 | 10 / 13 | 9 / 13 |
| 22 | Doctor Directory | 2658-2803 | 7.3 | 13 | 12 / 15 | 7 / 11 |
| 23 | Team Chat | 2804-2878 | 3.4 | 3 | 10 / 21 | 5 / 5 |
| 24 | Recent Updates (activity log) | 2879-2897 | 0.7 | 1 | 3 / 3 | 13 / 13 |
| 25 | Announcements | 2898-2949 | 2.0 | 6 | 8 / 10 | 4 / 6 |
| 26 | Team Chat panel: pinned strip, typing box, drop | 2950-3076 | 6.8 | 9 | 10 / 15 | 10 / 22 |
| 27 | Recent Updates: the feed | 3077-3166 | 3.8 | 5 | 12 / 19 | 2 / 2 |
| 28 | Attachments (terms, chat, notes) | 3167-3491 | 15 | 22 | 14 / 21 | 8 / 12 |
| 29 | Utilities | 3492-3568 | 3.0 | 4 | 3 / 3 | 43 / 50 |
| 30 | Photo viewer | 3569-3911 | 17 | 15 | 3 / 5 | 6 / 8 |
| 31 | Deleting chat messages and activity entries | 3912-3970 | 2.6 | 5 | 4 / 6 | 7 / 9 |
| 32 | Accent-insensitive search | 3971-4007 | 1.6 | 3 | 0 / 0 | 11 / 11 |
| 33 | Team-contributed practice questions | 4008-4062 | 2.2 | 4 | 9 / 10 | 3 / 4 |
| 34 | Chat notifications | 4063-4219 | 5.6 | 12 | 9 / 13 | 6 / 14 |
| 35 | Notifications that reach a closed phone (Web Push) | 4220-4538 | 18 | 27 | 11 / 22 | 6 / 8 |
| 36 | Typing presence | 4539-4712 | 7.1 | 14 | 7 / 12 | 6 / 12 |
| 37 | Global search | 4713-4949 | 8.8 | 12 | 13 / 22 | 5 / 8 |
| 38 | Training & Events | 4950-5083 | 5.4 | 8 | 13 / 26 | 3 / 4 |
| 39 | Small helpers: save errors, toasts, colours, tile lists | 5084-5249 | 9.6 | 12 | 8 / 15 | 45 / 82 |
| 40 | Term Review: Dr. Smiley's practice sessions | 5250-5713 | 30 | 42 | 14 / 28 | 2 / 6 |
| 41 | The guide: search, answer sheets, Show me | 5714-6215 | 34 | 46 | 12 / 17 | 5 / 9 |
| 42 | Doctor Prep: research | 6216-6608 | 18 | 23 | 17 / 23 | 5 / 15 |
| 43 | Small helpers: tile colours, escaping, links | 6609-6657 | 2.4 | 4 | 0 / 0 | 48 / 84 |
| 44 | Icons (inline SVG) | 6658-6738 | 19 | 59 | 0 / 0 | 32 / 116 |
| 45 | Code of Ethics | 6739-6785 | 4.8 | 1 | 0 / 0 | 3 / 3 |
| 46 | Domain icons and link lists | 6786-6845 | 19 | 2 | 4 / 6 | 8 / 8 |
| 47 | Term card menu (phones) | 6846-6930 | 4.5 | 5 | 7 / 9 | 1 / 1 |
| 48 | Rendering | 6931-7021 | 3.8 | 9 | 1 / 1 | 8 / 8 |
| 49 | Domain banner and its ⋯ menu | 7022-7290 | 13 | 9 | 21 / 36 | 16 / 16 |
| 50 | Offline outbox | 7291-7568 | 10 | 25 | 5 / 6 | 12 / 31 |
| 51 | Unsent changes sheet | 7569-7806 | 11 | 15 | 7 / 16 | 9 / 16 |
| 52 | Sync status and the top bar | 7807-7975 | 7.9 | 8 | 11 / 17 | 12 / 13 |
| 53 | The screen: renderContent | 7976-8543 | 28 | 15 | 44 / 113 | 20 / 21 |
| 54 | Theme, navigation and overlays | 8544-8667 | 6.5 | 5 | 13 / 24 | 23 / 26 |
| 55 | Opening one particular term | 8668-8719 | 2.3 | 2 | 7 / 12 | 1 / 1 |
| 56 | Subdomain folder | 8720-8853 | 6.0 | 4 | 4 / 5 | 1 / 1 |
| 57 | Going Home and going back | 8854-8926 | 3.6 | 3 | 5 / 8 | 3 / 4 |
| 58 | Your name and photo (the name sheet) | 8927-9123 | 8.4 | 15 | 17 / 30 | 24 / 32 |
| 59 | CoreCHI practice | 9124-9194 | 2.6 | 4 | 1 / 1 | 5 / 11 |
| 60 | CoreCHI practice: the screen, studying, the exam timer | 9195-9448 | 12 | 7 | 14 / 60 | 3 / 5 |
| 61 | Practice dashboard tiles | 9449-9580 | 7.2 | 12 | 5 / 6 | 2 / 4 |
| 62 | Practice dashboard motion | 9581-9792 | 15 | 12 | 3 / 4 | 4 / 6 |
| 63 | Quiz | 9793-10294 | 21 | 23 | 18 / 43 | 7 / 15 |
| 64 | Quiz celebrations | 10295-10349 | 2.5 | 3 | 1 / 1 | 8 / 8 |
| 65 | Live relative time | 10350-10425 | 3.2 | 4 | 2 / 3 | 8 / 8 |
| 66 | Multilingual greeting | 10426-10588 | 8.9 | 11 | 4 / 5 | 5 / 8 |
| 67 | Smoothness meter | 10589-10871 | 17 | 31 | 5 / 8 | 11 / 11 |
| 68 | Memory trainer | 10872-11607 | 43 | 87 | 21 / 33 | 6 / 10 |
| 69 | Split dock (phones) | 11608-11989 | 21 | 16 | 3 / 3 | 2 / 3 |
| 70 | Tab bar and the More sheet | 11990-12042 | 3.1 | 3 | 9 / 19 | 3 / 3 |
| 71 | Home screen | 12043-12250 | 13 | 8 | 15 / 24 | 2 / 2 |
| 72 | Lists: providers, recently deleted, doctors hub | 12251-12366 | 5.8 | 3 | 12 / 24 | 1 / 3 |
| 73 | Doctor list (the directory) | 12367-12584 | 11 | 20 | 19 / 40 | 5 / 9 |
| 74 | Doctor page | 12585-12775 | 8.1 | 22 | 13 / 21 | 5 / 21 |
| 75 | Team tips (D2) | 12776-13123 | 19 | 19 | 25 / 61 | 5 / 10 |
| 76 | Team Chat: rendering + sending | 13124-13260 | 6.4 | 18 | 4 / 4 | 5 / 24 |
| 77 | Titles under names (Team Chat) | 13261-13347 | 4.7 | 12 | 6 / 8 | 3 / 3 |
| 78 | Team Chat: messages, channels, scrolling | 13348-13804 | 23 | 18 | 19 / 76 | 11 / 18 |
| 79 | Message interactions | 13805-14327 | 25 | 23 | 18 / 40 | 4 / 15 |
| 80 | Add / Edit / Delete | 14328-14508 | 8.4 | 11 | 13 / 15 | 8 / 11 |
| 81 | Term check — a second look after saving | 14509-14671 | 6.2 | 12 | 12 / 15 | 4 / 5 |
| 82 | Add / delete domain | 14672-14856 | 8.2 | 13 | 10 / 17 | 4 / 6 |
| 83 | Healthcare Providers: modal + photo handling | 14857-15026 | 6.4 | 10 | 14 / 21 | 3 / 7 |
| 84 | Team access | 15027-15696 | 34 | 60 | 17 / 30 | 16 / 24 |
| 85 | Appointment mode | 15697-15816 | 7.3 | 17 | 10 / 14 | 6 / 10 |
| 86 | Dr. Smiley reacts | 15817-15948 | 6.9 | 12 | 0 / 0 | 8 / 10 |
| 87 | Daily Drill (the warm-up on Home) | 15949-16375 | 28 | 51 | 11 / 19 | 4 / 6 |
| 88 | Dr. Smiley's career | 16376-16554 | 12 | 20 | 7 / 9 | 9 / 10 |
| 89 | Appointment prep | 16555-16807 | 18 | 26 | 16 / 25 | 4 / 9 |
| 90 | Dr. Smiley's news | 16808-16860 | 3.1 | 1 | 6 / 9 | 0 / 0 |
| 91 | Dr. Smiley companion | 16861-17048 | 9.9 | 6 | 5 / 6 | 5 / 7 |
| 92 | Dr. Smiley: the companion panel | 17049-17367 | 19 | 2 | 5 / 6 | 2 / 2 |
| 93 | Init | 17368-17457 | 3.7 | 0 | 25 / 29 | 0 / 0 |
| 94 | Phone chrome, dialogs and the on-screen keyboard | 17458-17559 | 4.5 | 0 | 0 / 0 | 0 / 0 |
| 95 | Install / offline support | 17560-17593 | 1.5 | 0 | 1 / 1 | 0 / 0 |
<!-- census:end -->

## What this costs and buys

Each move is a day's PR with the same proof. It buys: a diff a person can
read (a feature's change touches its file), fewer merge conflicts between
chats (today every PR touches `index.html`), and a smaller first download
once the data and the guide are lazy. It does not buy speed by itself: the
startup work is the same code; S3's numbers are the guard, not the goal.

## Decisions for Jose

- When to start: **after the open PRs merge** (Jose, 2026-10-20), then one
  move at a time with nothing else in flight, since each move is a
  merge-conflict magnet for a day.
- Phase 1's trade: a file for the CSS (clean) against the possible one-frame
  later first paint on a cold visit. The measurement decides; his call if
  it is close.
