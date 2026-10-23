# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-22, from the chat that ran the split of
`index.html`, phases 0 to 2b (#109, #112, #115, #122).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> say in 2-3 lines what you'll do next and wait for my go. Plain words,
> say "working on it" and "done".

## Where things stand

**Everything of this chat's is merged.** The split of `index.html`
(`docs/split-index.md`), one change each, all on Jose's "push":
- #109 phase 0: `tests/tools/census.cjs` (the map of the script's
  sections and who uses whom; `--write` refreshes the table in the split
  plan) and 35 section banners (comments only).
- #112 phase 1: the stylesheet is `app.css` (Jose chose it on the numbers:
  weak Wi-Fi first paint +0.33 s, Home -0.3 s).
- #115 phase 2: `guide/topics.js` (`GUIDE_SECTIONS`, `GUIDE_TOPICS`).
- #122 phase 2b: `practice/questions.js` (`CCHI_DOMAINS`, `SEED_QUESTIONS`),
  plus a fix to `brain/index.html` (it placed exactly four data lists).
All live: #122 as b1022.0855 (Vercel: "Deployment has completed").
No PR of this chat's is open; no check-ins armed.

**Other chats were busy on `main` the same day** (HUMC Brain, knowledge
brain, Term Review brain, notifications, K2 privacy, a 3D Dr. Smiley
mockup #114). Fetch `main` and look before starting.

## Next, with my pick

1. **`FALSE_FRIENDS` (44 KB) to its own file**, same method as the guide and
   the practice bank (below). Readers at startup: the Home tool tile counts
   it (`getToolTiles`), global search, Term Review's `rvLoose` lookup, the
   Daily Drill. So a plain `<script src>`, not fetched on demand. Suggested
   name: `falsefriends/list.js` (or ask Jose).
2. Then `DOMAIN_ICONS` (18 KB, section "Domain icons and link lists"): used
   by Home's tiles at first paint, so the same plain-script way, or leave it.
3. Then phase 3, JS by feature, leaves first (the census and
   `docs/split-index.md` "What it says" list them).

## The method for a data list (worked twice)

1. Check it's pure data: walk its acorn AST, only literals/arrays/objects
   (the snippet is in this chat's history; any `Identifier` value or
   template expression means it isn't).
2. Move the banner + declarations verbatim into the new file under a short
   header comment; leave a two-line pointer comment in `index.html`.
3. `<script src="./x/y.js"></script>` after the others, just before the
   main inline `<script>` (around line 625).
4. The lists: `sw.js` (precache + the network-first regex + its comment),
   `tests/support/harness.cjs` (the served files), `tests/tools/
   first-paint.cjs` (its unroute list), `tests/tools/brain-data.cjs` (drop
   the section from the `data` group), then `node tools/brain-data.cjs` and
   `node tests/tools/census.cjs --write`.
5. Proof: a probe page in both checkouts (`ROOT=` a worktree of `main`):
   `JSON.stringify` of the lists identical, the tile count the same,
   `Object.keys(window)` the same, no page errors. Then all suites, then
   `first-paint.cjs` (`ROOTS=before,after RUNS=5`, about 20 min).
6. Docs: `AGENTS.md` where-table, `CLAUDE.md` file map + table, the
   feature note that names the list, `docs/split-index.md`, `docs/PLAN.md`.

## Not proven / open

- Each moved file costs weak Wi-Fi first paint about 0.08-0.1 s (its bytes
  arrive with `app.css`); Home comes sooner by about as much.
  `fetchpriority="low"` made no difference in Chromium's throttling;
  real HTTP/2 priorities on Vercel are unmeasured.
- The census can't see `window[name]` lookups or names built in strings.
- WebKit CI crashed once mid-suite (startup-work, "page closed") and passed
  on the re-run; not reproduced.

## Learned (also in `docs/PLAN.md` Facts)

- Computed-style proofs must sort property names: custom properties are
  listed in declaration order, which moving a sheet changes.
- Compare against a second run of the old version: some elements differ
  between two runs of the same code (chat timestamps, the tab bar's lens).
- `brain/index.html` and `brain-data.cjs` depend on census section titles;
  a renamed or moved section needs the list updated (the tool prints "Not
  found in the census").
