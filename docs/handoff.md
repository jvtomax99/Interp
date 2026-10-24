# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-24, from the chat that merged #129 and ran
#131 (Voice and mic check), #134 (plan tidy) and #137 (Dr. Smiley's
performances).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, say in 2-3 lines what you'll do next, and wait for my go. Plain words, say "working on it" and "done".

## Where things stand

The split of `index.html` (`docs/split-index.md`), phase 3, features to
their own files, one per change, all on Jose's "push":
- #126 Translate, #127 3D Body, #129 Looking a term up (live b1023.1250),
  #131 Voice and mic check (live b1023.2011), #137 Dr. Smiley's
  performances (live b1024.1338).
- #137 was the first move that wasn't declarations only: the one line
  that puts each performance into `DR_FACE_SEQ` stays in `index.html`
  (Jose's pick), because that table is defined earlier there and the
  feature file loads before `index.html`'s script.
- #134 tidied `docs/PLAN.md`: **Next** is now short (the split; S9 Home
  taps part 2, waiting on Jose's phone runs; what waits on Jose; small
  leftovers). Old promo drafts #121 and #123 closed (their Remotion code
  stays on their branches).

Open: only this handoff's change (`docs/` only, nothing deployed). No
check-ins armed.

## Next, with my pick

**The campus** (section "Your HUMC campus (CoreCHI Practice)", ~19 KB,
`renderCampus`). Unchecked leads from a first look: its top level has
`CAMPUS_MAP`, `CAMPUS`, `campusLevel`, `CAMPUS_PICK`, `campusSelLit` and
one `addEventListener` at load (the last line of the section); check what
each value runs, and the listener's order against earlier listeners of
the same event (3D Body's note in `docs/split-index.md` shows how).
`campusLife` and `campusDepth` may live in other sections; the census
says. It animates, so the browser proof needs the campus drawn and its
motion compared (the campus-life, campus-depth and campus-pick suites
cover it), not only globals.

After that: Ask the Hub's group (~125 KB) and Dr. Smiley's engine move
last, as groups, or stay (`docs/split-index.md`).

## The method (worked five times)

1. List the section's top-level statements with acorn (walk `ast.body`
   of the biggest inline script, print type and name between the banner
   lines). Declarations are fine; anything that runs must touch nothing
   from `index.html` at load. If one line does, keep that line in
   `index.html` at its place (as #137) or ask Jose.
2. Cut banner to last line into `features/<name>.js` under a short header
   comment; leave a pointer comment. Script tag after the other
   `features/` lines.
3. Lists: `sw.js` precache, `tests/tools/brain-data.cjs` (drop the
   section), `node tools/brain-data.cjs`, `node tools/census.cjs --write`.
4. Proof: rebuild the old `index.html` from the pieces and compare byte
   for byte (stronger than tokens, and handles a kept line); a browser
   probe in both checkouts (`ROOT=` a worktree of `main`) of the feature's
   output and `Object.keys(window)`; all suites; `first-paint.cjs`
   (`ROOTS=before,after RUNS=5`).
5. Docs: `AGENTS.md` where-table (and any rule naming the code's file),
   `CLAUDE.md` file map + table + line count, the feature note,
   `docs/split-index.md`, `docs/PLAN.md`.
6. Before merging: fetch `main`. Other chats merge often; merge it in,
   regenerate `brain/data.json` and the census, rerun the suites the
   other change touched, push, wait for green.

## Not proven / open

- Each moved file has cost weak Wi-Fi first paint 0.03-0.1 s; Home came
  the same or sooner each time. 4G differences are within run noise
  (one 4G run showed a 0.9 s "DOM ready" jump that flipped to the old
  version on the re-run). Real HTTP/2 on Vercel is unmeasured.
- WebKit CI jobs get "cancelled" at their 20-minute limit while still in
  `playwright install --with-deps webkit` (seen on #129, #131 twice);
  the other run on the same commit passed each time. Why the install
  hangs is unproven.

## Learned (also in `docs/PLAN.md` Facts)

- An acorn insertion point for the token proof can be off by one when the
  moved section and the next one start with the same token; the byte
  rebuild avoids that.
- A test only *mentioning* `PLAN.md` in a comment is common; no suite
  reads it, so a `docs/`-only change can't fail the suites.
