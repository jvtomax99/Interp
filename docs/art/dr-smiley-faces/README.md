# Dr. Smiley's new faces (source art for E2)

Made by Jose in ChatGPT on 2026-10-19 from `reference.png` (his calm face:
base + the rest frame + both brows, 960 x 1200) with the prompts in
`prompts.md`. Not loaded by the app (`docs/` is in `.vercelignore`).

| File | Face |
|---|---|
| `surprised.png` | eyes wide, round "O" mouth, brows up |
| `sad.png` | heavy lids, mouth corners down |
| `worried.png` | eyes to one side, tight wavy mouth |
| `doubtful.png` | one eye squinted, side smirk |

All four are 1122 x 1402 (4:5, same as the reference). Measured against the
reference at 480 x 600 outside the face window (hair, ears, coat): best fit
at scale 1.00 and offset 0,0 for all four, mean colour difference 2.8-3.2
of 255. So they line up; only the eyes and mouth need cutting.

E2, what to do with them (see `docs/PLAN.md` and `docs/features/dr-smiley.md`):
cut the eyes and mouth inside the face window (picture units x 40, y 106,
151 x 111; 2x in `base.webp` pixels) the same way the 26 frames were, keep
only what differs from the calm face, leave the brows out (his brows are
their own layers, `DR_BROWS`; the generated brows are ignored, and the brow
area is repainted as skin as in the brows cut), match colour to the strip,
add them to `face.webp` as new frames, name them in `DR_FACE_FRAMES`, give
them neighbours in `DR_FACE_BACK`, brow poses in `DR_BROW_OF`, and use them:
`surprise` (surprised), `worry` (worried), `encourage`/`composed` or a low
score (sad, sparingly), `answerGeneral` (doubtful).

**Done (E2, 2026-10-19).** Cut into `drsmiley/face.webp` as frames 27-30
(`surprised`, `sad`, `worried`, `doubt`). How: each picture scaled to
480 x 600 (base.webp pixels), the face window cropped with the existing
frames' own alpha (the same three patches, both eyes and the mouth); the
generated brows found as their own dark shapes and filled in with the skin
around them; a soft colour correction toward the calm frame where the two
agree (Gaussian, 10 px); and the last 10 px inside each patch eased into the
calm frame wherever both are skin, so no edge shows (mean difference at the
edge 0.2-0.9 of 255). Strip re-encoded at WebP quality 90 (171 KB).
