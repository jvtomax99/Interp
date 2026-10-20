# Splitting `index.html`: the plan

`index.html` is one file, 1.86 MB, 31,738 lines (2026-10-20): one `<style>`
block of 466 KB (lines 50-7356), one inline script of 1,354 KB (lines
7928-31734; two small scripts beside it), and 39 KB of markup. The script
holds 1,670 top-level statements; 313 of them are UPPER_CASE data constants
(296 KB), the biggest `GUIDE_TOPICS` 54 KB, `SEED_QUESTIONS` 44, `FALSE_FRIENDS`
39, `DOMAIN_ICONS` 18, `DR_FACE_SEQ` 11. The CSS is marked by 57 banner
comments; the script by only 9 in the same style (the rest use other comment
styles), so its sections can't be cut by the banners alone.

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

0. **Markers and a census (one PR, tests/tools only).** A script
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

## What this costs and buys

Each move is a day's PR with the same proof. It buys: a diff a person can
read (a feature's change touches its file), fewer merge conflicts between
chats (today every PR touches `index.html`), and a smaller first download
once the data and the guide are lazy. It does not buy speed by itself: the
startup work is the same code; S3's numbers are the guard, not the goal.

## Decisions for Jose

- Whether to start at all now, with the Home and campus work still moving
  daily in `index.html` (each move is a merge-conflict magnet for a day).
- Phase 1's trade: a file for the CSS (clean) against the possible one-frame
  later first paint on a cold visit. The measurement decides; his call if
  it is close.
