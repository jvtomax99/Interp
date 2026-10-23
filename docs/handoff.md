# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-23, from the chat that ran the split of
`index.html`, phases 0 to 3c (#109, #112, #115, #122, #125, #126, #127,
#129).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> say in 2-3 lines what you'll do next and wait for my go. Plain words,
> say "working on it" and "done".

## Where things stand

The split of `index.html` (`docs/split-index.md`), one change each, all on
Jose's "push":
- #109 phase 0: `tests/tools/census.cjs` and the section banners.
- #112 phase 1: the stylesheet is `app.css`.
- #115, #122, #125 phase 2, data: `guide/topics.js`, `practice/questions.js`,
  `falsefriends/list.js`.
- #126, #127 phase 3, features: `features/translate.js`, `features/3d-body.js`
  (both live; 3D Body as b1023.1056).
- **#129 phase 3: `features/term-lookup.js`, plus this handoff. Open,
  checks green when written; waits for Jose's "push".** If it's still open,
  confirm checks and merge on his word, then confirm Vercel's "Deployment
  has completed" on the bump commit.

`DOMAIN_ICONS` was left in `index.html` on purpose (Home draws it at first
paint; a file would cost the first screen). Jose didn't decide; my pick.

## Next, with my pick

Phase 3, one feature per change, leaves first (census table in
`docs/split-index.md`): **Voice and mic check** (12 KB), then **Dr.
Smiley's performances** (16 KB), then **the campus** (19 KB, animates: more
to check). Ask the Hub's group (~125 KB) and Dr. Smiley's engine move last,
as groups, or stay.

## The method for a feature (worked three times)

1. List the section's top-level statements with acorn (snippet: walk
   `ast.body` of the biggest inline script, print each statement's type and
   name between the section's banner lines). Every one must be a declaration
   whose value runs nothing that touches `index.html` names. A listener
   added at load (`window.addEventListener(...)`) is OK if its handler runs
   later; check the order against earlier listeners of the same event (3D
   Body's note in `docs/split-index.md`).
2. Cut the banner through the section's last line into
   `features/<name>.js` under a short header comment; leave a two-line
   pointer comment. Watch for stray pointer comments from earlier moves
   sitting before the next banner: they belong to `index.html`.
3. `<script src="./features/<name>.js"></script>` after the other
   `features/` lines, before the main inline `<script>`.
4. Lists: `sw.js` precache line (the network-first regex already covers
   `features/*.js`), `tests/tools/brain-data.cjs` (drop the section from its
   group), then `node tools/brain-data.cjs` and `node tests/tools/census.cjs
   --write`. The harness and `first-paint.cjs` already handle `features/*.js`.
5. Proof: the old main script's tokens equal the new one's with the file's
   tokens put back at the first difference (acorn tokenizer); a browser probe
   of the feature in both checkouts (`ROOT=` a worktree of `main`) reading
   identically, plus `Object.keys(window)`; all suites; `first-paint.cjs`
   (`ROOTS=before,after RUNS=5`, ~20 min).
6. Docs: `AGENTS.md` where-table, `CLAUDE.md` file map + table, the
   feature's note in `docs/features/`, `docs/split-index.md`, `docs/PLAN.md`.

## Not proven / open

- Each file adds about 0.03-0.1 s to the very first paint on weak Wi-Fi
  (its bytes arrive with `app.css`); Home has come the same or sooner each
  time. Real HTTP/2 priorities on Vercel are unmeasured.
- The census can't see `window[name]` lookups or names built in strings.
- WebKit CI twice timed out installing the browser (Ubuntu mirror slow),
  passed on a re-run; once crashed mid-suite and passed on a re-run.

## Learned (also in `docs/PLAN.md` Facts)

- Computed-style proofs must sort property names (custom properties come
  in declaration order) and be compared against a second run of the old
  version (some elements differ run to run).
- `brain/index.html` and `brain-data.cjs` depend on census section titles;
  a moved section must leave `brain-data.cjs`'s lists, or it prints "Not
  found in the census".
- Other chats merge to `main` often; merge `main` in before opening a
  change and regenerate `brain/data.json` if `--check` says so.
