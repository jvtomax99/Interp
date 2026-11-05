# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-05,
the opening chat (about fifteen mockups, Badge in picked, the plan merged as #220).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next, item 5), `docs/handoff.md` and
> `docs/features/opening.md`, and look at `docs/mockups/opening/` (`hub-opening-final.mp4` is the picked opening).
> Tell me in a few short lines what is being worked on now and what was worked on before. Then build the opening
> as one change for my OK: `features/opening.js`, an "Opening" block in `app.css`, the background as a pre-rendered
> loop in `opening/`, More's Opening card (on/off, Sound, Replay, Badge title), `tests/suites/opening.cjs`, the
> User Guide answer and a New lately card. Show me phone screenshots and a video before asking to push. Plain
> words, say "working on it" and "done". "Push" is always a button.

## Now: build the opening (Badge in)

The plan is merged (#220, docs only): `docs/features/opening.md`. In short:

- **Every time the app really starts** (Jose: "always triggers every time the app is opened"), except when a
  notification started it (`?open=`), on the reload after an update, or during an exam or practice timer. A tap
  before the badge arrives skips to Home. iPhone resuming the app is not a start.
- **The scene:** Jose's own photo of the Helena Theurer Pavilion (`docs/mockups/opening/src/pavilion.jpg`), softly
  blurred and drifting, soft light shafts made from the photo's own sky (not drawn beams: Jose found drawn ones
  fake), faint dust, no random sparkles. At the bottom the plain HMH mark (`hmh-mark.png`, no tile) and
  "*Interpreter* Hub" in Cormorant Garamond (italic Interpreter, upright Hub), HUMC LANGUAGE SERVICES under it.
- **The badge,** after Jose's real one: landscape white card in a clear holder, the purple INTERPRETER card
  behind, a clear strap with a metal snap, a blue connector, the woven navy lanyard saying INTERPRETER only (the
  team covers more than Spanish). The card: "Jose V." (first name, last initial, from `ih_myName`), the badge
  title (each person picks once, default Staff Interpreter, `ih_badgeTitle`), the HMH / HUMC lettering with the
  mark, "Language Services". **Dr. Smiley where the photo goes** (`drSmileyArt`); no photo, barcode or number.
- **The tap:** "Tap your badge to begin"; it lowers onto a frosted glass reader, a cyan scan line (beep), green
  (chime), a green pulse up the lanyard and a green glow on badge and lanyard (Jose asked to keep this), Dr. Smiley
  winks (face frame `wink`), "Welcome in, Jose". Then **the green ring grows from the reader and Home shows inside
  it** (picked from four exits).
- **Sound on by default, quiet,** only after the tap; More's switch turns it off.
- **Build it light:** the mockup used three.js and read the screen back every frame for the light shafts; the app
  must not. Render the background (drift and light) once into a seamless ~6 s loop (WebM and MP4, under ~1.5 MB)
  and precache it in `sw.js`; everything on top is HTML/CSS. Home draws underneath as now, so the ring opens on
  the live Home. Still mode / reduced motion: no drift or swing, a 260 ms fade.
- **Home's hello and name pen must wait** for the opening to end (`hub-opening-done`; `home-polish.js`).
- **Tests:** the other suites must not see it (set the switch off in `tests/support`); a new suite checks a fresh
  start plays it, `?open=` skips it, a tap before the badge skips it, nothing is left over Home after
  (`elementFromPoint`), Still takes the short path.

## How the mockup was made (to render the loop)

`docs/mockups/opening/README.md`: `src/src7.html` plus `build7.py` (change `d` to that folder). Its query string
draws any still (`?t=<ms>&light=1&exit=3&font=cg`, add `&tap=4400` for after the tap). The depth map came from
Depth Anything V2 Small as ONNX (github.com/fabio-sim/Depth-Anything-ONNX releases, v2.0.0, `vits`), run with
`pip install onnxruntime`; Hugging Face and download.pytorch.org are blocked from cloud sessions, GitHub release
downloads work. Rendering in headless Chromium needs `--use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader`; about 1 s a frame at 2x.

## What was worked on before (this chat)

About fifteen opening mockups, each dropped on Jose's word: four light ideas, a Genshin-style title screen, a
block-3D walk up the drive (rejected: "no blocky graphics"), the walk made from his photos in 3D, a CoreCHI campus
dive, a cherry-blossom badge scene. He picked **Badge in** and refined it (his real badge's layout, the plain logo,
the stylish name at the bottom, natural light, the green lanyard glow, the ring opening into Home). #220 merged the
plan (docs only, no deploy). Nothing else open from this chat.

## Still owed by Jose (from earlier chats; ask once, then move on)

The five phone screenshots and the meter numbers for the feel audit (`docs/feel-audit.md`); publishing
`firestore.rules` in the Firebase console (K2, and the credits rule from #218); one memory-trainer round with
Auto-mark on (M5).
