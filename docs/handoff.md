# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-06,
the badge photo chat (your photo on the opening's badge, Dr. Smiley by the reader, Adjust your photo; all live).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next) and `docs/handoff.md`. Tell me in a few short lines what is
> being worked on now and what was worked on before. Nothing is open from the last chat: ask me what's next, with
> buttons and your pick first. Plain words, say "working on it" and "done". "Push" is always a button.

## Now

Nothing open. The last three changes are live; no open pull requests from this chat, no check-ins armed.

## Done in this chat (all live)

- **#228, your photo on the badge** (b1106.1246). More, Opening, **My photo on the badge** (`ih_badgePhoto`, off
  unless turned on). Uses the photo set with your name (`ih_myPhoto`), only while its name matches `ih_myName`.
  Jose was told it breaks the old "no photo, so it can't pass for a real ID" rule and chose it opt-in; no barcode
  or number, ever. `docs/features/opening.md`, "Your photo on the badge".
- **#231, Dr. Smiley by the reader** (b1106.1507). With the photo on, he steps off the badge and stands bottom
  right, full body: a gentle wave on a loop, then his big grin and wave on green. Jose's own clips
  (`docs/art/dr-smiley-body/`), cut out with rembg, packed as videos with a matte under the colours
  (`docs/mockups/opening/smiley-body/`, its README), drawn on WebGL with a 2D fallback (`opDrDraw`). 136px tall
  on the 390 stage: the only free strip (the badge never passes x 320). He rejected: a small seal on the card,
  the head-and-shoulders art anywhere (the flat cut under his shoulders), a glass bubble.
- **#232, Adjust your photo** (b1106.1641). After you pick a photo in the name sheet: drag, pinch, slider, Save /
  Cancel, previews round (Team Chat) and tall (the badge); saves the framed square at 320px. Jose's pick: adjust
  when you pick (no full-size copy kept). `docs/features/photo-adjust.md`.
- Also: the opening's "waits at Tap to enter" check failed sometimes (a rounding slip in `opFrame` while gated,
  and a pulse threshold): fixed in #228.

## Open questions for Jose

- **Is Dr. Smiley smooth on his phone?** Unmeasured: the cloud machine's WebGL runs on the processor
  (SwiftShader), so timings there say nothing about a phone. Ask him after he has replayed the opening.
- **His other two clips** (thinking, sad then cheering up) were only uploaded to that chat, not saved in the
  repo. Ideas offered: thinking while Ask the Hub answers, sad when offline. He'd need to send them again.
- Jose's own photo: he has to re-pick it once (the saved copy lost the cut part).

## Learned, not in the docs yet

- `tests/suites/feel.cjs` "Home at rest" fails on the cloud machine for `main` too on a busy afternoon (readings
  of 117-244 against a limit of 120). Before blaming a change, run `main` and the branch back to back in the same
  folder (a `git worktree` of `origin/main`). GitHub's runners passed it every time.
- The opening plays a full-body clip through a matte on a canvas: the pattern is in `opDrGl` / `opDrDraw`
  (`features/opening.js`), reusable for other clips of him.
- rembg (`pip install "rembg[cpu]"`, ~180 MB model on first use) cuts his white coat cleanly; a colour key can't
  (the coat's shadows match the clips' gray).
