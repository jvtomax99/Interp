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
Census of `index.html`: 3 inline scripts, 117 sections, 1722 top-level names (`tests/tools/census.cjs`). The markup's own on... handlers use 69 names from 31 sections.

| # | Section | Lines | KB | Names | Uses: sections / names | Used by: sections / names |
|---|---|---|---|---|---|---|
| 1 | Dark mode before the first paint | 4-12 | 0.3 | 0 | 0 / 0 | 0 / 0 |
| 2 | Firebase: config, and the SDK loading in the background | 566-622 | 2.6 | 6 | 0 / 0 | 41 / 49 |
| 3 | Seed data (from the shared reference doc) | 627-712 | 8.1 | 2 | 1 / 1 | 2 / 2 |
| 4 | Translate lookup | 713-981 | 12 | 14 | 10 / 18 | 1 / 3 |
| 5 | State | 982-997 | 0.8 | 8 | 0 / 0 | 63 / 89 |
| 6 | Location grouping | 998-1074 | 5.0 | 7 | 0 / 0 | 8 / 20 |
| 7 | Regions | 1075-1153 | 3.7 | 14 | 10 / 15 | 13 / 32 |
| 8 | Places (shared) | 1154-1307 | 7.3 | 16 | 14 / 18 | 7 / 15 |
| 9 | Collapsible groups: doctors by place, domains by parent | 1308-1404 | 4.4 | 11 | 8 / 13 | 8 / 17 |
| 10 | Your name on this phone | 1405-1418 | 0.7 | 2 | 0 / 0 | 4 / 4 |
| 11 | Team members' faces | 1419-1570 | 6.5 | 15 | 7 / 8 | 6 / 14 |
| 12 | Shared state: search, editing, providers, quiz | 1571-1596 | 1.0 | 23 | 0 / 0 | 29 / 71 |
| 13 | Practice record: what you personally know, question by question | 1597-1887 | 12 | 30 | 6 / 6 | 5 / 27 |
| 14 | Shared state: Term Review, domains, chat, events, activity | 1888-2037 | 6.9 | 62 | 2 / 5 | 34 / 121 |
| 15 | First-run onboarding | 2038-2121 | 3.6 | 12 | 5 / 5 | 8 / 16 |
| 16 | Storage | 2122-2143 | 0.8 | 2 | 0 / 0 | 16 / 20 |
| 17 | CSV export / import | 2144-2301 | 6.5 | 9 | 11 / 15 | 2 / 5 |
| 18 | Loading the glossary | 2302-2501 | 6.9 | 2 | 8 / 12 | 1 / 1 |
| 19 | Slang domains | 2502-2598 | 6.4 | 20 | 3 / 4 | 4 / 19 |
| 20 | Domain fields and the first seeding | 2599-2636 | 1.6 | 2 | 2 / 3 | 2 / 2 |
| 21 | Local glossary cache | 2637-2806 | 7.0 | 15 | 9 / 12 | 6 / 10 |
| 22 | Recently deleted | 2807-2943 | 5.0 | 9 | 15 / 19 | 8 / 14 |
| 23 | Healthcare Providers | 2944-3052 | 4.9 | 8 | 9 / 12 | 10 / 14 |
| 24 | Doctor Directory | 3053-3198 | 7.3 | 13 | 12 / 15 | 10 / 17 |
| 25 | Team Chat | 3199-3271 | 3.3 | 3 | 9 / 19 | 5 / 5 |
| 26 | Recent Updates (activity log) | 3272-3290 | 0.7 | 1 | 3 / 3 | 17 / 17 |
| 27 | Announcements | 3291-3342 | 2.0 | 6 | 8 / 10 | 4 / 6 |
| 28 | Team Chat panel: pinned strip, typing box, drop | 3343-3469 | 6.8 | 9 | 10 / 15 | 10 / 22 |
| 29 | Recent Updates: the feed | 3470-3559 | 3.8 | 5 | 12 / 19 | 2 / 2 |
| 30 | Attachments (terms, chat, notes) | 3560-3884 | 15 | 22 | 14 / 21 | 9 / 13 |
| 31 | Utilities | 3885-3961 | 3.0 | 4 | 3 / 3 | 55 / 64 |
| 32 | Photo viewer | 3962-4304 | 17 | 15 | 3 / 5 | 6 / 8 |
| 33 | Deleting chat messages and activity entries | 4305-4363 | 2.6 | 5 | 4 / 6 | 8 / 10 |
| 34 | Accent-insensitive search | 4364-4400 | 1.6 | 3 | 0 / 0 | 18 / 18 |
| 35 | Team-contributed practice questions | 4401-4455 | 2.2 | 4 | 9 / 10 | 3 / 4 |
| 36 | Chat notifications | 4456-4609 | 5.5 | 12 | 8 / 11 | 5 / 9 |
| 37 | Typing presence | 4610-4783 | 7.1 | 14 | 7 / 12 | 6 / 12 |
| 38 | Global search | 4784-5020 | 8.8 | 12 | 13 / 23 | 5 / 8 |
| 39 | Training & Events | 5021-5154 | 5.3 | 8 | 12 / 25 | 3 / 4 |
| 40 | Small helpers: save errors, toasts, colours, tile lists | 5155-5316 | 9.4 | 12 | 8 / 16 | 55 / 102 |
| 41 | Term Review: Dr. Smiley's practice sessions | 5317-5776 | 30 | 42 | 20 / 34 | 6 / 14 |
| 42 | The guide: search, answer sheets, Show me | 5777-6278 | 34 | 46 | 14 / 23 | 8 / 27 |
| 43 | Doctor Prep: research | 6279-6667 | 17 | 23 | 17 / 23 | 7 / 18 |
| 44 | The guide: installing, the front page | 6668-6891 | 11 | 17 | 6 / 27 | 2 / 5 |
| 45 | Small helpers: tile colours, escaping, links | 6892-6925 | 1.7 | 4 | 0 / 0 | 61 / 106 |
| 46 | Dr. Smiley's art | 6926-7073 | 14 | 6 | 0 / 0 | 6 / 9 |
| 47 | Dr. Smiley: performances | 7074-7352 | 16 | 15 | 2 / 3 | 3 / 7 |
| 48 | Dr. Smiley: animation engine | 7353-8095 | 36 | 31 | 5 / 21 | 9 / 19 |
| 49 | Dr. Smiley: how lively (Lively, Focused, Still) | 8096-8132 | 1.8 | 7 | 3 / 5 | 8 / 16 |
| 50 | Dr. Smiley: what he's doing (task states) | 8133-8328 | 9.8 | 23 | 6 / 14 | 12 / 33 |
| 51 | Icons (inline SVG) | 8329-8403 | 19 | 59 | 0 / 0 | 40 / 139 |
| 52 | 3D Body | 8404-8585 | 11 | 20 | 9 / 16 | 3 / 4 |
| 53 | False Friends (falsos amigos) | 8586-9470 | 44 | 2 | 0 / 0 | 11 / 14 |
| 54 | Domain icons and link lists | 9471-9530 | 19 | 2 | 5 / 7 | 8 / 8 |
| 55 | Term card menu (phones) | 9531-9615 | 4.5 | 5 | 8 / 11 | 1 / 1 |
| 56 | Rendering | 9616-9706 | 3.8 | 9 | 1 / 1 | 9 / 9 |
| 57 | Domain banner and its ⋯ menu | 9707-9973 | 13 | 9 | 23 / 39 | 20 / 20 |
| 58 | Offline outbox | 9974-10251 | 10 | 25 | 5 / 6 | 12 / 31 |
| 59 | Unsent changes sheet | 10252-10489 | 11 | 15 | 7 / 16 | 9 / 16 |
| 60 | Sync status and the top bar | 10490-10658 | 7.9 | 8 | 11 / 17 | 13 / 14 |
| 61 | The screen: renderContent | 10659-11221 | 28 | 15 | 49 / 125 | 24 / 25 |
| 62 | Theme, navigation and overlays | 11222-11345 | 6.5 | 5 | 14 / 25 | 26 / 29 |
| 63 | Opening one particular term | 11346-11394 | 2.3 | 2 | 7 / 12 | 4 / 4 |
| 64 | Looking a term up | 11395-11649 | 10 | 16 | 8 / 9 | 3 / 3 |
| 65 | Subdomain folder | 11650-11783 | 6.0 | 4 | 4 / 5 | 1 / 1 |
| 66 | Going Home and going back | 11784-11856 | 3.6 | 3 | 5 / 8 | 3 / 4 |
| 67 | Your name and photo (the name sheet) | 11857-12053 | 8.4 | 15 | 18 / 31 | 31 / 39 |
| 68 | CoreCHI practice | 12054-12121 | 2.5 | 4 | 1 / 1 | 6 / 12 |
| 69 | False Friends | 12122-12588 | 22 | 30 | 18 / 65 | 4 / 7 |
| 70 | Practice dashboard tiles | 12589-12717 | 7.1 | 12 | 5 / 6 | 2 / 4 |
| 71 | Your HUMC campus (CoreCHI Practice) | 12718-12865 | 19 | 12 | 7 / 11 | 2 / 3 |
| 72 | Practice dashboard motion | 12866-13077 | 15 | 12 | 4 / 5 | 4 / 6 |
| 73 | Quiz | 13078-13579 | 21 | 23 | 18 / 43 | 7 / 15 |
| 74 | Quiz celebrations | 13580-13634 | 2.5 | 3 | 1 / 1 | 9 / 9 |
| 75 | Live relative time | 13635-13710 | 3.2 | 4 | 2 / 3 | 8 / 8 |
| 76 | Multilingual greeting | 13711-13873 | 8.8 | 11 | 4 / 5 | 6 / 9 |
| 77 | Smoothness meter | 13874-14102 | 13 | 26 | 6 / 9 | 12 / 12 |
| 78 | Voice and mic check | 14103-14345 | 12 | 25 | 4 / 4 | 3 / 6 |
| 79 | Memory trainer | 14346-15081 | 43 | 87 | 24 / 40 | 6 / 10 |
| 80 | Split dock (phones) | 15082-15463 | 21 | 16 | 3 / 3 | 2 / 3 |
| 81 | Tab bar and the More sheet | 15464-15516 | 3.1 | 3 | 10 / 20 | 4 / 4 |
| 82 | Home screen | 15517-15724 | 13 | 8 | 16 / 25 | 2 / 2 |
| 83 | Lists: providers, recently deleted, doctors hub | 15725-15834 | 5.5 | 3 | 12 / 24 | 1 / 3 |
| 84 | Duplicate doctors | 15835-15986 | 6.2 | 7 | 16 / 17 | 1 / 2 |
| 85 | Terminology backfill | 15987-16130 | 6.1 | 7 | 10 / 11 | 1 / 3 |
| 86 | Doctor list (the directory) | 16131-16348 | 11 | 20 | 22 / 46 | 5 / 9 |
| 87 | Doctor page | 16349-16539 | 8.1 | 22 | 14 / 22 | 6 / 23 |
| 88 | Team tips (D2) | 16540-16887 | 19 | 19 | 25 / 61 | 7 / 12 |
| 89 | Team Chat: rendering + sending | 16888-17024 | 6.4 | 18 | 4 / 4 | 5 / 24 |
| 90 | Titles under names (Team Chat) | 17025-17111 | 4.7 | 12 | 6 / 8 | 3 / 3 |
| 91 | Team Chat: messages, channels, scrolling | 17112-17568 | 23 | 18 | 19 / 76 | 11 / 18 |
| 92 | Message interactions | 17569-18091 | 25 | 23 | 18 / 40 | 4 / 15 |
| 93 | Add / Edit / Delete | 18092-18272 | 8.4 | 11 | 13 / 15 | 10 / 13 |
| 94 | Term check — a second look after saving | 18273-18435 | 6.2 | 12 | 12 / 15 | 4 / 5 |
| 95 | Add / delete domain | 18436-18620 | 8.2 | 13 | 10 / 17 | 4 / 6 |
| 96 | Healthcare Providers: modal + photo handling | 18621-18785 | 6.2 | 10 | 15 / 23 | 3 / 7 |
| 97 | Doctor and provider sheets: places | 18786-18905 | 6.8 | 18 | 10 / 22 | 4 / 9 |
| 98 | Doctor directory: the add and edit sheet | 18906-19094 | 7.6 | 11 | 17 / 29 | 3 / 7 |
| 99 | Team access | 19095-19734 | 32 | 57 | 19 / 35 | 18 / 28 |
| 100 | Ask the Hub | 19735-20546 | 47 | 55 | 27 / 91 | 15 / 49 |
| 101 | Dr. Smiley: following a conversation | 20547-20846 | 19 | 33 | 13 / 30 | 3 / 21 |
| 102 | Dr. Smiley: context and actions | 20847-21312 | 31 | 32 | 27 / 55 | 10 / 40 |
| 103 | Dr. Smiley: what he remembers (on this device) | 21313-21497 | 12 | 19 | 7 / 12 | 7 / 23 |
| 104 | Ask the Hub: your practice and the next step | 21498-21565 | 3.8 | 8 | 11 / 21 | 6 / 10 |
| 105 | Dr. Smiley's memory screen | 21566-21615 | 4.0 | 6 | 6 / 14 | 3 / 3 |
| 106 | Ask the Hub: corrections, feedback, sources | 21616-21769 | 7.6 | 12 | 16 / 23 | 5 / 15 |
| 107 | Appointment mode | 21770-21889 | 7.3 | 17 | 12 / 16 | 10 / 14 |
| 108 | Dr. Smiley reacts | 21890-22013 | 6.3 | 12 | 4 / 10 | 8 / 10 |
| 109 | Daily Drill (the warm-up on Home) | 22014-22440 | 28 | 51 | 12 / 20 | 6 / 8 |
| 110 | Dr. Smiley's career | 22441-22619 | 12 | 20 | 7 / 9 | 10 / 11 |
| 111 | Appointment prep | 22620-22872 | 18 | 26 | 18 / 27 | 8 / 18 |
| 112 | Dr. Smiley's news | 22873-22925 | 3.1 | 1 | 7 / 11 | 0 / 0 |
| 113 | Dr. Smiley companion | 22926-23113 | 9.8 | 6 | 10 / 15 | 7 / 9 |
| 114 | Dr. Smiley: the companion panel | 23114-23432 | 19 | 2 | 9 / 19 | 5 / 5 |
| 115 | Init | 23433-23512 | 3.2 | 0 | 24 / 28 | 0 / 0 |
| 116 | Phone chrome, dialogs and the on-screen keyboard | 23513-23614 | 4.5 | 0 | 0 / 0 | 0 / 0 |
| 117 | Install / offline support | 23615-23648 | 1.5 | 0 | 1 / 1 | 0 / 0 |
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
