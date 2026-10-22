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
   globals unchanged. Next: `FALSE_FRIENDS`.
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
Census of `index.html`: 3 inline scripts, 119 sections, 1764 top-level names (`tests/tools/census.cjs`). The markup's own on... handlers use 69 names from 31 sections.

| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |
|---|---|---|---|---|---|---|
| 1 | Dark mode before the first paint | 4-12 | 0.3 | 0 | 0 / 0 | 0 / 0 |
| 2 | Firebase: config, and the SDK loading in the background | 566-622 | 2.6 | 6 | 0 / 0 | 42 / 51 |
| 3 | Seed data (from the shared reference doc) | 627-712 | 8.1 | 2 | 1 / 1 | 2 / 2 |
| 4 | Translate lookup | 713-981 | 12 | 14 | 10 / 18 | 1 / 3 |
| 5 | State | 982-997 | 0.8 | 8 | 0 / 0 | 65 / 91 |
| 6 | Location grouping | 998-1074 | 5.0 | 7 | 0 / 0 | 8 / 20 |
| 7 | Regions | 1075-1154 | 3.8 | 14 | 11 / 16 | 14 / 34 |
| 8 | Places (shared) | 1155-1308 | 7.3 | 16 | 14 / 18 | 7 / 15 |
| 9 | Collapsible groups: doctors by place, domains by parent | 1309-1405 | 4.4 | 11 | 8 / 13 | 8 / 17 |
| 10 | Your name on this phone | 1406-1419 | 0.7 | 2 | 0 / 0 | 4 / 4 |
| 11 | Team members' faces | 1420-1571 | 6.5 | 15 | 7 / 8 | 6 / 14 |
| 12 | Shared state: search, editing, providers, quiz | 1572-1597 | 1.0 | 23 | 0 / 0 | 29 / 71 |
| 13 | Practice record: what you personally know, question by question | 1598-1888 | 12 | 30 | 6 / 6 | 5 / 27 |
| 14 | Shared state: Term Review, domains, chat, events, activity | 1889-2038 | 6.9 | 62 | 2 / 5 | 36 / 126 |
| 15 | First-run onboarding | 2039-2122 | 3.6 | 12 | 5 / 5 | 8 / 16 |
| 16 | Storage | 2123-2144 | 0.8 | 2 | 0 / 0 | 16 / 20 |
| 17 | CSV export / import | 2145-2302 | 6.5 | 9 | 11 / 15 | 2 / 5 |
| 18 | Loading the glossary | 2303-2502 | 6.9 | 2 | 8 / 12 | 1 / 1 |
| 19 | Slang domains | 2503-2599 | 6.4 | 20 | 3 / 4 | 4 / 19 |
| 20 | Domain fields and the first seeding | 2600-2637 | 1.6 | 2 | 2 / 3 | 2 / 2 |
| 21 | Local glossary cache | 2638-2807 | 7.0 | 15 | 9 / 12 | 6 / 10 |
| 22 | Recently deleted | 2808-2944 | 5.0 | 9 | 15 / 19 | 8 / 14 |
| 23 | Healthcare Providers | 2945-3059 | 5.3 | 8 | 11 / 14 | 11 / 15 |
| 24 | Doctor Directory | 3060-3205 | 7.3 | 13 | 12 / 15 | 10 / 17 |
| 25 | Team Chat | 3206-3280 | 3.4 | 3 | 10 / 21 | 5 / 5 |
| 26 | Recent Updates (activity log) | 3281-3299 | 0.7 | 1 | 3 / 3 | 18 / 18 |
| 27 | Announcements | 3300-3351 | 2.0 | 6 | 8 / 10 | 4 / 6 |
| 28 | Team Chat panel: pinned strip, typing box, drop | 3352-3478 | 6.8 | 9 | 10 / 15 | 10 / 22 |
| 29 | Recent Updates: the feed | 3479-3568 | 3.8 | 5 | 12 / 19 | 2 / 2 |
| 30 | Attachments (terms, chat, notes) | 3569-3893 | 15 | 22 | 14 / 21 | 9 / 13 |
| 31 | Utilities | 3894-3970 | 3.0 | 4 | 3 / 3 | 57 / 66 |
| 32 | Photo viewer | 3971-4313 | 17 | 15 | 3 / 5 | 6 / 8 |
| 33 | Deleting chat messages and activity entries | 4314-4372 | 2.6 | 5 | 4 / 6 | 9 / 11 |
| 34 | Accent-insensitive search | 4373-4409 | 1.6 | 3 | 0 / 0 | 18 / 18 |
| 35 | Team-contributed practice questions | 4410-4464 | 2.2 | 4 | 9 / 10 | 3 / 4 |
| 36 | Chat notifications | 4465-4621 | 5.6 | 12 | 9 / 13 | 6 / 14 |
| 37 | Notifications that reach a closed phone (Web Push) | 4622-4940 | 18 | 27 | 11 / 22 | 6 / 8 |
| 38 | Typing presence | 4941-5114 | 7.1 | 14 | 7 / 12 | 6 / 12 |
| 39 | Global search | 5115-5351 | 8.8 | 12 | 13 / 23 | 5 / 8 |
| 40 | Training & Events | 5352-5485 | 5.4 | 8 | 13 / 26 | 3 / 4 |
| 41 | Small helpers: save errors, toasts, colours, tile lists | 5486-5648 | 9.5 | 12 | 8 / 16 | 57 / 104 |
| 42 | Your knowledge brain: your own Term Review record, drawn as a brain | 5649-5862 | 13 | 14 | 15 / 20 | 3 / 3 |
| 43 | Term Review: Dr. Smiley's practice sessions | 5863-6326 | 30 | 42 | 21 / 35 | 7 / 18 |
| 44 | The guide: search, answer sheets, Show me | 6327-6828 | 34 | 46 | 14 / 23 | 8 / 27 |
| 45 | Doctor Prep: research | 6829-7217 | 17 | 23 | 17 / 23 | 7 / 18 |
| 46 | The guide: installing, the front page | 7218-7441 | 11 | 17 | 6 / 27 | 2 / 5 |
| 47 | Small helpers: tile colours, escaping, links | 7442-7475 | 1.7 | 4 | 0 / 0 | 63 / 110 |
| 48 | Dr. Smiley's art | 7476-7623 | 14 | 6 | 0 / 0 | 6 / 9 |
| 49 | Dr. Smiley: performances | 7624-7902 | 16 | 15 | 2 / 3 | 3 / 7 |
| 50 | Dr. Smiley: animation engine | 7903-8645 | 36 | 31 | 5 / 21 | 9 / 19 |
| 51 | Dr. Smiley: how lively (Lively, Focused, Still) | 8646-8682 | 1.8 | 7 | 3 / 5 | 8 / 16 |
| 52 | Dr. Smiley: what he's doing (task states) | 8683-8878 | 9.8 | 23 | 6 / 14 | 12 / 33 |
| 53 | Icons (inline SVG) | 8879-8953 | 19 | 59 | 0 / 0 | 40 / 139 |
| 54 | 3D Body | 8954-9135 | 11 | 20 | 9 / 16 | 3 / 4 |
| 55 | False Friends (falsos amigos) | 9136-10020 | 44 | 2 | 0 / 0 | 11 / 14 |
| 56 | Domain icons and link lists | 10021-10080 | 19 | 2 | 5 / 7 | 9 / 9 |
| 57 | Term card menu (phones) | 10081-10165 | 4.5 | 5 | 8 / 11 | 1 / 1 |
| 58 | Rendering | 10166-10256 | 3.8 | 9 | 1 / 1 | 10 / 10 |
| 59 | Domain banner and its ⋯ menu | 10257-10525 | 13 | 9 | 23 / 39 | 20 / 20 |
| 60 | Offline outbox | 10526-10803 | 10 | 25 | 5 / 6 | 12 / 31 |
| 61 | Unsent changes sheet | 10804-11041 | 11 | 15 | 7 / 16 | 9 / 16 |
| 62 | Sync status and the top bar | 11042-11210 | 7.9 | 8 | 11 / 17 | 13 / 14 |
| 63 | The screen: renderContent | 11211-11778 | 28 | 15 | 50 / 126 | 26 / 27 |
| 64 | Theme, navigation and overlays | 11779-11902 | 6.5 | 5 | 14 / 25 | 28 / 31 |
| 65 | Opening one particular term | 11903-11951 | 2.3 | 2 | 7 / 12 | 5 / 5 |
| 66 | Looking a term up | 11952-12206 | 10 | 16 | 8 / 9 | 3 / 3 |
| 67 | Subdomain folder | 12207-12340 | 6.0 | 4 | 4 / 5 | 1 / 1 |
| 68 | Going Home and going back | 12341-12413 | 3.6 | 3 | 5 / 8 | 3 / 4 |
| 69 | Your name and photo (the name sheet) | 12414-12610 | 8.4 | 15 | 18 / 31 | 32 / 40 |
| 70 | CoreCHI practice | 12611-12678 | 2.5 | 4 | 1 / 1 | 6 / 12 |
| 71 | False Friends | 12679-13148 | 22 | 30 | 19 / 66 | 4 / 7 |
| 72 | Practice dashboard tiles | 13149-13277 | 7.1 | 12 | 5 / 6 | 2 / 4 |
| 73 | Your HUMC campus (CoreCHI Practice) | 13278-13425 | 19 | 12 | 7 / 11 | 2 / 3 |
| 74 | Practice dashboard motion | 13426-13637 | 15 | 12 | 4 / 5 | 4 / 6 |
| 75 | Quiz | 13638-14139 | 21 | 23 | 18 / 43 | 8 / 16 |
| 76 | Quiz celebrations | 14140-14194 | 2.5 | 3 | 1 / 1 | 9 / 9 |
| 77 | Live relative time | 14195-14270 | 3.2 | 4 | 2 / 3 | 8 / 8 |
| 78 | Multilingual greeting | 14271-14433 | 8.9 | 11 | 4 / 5 | 6 / 9 |
| 79 | Smoothness meter | 14434-14662 | 13 | 26 | 6 / 9 | 12 / 12 |
| 80 | Voice and mic check | 14663-14905 | 12 | 25 | 4 / 4 | 3 / 6 |
| 81 | Memory trainer | 14906-15641 | 43 | 87 | 24 / 40 | 6 / 10 |
| 82 | Split dock (phones) | 15642-16023 | 21 | 16 | 3 / 3 | 2 / 3 |
| 83 | Tab bar and the More sheet | 16024-16076 | 3.1 | 3 | 10 / 20 | 4 / 4 |
| 84 | Home screen | 16077-16284 | 13 | 8 | 16 / 25 | 2 / 2 |
| 85 | Lists: providers, recently deleted, doctors hub | 16285-16394 | 5.5 | 3 | 12 / 24 | 1 / 3 |
| 86 | Duplicate doctors | 16395-16546 | 6.2 | 7 | 16 / 17 | 1 / 2 |
| 87 | Terminology backfill | 16547-16690 | 6.1 | 7 | 10 / 11 | 1 / 3 |
| 88 | Doctor list (the directory) | 16691-16908 | 11 | 20 | 22 / 46 | 5 / 9 |
| 89 | Doctor page | 16909-17099 | 8.1 | 22 | 14 / 22 | 6 / 23 |
| 90 | Team tips (D2) | 17100-17447 | 19 | 19 | 25 / 61 | 7 / 12 |
| 91 | Team Chat: rendering + sending | 17448-17584 | 6.4 | 18 | 4 / 4 | 5 / 24 |
| 92 | Titles under names (Team Chat) | 17585-17671 | 4.7 | 12 | 6 / 8 | 3 / 3 |
| 93 | Team Chat: messages, channels, scrolling | 17672-18128 | 23 | 18 | 19 / 76 | 11 / 18 |
| 94 | Message interactions | 18129-18651 | 25 | 23 | 18 / 40 | 4 / 15 |
| 95 | Add / Edit / Delete | 18652-18832 | 8.4 | 11 | 13 / 15 | 10 / 13 |
| 96 | Term check — a second look after saving | 18833-18995 | 6.2 | 12 | 12 / 15 | 4 / 5 |
| 97 | Add / delete domain | 18996-19180 | 8.2 | 13 | 10 / 17 | 4 / 6 |
| 98 | Healthcare Providers: modal + photo handling | 19181-19345 | 6.2 | 10 | 15 / 23 | 3 / 7 |
| 99 | Doctor and provider sheets: places | 19346-19465 | 6.8 | 18 | 10 / 22 | 4 / 9 |
| 100 | Doctor directory: the add and edit sheet | 19466-19654 | 7.6 | 11 | 17 / 29 | 3 / 7 |
| 101 | Team access | 19655-20302 | 32 | 58 | 19 / 35 | 20 / 32 |
| 102 | Ask the Hub | 20303-21114 | 47 | 55 | 27 / 91 | 15 / 49 |
| 103 | Dr. Smiley: following a conversation | 21115-21414 | 19 | 33 | 13 / 30 | 3 / 21 |
| 104 | Dr. Smiley: context and actions | 21415-21880 | 31 | 32 | 27 / 55 | 10 / 40 |
| 105 | Dr. Smiley: what he remembers (on this device) | 21881-22065 | 12 | 19 | 7 / 12 | 7 / 23 |
| 106 | Ask the Hub: your practice and the next step | 22066-22133 | 3.8 | 8 | 11 / 21 | 6 / 10 |
| 107 | Dr. Smiley's memory screen | 22134-22183 | 4.0 | 6 | 6 / 14 | 3 / 3 |
| 108 | Ask the Hub: corrections, feedback, sources | 22184-22337 | 7.6 | 12 | 16 / 23 | 5 / 15 |
| 109 | Appointment mode | 22338-22457 | 7.3 | 17 | 12 / 16 | 10 / 14 |
| 110 | Dr. Smiley reacts | 22458-22581 | 6.3 | 12 | 4 / 10 | 8 / 10 |
| 111 | Daily Drill (the warm-up on Home) | 22582-23008 | 28 | 51 | 12 / 20 | 6 / 8 |
| 112 | Dr. Smiley's career | 23009-23187 | 12 | 20 | 7 / 9 | 10 / 11 |
| 113 | Appointment prep | 23188-23440 | 18 | 26 | 18 / 27 | 8 / 18 |
| 114 | Dr. Smiley's news | 23441-23493 | 3.1 | 1 | 7 / 11 | 0 / 0 |
| 115 | Dr. Smiley companion | 23494-23681 | 9.8 | 6 | 10 / 15 | 7 / 9 |
| 116 | Dr. Smiley: the companion panel | 23682-24000 | 19 | 2 | 9 / 19 | 5 / 5 |
| 117 | Init | 24001-24090 | 3.7 | 0 | 26 / 30 | 0 / 0 |
| 118 | Phone chrome, dialogs and the on-screen keyboard | 24091-24192 | 4.5 | 0 | 0 / 0 | 0 / 0 |
| 119 | Install / offline support | 24193-24226 | 1.5 | 0 | 1 / 1 | 0 / 0 |
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
