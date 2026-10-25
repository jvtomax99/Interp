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
Census of `index.html`: 3 inline scripts, 109 sections, 1583 top-level names (`tests/tools/census.cjs`). The markup's own on... handlers use 59 names from 27 sections.

| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |
|---|---|---|---|---|---|---|
| 1 | Dark mode before the first paint | 4-12 | 0.3 | 0 | 0 / 0 | 0 / 0 |
| 2 | Firebase: config, and the SDK loading in the background | 566-622 | 2.6 | 6 | 0 / 0 | 40 / 49 |
| 3 | Seed data (from the shared reference doc) | 638-729 | 8.3 | 2 | 0 / 0 | 1 / 1 |
| 4 | State | 730-745 | 0.8 | 8 | 0 / 0 | 61 / 86 |
| 5 | Location grouping | 746-822 | 5.0 | 7 | 0 / 0 | 6 / 16 |
| 6 | Regions | 823-902 | 3.8 | 14 | 11 / 16 | 12 / 26 |
| 7 | Places (shared) | 903-1056 | 7.3 | 16 | 13 / 17 | 6 / 11 |
| 8 | Collapsible groups: doctors by place, domains by parent | 1057-1153 | 4.4 | 11 | 8 / 13 | 6 / 14 |
| 9 | Your name on this phone | 1154-1167 | 0.7 | 2 | 0 / 0 | 4 / 4 |
| 10 | Team members' faces | 1168-1319 | 6.5 | 15 | 7 / 8 | 6 / 14 |
| 11 | Shared state: search, editing, providers, quiz | 1320-1345 | 1.0 | 23 | 0 / 0 | 27 / 66 |
| 12 | Practice record: what you personally know, question by question | 1346-1636 | 12 | 30 | 6 / 6 | 4 / 25 |
| 13 | Shared state: Term Review, domains, chat, events, activity | 1637-1786 | 6.9 | 62 | 2 / 5 | 34 / 121 |
| 14 | First-run onboarding | 1787-1870 | 3.6 | 12 | 5 / 5 | 7 / 15 |
| 15 | Storage | 1871-1892 | 0.8 | 2 | 0 / 0 | 15 / 19 |
| 16 | CSV export / import | 1893-2050 | 6.5 | 9 | 11 / 15 | 2 / 5 |
| 17 | Loading the glossary | 2051-2250 | 6.9 | 2 | 8 / 12 | 1 / 1 |
| 18 | Slang domains | 2251-2347 | 6.4 | 20 | 3 / 4 | 4 / 19 |
| 19 | Domain fields and the first seeding | 2348-2385 | 1.6 | 2 | 2 / 3 | 2 / 2 |
| 20 | Local glossary cache | 2386-2555 | 7.0 | 15 | 9 / 12 | 6 / 10 |
| 21 | Recently deleted | 2556-2692 | 5.0 | 9 | 15 / 19 | 7 / 12 |
| 22 | Healthcare Providers | 2693-2807 | 5.3 | 8 | 10 / 13 | 10 / 14 |
| 23 | Doctor Directory | 2808-2953 | 7.3 | 13 | 12 / 15 | 9 / 14 |
| 24 | Team Chat | 2954-3028 | 3.4 | 3 | 10 / 21 | 5 / 5 |
| 25 | Recent Updates (activity log) | 3029-3047 | 0.7 | 1 | 3 / 3 | 16 / 16 |
| 26 | Announcements | 3048-3099 | 2.0 | 6 | 8 / 10 | 4 / 6 |
| 27 | Team Chat panel: pinned strip, typing box, drop | 3100-3226 | 6.8 | 9 | 10 / 15 | 10 / 22 |
| 28 | Recent Updates: the feed | 3227-3316 | 3.8 | 5 | 12 / 19 | 2 / 2 |
| 29 | Attachments (terms, chat, notes) | 3317-3641 | 15 | 22 | 14 / 21 | 8 / 12 |
| 30 | Utilities | 3642-3718 | 3.0 | 4 | 3 / 3 | 52 / 60 |
| 31 | Photo viewer | 3719-4061 | 17 | 15 | 3 / 5 | 6 / 8 |
| 32 | Deleting chat messages and activity entries | 4062-4120 | 2.6 | 5 | 4 / 6 | 7 / 9 |
| 33 | Accent-insensitive search | 4121-4157 | 1.6 | 3 | 0 / 0 | 14 / 14 |
| 34 | Team-contributed practice questions | 4158-4212 | 2.2 | 4 | 9 / 10 | 3 / 4 |
| 35 | Chat notifications | 4213-4369 | 5.6 | 12 | 9 / 13 | 6 / 14 |
| 36 | Notifications that reach a closed phone (Web Push) | 4370-4688 | 18 | 27 | 11 / 22 | 6 / 8 |
| 37 | Typing presence | 4689-4862 | 7.1 | 14 | 7 / 12 | 6 / 12 |
| 38 | Global search | 4863-5099 | 8.8 | 12 | 13 / 22 | 5 / 8 |
| 39 | Training & Events | 5100-5233 | 5.4 | 8 | 13 / 26 | 3 / 4 |
| 40 | Small helpers: save errors, toasts, colours, tile lists | 5234-5399 | 9.6 | 12 | 8 / 15 | 52 / 96 |
| 41 | Term Review: Dr. Smiley's practice sessions | 5400-5863 | 30 | 42 | 19 / 33 | 5 / 11 |
| 42 | The guide: search, answer sheets, Show me | 5864-6365 | 34 | 46 | 13 / 20 | 7 / 11 |
| 43 | Doctor Prep: research | 6366-6758 | 18 | 23 | 17 / 23 | 7 / 18 |
| 44 | Small helpers: tile colours, escaping, links | 6759-6792 | 1.7 | 4 | 0 / 0 | 56 / 97 |
| 45 | Dr. Smiley's art | 6793-6946 | 14 | 6 | 0 / 0 | 4 / 7 |
| 46 | Dr. Smiley: animation engine | 6947-7689 | 36 | 31 | 4 / 16 | 9 / 19 |
| 47 | Dr. Smiley: how lively (Lively, Focused, Still) | 7690-7726 | 1.8 | 7 | 3 / 5 | 7 / 14 |
| 48 | Dr. Smiley: what he's doing (task states) | 7727-7922 | 9.8 | 23 | 6 / 14 | 12 / 33 |
| 49 | Icons (inline SVG) | 7923-8003 | 19 | 59 | 0 / 0 | 34 / 119 |
| 50 | Code of Ethics | 8004-8050 | 4.8 | 1 | 0 / 0 | 4 / 4 |
| 51 | Domain icons and link lists | 8051-8110 | 19 | 2 | 4 / 6 | 8 / 8 |
| 52 | Term card menu (phones) | 8111-8195 | 4.5 | 5 | 8 / 11 | 1 / 1 |
| 53 | Rendering | 8196-8286 | 3.8 | 9 | 1 / 1 | 9 / 9 |
| 54 | Domain banner and its ⋯ menu | 8287-8555 | 13 | 9 | 22 / 38 | 18 / 18 |
| 55 | Offline outbox | 8556-8833 | 10 | 25 | 5 / 6 | 12 / 31 |
| 56 | Unsent changes sheet | 8834-9071 | 11 | 15 | 7 / 16 | 9 / 16 |
| 57 | Sync status and the top bar | 9072-9240 | 7.9 | 8 | 11 / 17 | 13 / 14 |
| 58 | The screen: renderContent | 9241-9808 | 28 | 15 | 48 / 120 | 24 / 25 |
| 59 | Theme, navigation and overlays | 9809-9932 | 6.5 | 5 | 14 / 25 | 25 / 28 |
| 60 | Opening one particular term | 9933-9984 | 2.3 | 2 | 7 / 12 | 3 / 3 |
| 61 | Subdomain folder | 9985-10118 | 6.0 | 4 | 4 / 5 | 1 / 1 |
| 62 | Going Home and going back | 10119-10191 | 3.6 | 3 | 5 / 8 | 3 / 4 |
| 63 | Your name and photo (the name sheet) | 10192-10388 | 8.4 | 15 | 18 / 31 | 29 / 37 |
| 64 | CoreCHI practice | 10389-10459 | 2.6 | 4 | 1 / 1 | 5 / 11 |
| 65 | CoreCHI practice: the screen, studying, the exam timer | 10460-10713 | 12 | 7 | 14 / 60 | 3 / 5 |
| 66 | Practice dashboard tiles | 10714-10845 | 7.2 | 12 | 5 / 6 | 2 / 4 |
| 67 | Practice dashboard motion | 10846-11057 | 15 | 12 | 3 / 4 | 4 / 6 |
| 68 | Quiz | 11058-11559 | 21 | 23 | 18 / 43 | 7 / 15 |
| 69 | Quiz celebrations | 11560-11614 | 2.5 | 3 | 1 / 1 | 8 / 8 |
| 70 | Live relative time | 11615-11690 | 3.2 | 4 | 2 / 3 | 8 / 8 |
| 71 | Multilingual greeting | 11691-11853 | 8.9 | 11 | 4 / 5 | 5 / 8 |
| 72 | Smoothness meter | 11854-12136 | 17 | 31 | 6 / 9 | 12 / 12 |
| 73 | Memory trainer | 12137-12872 | 43 | 87 | 22 / 35 | 6 / 10 |
| 74 | Split dock (phones) | 12873-13254 | 21 | 16 | 3 / 3 | 2 / 3 |
| 75 | Tab bar and the More sheet | 13255-13307 | 3.1 | 3 | 9 / 19 | 3 / 3 |
| 76 | Home screen | 13308-13515 | 13 | 8 | 16 / 25 | 2 / 2 |
| 77 | Lists: providers, recently deleted, doctors hub | 13516-13625 | 5.5 | 3 | 12 / 24 | 1 / 3 |
| 78 | Duplicate doctors | 13626-13777 | 6.2 | 7 | 16 / 17 | 1 / 2 |
| 79 | Terminology backfill | 13778-13921 | 6.1 | 7 | 10 / 11 | 1 / 3 |
| 80 | Doctor list (the directory) | 13922-14139 | 11 | 20 | 21 / 45 | 5 / 9 |
| 81 | Doctor page | 14140-14330 | 8.1 | 22 | 13 / 21 | 5 / 21 |
| 82 | Team tips (D2) | 14331-14678 | 19 | 19 | 25 / 61 | 7 / 12 |
| 83 | Team Chat: rendering + sending | 14679-14815 | 6.4 | 18 | 4 / 4 | 5 / 24 |
| 84 | Titles under names (Team Chat) | 14816-14902 | 4.7 | 12 | 6 / 8 | 3 / 3 |
| 85 | Team Chat: messages, channels, scrolling | 14903-15359 | 23 | 18 | 19 / 76 | 11 / 18 |
| 86 | Message interactions | 15360-15882 | 25 | 23 | 18 / 40 | 4 / 15 |
| 87 | Add / Edit / Delete | 15883-16063 | 8.4 | 11 | 13 / 15 | 9 / 12 |
| 88 | Term check — a second look after saving | 16064-16226 | 6.2 | 12 | 12 / 15 | 4 / 5 |
| 89 | Add / delete domain | 16227-16411 | 8.2 | 13 | 10 / 17 | 4 / 6 |
| 90 | Healthcare Providers: modal + photo handling | 16412-16581 | 6.4 | 10 | 14 / 21 | 3 / 7 |
| 91 | Team access | 16582-17229 | 32 | 58 | 19 / 35 | 18 / 30 |
| 92 | Ask the Hub | 17230-18041 | 47 | 55 | 26 / 88 | 13 / 47 |
| 93 | Dr. Smiley: following a conversation | 18042-18341 | 19 | 33 | 13 / 30 | 3 / 21 |
| 94 | Dr. Smiley: context and actions | 18342-18807 | 31 | 32 | 25 / 53 | 9 / 39 |
| 95 | Dr. Smiley: what he remembers (on this device) | 18808-18992 | 12 | 19 | 7 / 12 | 7 / 23 |
| 96 | Ask the Hub: your practice and the next step | 18993-19060 | 3.8 | 8 | 11 / 21 | 6 / 10 |
| 97 | Dr. Smiley's memory screen | 19061-19110 | 4.0 | 6 | 6 / 14 | 3 / 3 |
| 98 | Ask the Hub: corrections, feedback, sources | 19111-19264 | 7.6 | 12 | 16 / 23 | 5 / 15 |
| 99 | Appointment mode | 19265-19384 | 7.3 | 17 | 11 / 15 | 10 / 14 |
| 100 | Dr. Smiley reacts | 19385-19516 | 6.9 | 12 | 3 / 9 | 8 / 10 |
| 101 | Daily Drill (the warm-up on Home) | 19517-19943 | 28 | 51 | 11 / 19 | 6 / 8 |
| 102 | Dr. Smiley's career | 19944-20122 | 12 | 20 | 7 / 9 | 10 / 11 |
| 103 | Appointment prep | 20123-20375 | 18 | 26 | 17 / 26 | 8 / 18 |
| 104 | Dr. Smiley's news | 20376-20428 | 3.1 | 1 | 7 / 11 | 0 / 0 |
| 105 | Dr. Smiley companion | 20429-20616 | 9.9 | 6 | 9 / 14 | 7 / 9 |
| 106 | Dr. Smiley: the companion panel | 20617-20935 | 19 | 2 | 9 / 19 | 5 / 5 |
| 107 | Init | 20936-21025 | 3.7 | 0 | 26 / 30 | 0 / 0 |
| 108 | Phone chrome, dialogs and the on-screen keyboard | 21026-21127 | 4.5 | 0 | 0 / 0 | 0 / 0 |
| 109 | Install / offline support | 21128-21161 | 1.5 | 0 | 1 / 1 | 0 / 0 |
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
