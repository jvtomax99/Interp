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
Census of `index.html`: 3 inline scripts, 118 sections, 1726 top-level names (`tests/tools/census.cjs`). The markup's own on... handlers use 69 names from 31 sections.

| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |
|---|---|---|---|---|---|---|
| 1 | Dark mode before the first paint | 4-12 | 0.3 | 0 | 0 / 0 | 0 / 0 |
| 2 | Firebase: config, and the SDK loading in the background | 7891-7947 | 2.6 | 6 | 0 / 0 | 41 / 49 |
| 3 | Seed data (from the shared reference doc) | 7950-8035 | 8.1 | 2 | 1 / 1 | 2 / 2 |
| 4 | Translate lookup | 8036-8301 | 12 | 14 | 10 / 18 | 1 / 3 |
| 5 | CoreCHI practice bank | 8302-8642 | 44 | 2 | 0 / 0 | 8 / 9 |
| 6 | State | 8643-8658 | 0.8 | 8 | 0 / 0 | 63 / 89 |
| 7 | Location grouping | 8659-8735 | 5.0 | 7 | 0 / 0 | 8 / 20 |
| 8 | Regions | 8736-8814 | 3.7 | 14 | 10 / 15 | 13 / 32 |
| 9 | Places (shared) | 8815-8968 | 7.3 | 16 | 14 / 18 | 7 / 15 |
| 10 | Collapsible groups: doctors by place, domains by parent | 8969-9065 | 4.4 | 11 | 8 / 13 | 8 / 17 |
| 11 | Your name on this phone | 9066-9079 | 0.7 | 2 | 0 / 0 | 4 / 4 |
| 12 | Team members' faces | 9080-9231 | 6.5 | 15 | 7 / 8 | 6 / 14 |
| 13 | Shared state: search, editing, providers, quiz | 9232-9257 | 1.0 | 23 | 0 / 0 | 29 / 71 |
| 14 | Practice record: what you personally know, question by question | 9258-9548 | 12 | 30 | 7 / 7 | 5 / 27 |
| 15 | Shared state: Term Review, domains, chat, events, activity | 9549-9698 | 6.9 | 62 | 2 / 5 | 34 / 121 |
| 16 | First-run onboarding | 9699-9782 | 3.6 | 12 | 5 / 5 | 8 / 16 |
| 17 | Storage | 9783-9804 | 0.8 | 2 | 0 / 0 | 16 / 20 |
| 18 | CSV export / import | 9805-9962 | 6.5 | 9 | 11 / 15 | 2 / 5 |
| 19 | Loading the glossary | 9963-10162 | 6.9 | 2 | 8 / 12 | 1 / 1 |
| 20 | Slang domains | 10163-10259 | 6.4 | 20 | 3 / 4 | 4 / 19 |
| 21 | Domain fields and the first seeding | 10260-10297 | 1.6 | 2 | 2 / 3 | 2 / 2 |
| 22 | Local glossary cache | 10298-10467 | 7.0 | 15 | 9 / 12 | 6 / 10 |
| 23 | Recently deleted | 10468-10604 | 5.0 | 9 | 15 / 19 | 8 / 14 |
| 24 | Healthcare Providers | 10605-10713 | 4.9 | 8 | 9 / 12 | 10 / 14 |
| 25 | Doctor Directory | 10714-10859 | 7.3 | 13 | 12 / 15 | 10 / 17 |
| 26 | Team Chat | 10860-10932 | 3.3 | 3 | 9 / 19 | 5 / 5 |
| 27 | Recent Updates (activity log) | 10933-10951 | 0.7 | 1 | 3 / 3 | 17 / 17 |
| 28 | Announcements | 10952-11003 | 2.0 | 6 | 8 / 10 | 4 / 6 |
| 29 | Team Chat panel: pinned strip, typing box, drop | 11004-11130 | 6.8 | 9 | 10 / 15 | 10 / 22 |
| 30 | Recent Updates: the feed | 11131-11220 | 3.8 | 5 | 12 / 19 | 2 / 2 |
| 31 | Attachments (terms, chat, notes) | 11221-11545 | 15 | 22 | 14 / 21 | 9 / 13 |
| 32 | Utilities | 11546-11622 | 3.0 | 4 | 3 / 3 | 55 / 64 |
| 33 | Photo viewer | 11623-11965 | 17 | 15 | 3 / 5 | 6 / 8 |
| 34 | Deleting chat messages and activity entries | 11966-12024 | 2.6 | 5 | 4 / 6 | 8 / 10 |
| 35 | Accent-insensitive search | 12025-12061 | 1.6 | 3 | 0 / 0 | 18 / 18 |
| 36 | Team-contributed practice questions | 12062-12116 | 2.2 | 4 | 10 / 11 | 3 / 4 |
| 37 | Chat notifications | 12117-12270 | 5.5 | 12 | 8 / 11 | 5 / 9 |
| 38 | Typing presence | 12271-12444 | 7.1 | 14 | 7 / 12 | 6 / 12 |
| 39 | Global search | 12445-12681 | 8.8 | 12 | 13 / 25 | 5 / 8 |
| 40 | Training & Events | 12682-12815 | 5.3 | 8 | 12 / 25 | 3 / 4 |
| 41 | Small helpers: save errors, toasts, colours, tile lists | 12816-12977 | 9.4 | 12 | 9 / 18 | 55 / 102 |
| 42 | Term Review: Dr. Smiley's practice sessions | 12978-13437 | 30 | 42 | 20 / 34 | 6 / 14 |
| 43 | The guide: search, answer sheets, Show me | 13438-13939 | 34 | 46 | 15 / 25 | 8 / 27 |
| 44 | Doctor Prep: research | 13940-14328 | 17 | 23 | 17 / 23 | 7 / 18 |
| 45 | The guide: installing, the front page | 14329-14552 | 11 | 17 | 7 / 29 | 2 / 5 |
| 46 | Small helpers: tile colours, escaping, links | 14553-14586 | 1.7 | 4 | 0 / 0 | 61 / 106 |
| 47 | Dr. Smiley's art | 14587-14734 | 14 | 6 | 0 / 0 | 6 / 9 |
| 48 | Dr. Smiley: performances | 14735-15013 | 16 | 15 | 2 / 3 | 3 / 7 |
| 49 | Dr. Smiley: animation engine | 15014-15756 | 36 | 31 | 5 / 21 | 9 / 19 |
| 50 | Dr. Smiley: how lively (Lively, Focused, Still) | 15757-15793 | 1.8 | 7 | 3 / 5 | 8 / 16 |
| 51 | Dr. Smiley: what he's doing (task states) | 15794-15989 | 9.8 | 23 | 6 / 14 | 12 / 33 |
| 52 | Icons (inline SVG) | 15990-16064 | 19 | 59 | 0 / 0 | 40 / 139 |
| 53 | 3D Body | 16065-16246 | 11 | 20 | 9 / 16 | 3 / 4 |
| 54 | False Friends (falsos amigos) | 16247-17131 | 44 | 2 | 0 / 0 | 11 / 14 |
| 55 | The guide | 17132-17683 | 74 | 4 | 5 / 7 | 12 / 17 |
| 56 | Term card menu (phones) | 17684-17768 | 4.5 | 5 | 8 / 11 | 1 / 1 |
| 57 | Rendering | 17769-17859 | 3.8 | 9 | 1 / 1 | 9 / 9 |
| 58 | Domain banner and its ⋯ menu | 17860-18126 | 13 | 9 | 23 / 39 | 20 / 20 |
| 59 | Offline outbox | 18127-18404 | 10 | 25 | 5 / 6 | 12 / 31 |
| 60 | Unsent changes sheet | 18405-18642 | 11 | 15 | 7 / 16 | 9 / 16 |
| 61 | Sync status and the top bar | 18643-18811 | 7.9 | 8 | 11 / 17 | 13 / 14 |
| 62 | The screen: renderContent | 18812-19374 | 28 | 15 | 49 / 125 | 24 / 25 |
| 63 | Theme, navigation and overlays | 19375-19498 | 6.5 | 5 | 14 / 25 | 26 / 29 |
| 64 | Opening one particular term | 19499-19547 | 2.3 | 2 | 7 / 12 | 4 / 4 |
| 65 | Looking a term up | 19548-19802 | 10 | 16 | 8 / 9 | 3 / 3 |
| 66 | Subdomain folder | 19803-19936 | 6.0 | 4 | 4 / 5 | 1 / 1 |
| 67 | Going Home and going back | 19937-20009 | 3.6 | 3 | 5 / 8 | 3 / 4 |
| 68 | Your name and photo (the name sheet) | 20010-20206 | 8.4 | 15 | 18 / 31 | 31 / 39 |
| 69 | CoreCHI practice | 20207-20274 | 2.5 | 4 | 2 / 3 | 6 / 12 |
| 70 | False Friends | 20275-20741 | 22 | 30 | 19 / 66 | 4 / 7 |
| 71 | Practice dashboard tiles | 20742-20870 | 7.1 | 12 | 5 / 6 | 2 / 4 |
| 72 | Your HUMC campus (CoreCHI Practice) | 20871-21018 | 19 | 12 | 8 / 12 | 2 / 3 |
| 73 | Practice dashboard motion | 21019-21230 | 15 | 12 | 4 / 5 | 4 / 6 |
| 74 | Quiz | 21231-21732 | 21 | 23 | 19 / 44 | 7 / 15 |
| 75 | Quiz celebrations | 21733-21787 | 2.5 | 3 | 1 / 1 | 9 / 9 |
| 76 | Live relative time | 21788-21863 | 3.2 | 4 | 2 / 3 | 8 / 8 |
| 77 | Multilingual greeting | 21864-22026 | 8.8 | 11 | 4 / 5 | 6 / 9 |
| 78 | Smoothness meter | 22027-22255 | 13 | 26 | 6 / 9 | 12 / 12 |
| 79 | Voice and mic check | 22256-22498 | 12 | 25 | 4 / 4 | 3 / 6 |
| 80 | Memory trainer | 22499-23234 | 43 | 87 | 24 / 40 | 6 / 10 |
| 81 | Split dock (phones) | 23235-23616 | 21 | 16 | 3 / 3 | 2 / 3 |
| 82 | Tab bar and the More sheet | 23617-23669 | 3.1 | 3 | 10 / 20 | 4 / 4 |
| 83 | Home screen | 23670-23877 | 13 | 8 | 16 / 25 | 2 / 2 |
| 84 | Lists: providers, recently deleted, doctors hub | 23878-23987 | 5.5 | 3 | 12 / 24 | 1 / 3 |
| 85 | Duplicate doctors | 23988-24139 | 6.2 | 7 | 16 / 17 | 1 / 2 |
| 86 | Terminology backfill | 24140-24283 | 6.1 | 7 | 10 / 11 | 1 / 3 |
| 87 | Doctor list (the directory) | 24284-24501 | 11 | 20 | 22 / 46 | 5 / 9 |
| 88 | Doctor page | 24502-24692 | 8.1 | 22 | 14 / 22 | 6 / 23 |
| 89 | Team tips (D2) | 24693-25040 | 19 | 19 | 25 / 61 | 7 / 12 |
| 90 | Team Chat: rendering + sending | 25041-25177 | 6.4 | 18 | 4 / 4 | 5 / 24 |
| 91 | Titles under names (Team Chat) | 25178-25264 | 4.7 | 12 | 6 / 8 | 3 / 3 |
| 92 | Team Chat: messages, channels, scrolling | 25265-25721 | 23 | 18 | 19 / 76 | 11 / 18 |
| 93 | Message interactions | 25722-26244 | 25 | 23 | 18 / 40 | 4 / 15 |
| 94 | Add / Edit / Delete | 26245-26425 | 8.4 | 11 | 13 / 15 | 10 / 13 |
| 95 | Term check — a second look after saving | 26426-26588 | 6.2 | 12 | 12 / 15 | 4 / 5 |
| 96 | Add / delete domain | 26589-26773 | 8.2 | 13 | 10 / 17 | 4 / 6 |
| 97 | Healthcare Providers: modal + photo handling | 26774-26938 | 6.2 | 10 | 15 / 23 | 3 / 7 |
| 98 | Doctor and provider sheets: places | 26939-27058 | 6.8 | 18 | 10 / 22 | 4 / 9 |
| 99 | Doctor directory: the add and edit sheet | 27059-27247 | 7.6 | 11 | 17 / 29 | 3 / 7 |
| 100 | Team access | 27248-27887 | 32 | 57 | 19 / 35 | 18 / 28 |
| 101 | Ask the Hub | 27888-28699 | 47 | 55 | 28 / 92 | 15 / 49 |
| 102 | Dr. Smiley: following a conversation | 28700-28999 | 19 | 33 | 13 / 30 | 3 / 21 |
| 103 | Dr. Smiley: context and actions | 29000-29465 | 31 | 32 | 27 / 55 | 10 / 40 |
| 104 | Dr. Smiley: what he remembers (on this device) | 29466-29650 | 12 | 19 | 7 / 12 | 7 / 23 |
| 105 | Ask the Hub: your practice and the next step | 29651-29718 | 3.8 | 8 | 11 / 21 | 6 / 10 |
| 106 | Dr. Smiley's memory screen | 29719-29768 | 4.0 | 6 | 6 / 14 | 3 / 3 |
| 107 | Ask the Hub: corrections, feedback, sources | 29769-29922 | 7.6 | 12 | 16 / 23 | 5 / 15 |
| 108 | Appointment mode | 29923-30042 | 7.3 | 17 | 12 / 16 | 10 / 14 |
| 109 | Dr. Smiley reacts | 30043-30166 | 6.3 | 12 | 4 / 10 | 8 / 10 |
| 110 | Daily Drill (the warm-up on Home) | 30167-30593 | 28 | 51 | 13 / 21 | 6 / 8 |
| 111 | Dr. Smiley's career | 30594-30772 | 12 | 20 | 7 / 9 | 10 / 11 |
| 112 | Appointment prep | 30773-31025 | 18 | 26 | 18 / 27 | 8 / 18 |
| 113 | Dr. Smiley's news | 31026-31078 | 3.1 | 1 | 7 / 11 | 0 / 0 |
| 114 | Dr. Smiley companion | 31079-31266 | 9.8 | 6 | 10 / 15 | 7 / 9 |
| 115 | Dr. Smiley: the companion panel | 31267-31585 | 19 | 2 | 9 / 19 | 5 / 5 |
| 116 | Init | 31586-31665 | 3.2 | 0 | 25 / 29 | 0 / 0 |
| 117 | Phone chrome, dialogs and the on-screen keyboard | 31666-31767 | 4.5 | 0 | 0 / 0 | 0 / 0 |
| 118 | Install / offline support | 31768-31801 | 1.5 | 0 | 1 / 1 | 0 / 0 |
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
