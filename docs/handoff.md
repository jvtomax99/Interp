# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-21, 00:05 UTC, from the chat that did the AI
backup models, the one Claude helper, Home styles in layers, S5 springs, the
split plan and the "push on all 14".

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> say in 2-3 lines what you'll do next and wait for my go. Plain words,
> say "working on it" and "done".

## Where things stand

**Everything is merged and live.** Build `b1020.2318` (Vercel: "Deployment
has completed" on the bump commit `fefc994`). Nothing of this chat's is
open; no check-ins armed. Merged today from this chat, in one push after
Jose said "push on all 14" (commits `8d79895` and before on `main`):
- #88 AI backups: Translate's backup `claude-sonnet-5-5` (effort medium
  set), the term check's `claude-opus-5-5` (effort low set).
- #89, #98, #99 one Claude helper: every request to the Messages API goes
  through `api/_routine.js` (`callClaude` with `beta` and `retryOutput`,
  `parseAnswer`, `clip`, `clipLine`); Term lookup, Ask the Hub and Doctor
  Prep are on it; `tests/suites/api-helper.mjs` (115 checks, the API faked).
- #90 stale numbers in `CLAUDE.md`/`AGENTS.md` re-measured; "Known gap"
  rewritten from a measurement.
- #92 dead CSS in `home-polish.css`; #95, #96, #97, #103 Home styles in
  layers: the greeting name, quote, row, text block and banner each in one
  place, proven identical (30 states, 0 pixels).
- #94 S5 springs: plain taps settle on `--spring0` (bounce 0); F2's
  Practice buttons and Dr. Smiley's acting keep their overshoot (Jose's
  pick); `tests/suites/springs.cjs`.
- #100 the three `--fs-*` names that didn't exist renamed to the real ones.
- #101 journey suite waits for the review screen (the "Term Review on 5"
  flake); #104 the split plan `docs/split-index.md`; #108 the reporting
  rules (plain words, "working on it", "done").
- Closed, superseded: my #87 F3 (another chat's #102 merged first).

**Open, other chats:** none of mine. Check `git ls-remote --heads origin
'claude/*'` before taking a phase; two chats built F3 today.

## Next, with my picks

1. **The split of `index.html`, phase 0** (`docs/split-index.md`): Jose
   said start after the open PRs merge; they have. Phase 0 is the census
   tool (`tests/tools/census.cjs`) and section markers, tests and comments
   only. My pick: start it, one PR, then phase 1 (the CSS to `app.css`)
   with the first-paint measurement Jose asked for before he decides.
2. **Chip and Exam sim contrast** (from the previous handoff, still open):
   a visible change, Jose decides; show before/after.
3. **S1b Home taps** (59-90 ms against < 20 ms): now that S5 and the Home
   styles PRs are in.
4. **Home styles in layers, the rest:** photo drift and scrim (8 rules
   each), section heads, tile names, card titles; fold the same way when
   someone touches them (method in `docs/PLAN.md`).

## Open questions for Jose

- Phase 1 of the split: a file for the CSS against a possible one-frame
  later first paint on a cold visit; measured first, his call if close.
- Dr. Smiley's face lean and brows stay on their overshoot (his acting,
  `dr-smiley.md`); one line to change if he wants them on the spring too.

## Not proven (say so if asked)

- **The dock-tuck WebKit flake** ("Dr. Smiley shrinks with the bar", 0.954
  measured for 54/58): the arithmetic says the *open* reading was 2.4%
  short (54/58 x 70.1/68.4 = 0.954), which matches the WebKit short-scale
  symptom already noted in `home-polish.css`; the fix would measure his
  layout box times the computed scale, not his painted box. WebKit won't
  install in the cloud session, so it is unverified and unfixed.
- S5's feel and the Home folds on a real iPhone (measured in Chromium).

## Learned in this chat (also in the docs where it matters)

- **Deleting a line of a CSS selector list hands its selector to the next
  rule.** The first dead-CSS pass did that and the computed-style proof
  caught the greeting row losing its grid. Delete whole rules, never lines.
- **Proof scripts for `home-polish.css` changes** are in `docs/PLAN.md`
  (Done, 2026-10-20): every computed property and box under
  `#homeGreeting` at 11 widths x short/long name x light/dark x penning,
  with `Math.random` pinned (`SESSION_QUOTE` and `SESSION_TIP` are random
  per session, so a before/after without pinning differs by a line of
  text), plus 0-pixel screenshots.
- **Chained PRs** (base = another branch) are not auto-closed when their
  commits reach `main` by a direct push; close them by hand with a note.
- **Merging many PRs:** each merge's PLAN "Done" entry conflicts with the
  next PR's; a resolver that keeps both sides of `docs/PLAN.md` and takes
  main's version lines handles it (`scratchpad/resolve2.py` pattern:
  PLAN keep both, `BUILD_ID`/`CACHE_VERSION` theirs, anything else by
  hand). The bump Action can take ~10 min behind the merge's test runs.
- **The journey "Term Review on 5" flake** is fixed in #101 (waits for the
  review screen); if it returns, the state it found is printed.
- A branch pushed as an empty claim can't be deleted from the cloud
  session (403): `claude/dock-tuck-flake` is such a leftover, nothing on it.
