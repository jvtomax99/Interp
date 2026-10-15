# Dr. Smiley: how he moves

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

The art (`drsmiley/*.webp`) is described in `CLAUDE.md`'s file map. Rules:

- **Dr. Smiley moves only through his controller.** One `DrAnim` per
  character (`drAnim(svg, {head})`) owns his face frame, gaze, lean and
  effects, with priorities (`DR_P`: IDLE < GAZE < REACT < DIRECT). Ask it to
  `play()` / `talk()`; don't set frames or animate his pin yourself (the Home
  greeting only places him while he grows in, then plays `greet` on the
  engine). Interruptions walk through in-between frames (`DR_FACE_BACK`);
  a sequence whose consecutive frames aren't neighbours gets them filled in.
  Reduced motion, a hidden page and a detached svg are handled there.
- **Don't move him with a paused animation you seek by hand.** The Home
  greeting used to grow him in with a paused Web Animation whose
  `currentTime` was set every frame, while his breathing (a CSS animation on
  the same element) ran beside it. On an iPhone he could stay drawn at its
  first frame, 8% of his size, for the rest of the hello (never seen in
  Chromium). The entrance is now written straight onto him each frame
  (`placeFace` in `home-polish.js`) and breathing waits until he has landed
  (`.home-wave-entering`).
- **His size is one number per place** (`home-polish.css`): `--ds-k` for
  the dock button (Jose picked 58/48: his disc is the tab bar's height,
  centred on its middle line, 14px from the edge) and `--hw-size` for the
  Home greeting (1.5: a 90px face, centred on the name). Inside him
  everything is still drawn at the old size and scaled. His sway pins the
  pivot (`smileySway`: 50% 92% dock, 50% 85% Home), so a scale must be
  moved back (dock: the bob's left/top; Home: `translate`), or he drifts
  up. In the greeting he has one fixed place whatever the name (block
  "Dr. Smiley's own place", end of `home-polish.css`; Jose's call): on a
  phone the name has the line under "Good morning" to itself (`--hw-line`,
  so a long name's smaller face sits on the same baseline) and he stands
  under it near the right edge (`--hw-left`: 48px in, Jose's pick B, clear
  of the lamp post), his thought cloud opening to his left
  (`createThought`, `is-left`); on a computer he is 48px in from the right end of the
  name's line, the cloud to his right. He is never resized for a name:
  `fitWave` shrinks a name too wide for its line instead.
- **Five performances, built fresh each play.** `DR_PERF` (greet, ack,
  think, cheer -- also called celebrate -- and wink) sits in `DR_FACE_SEQ` as
  getters, so every play varies a little (side, amplitude, beats) with an
  anticipation, one main gesture and a recovery. Each builds its own Focused
  version (smaller, no laughter, no effects); Still uses its `still` frame.
  `drPerfSeed(n)` makes the variant repeatable for tests. Movement is only a
  tilt and a lift of what holds him: never a sideways slide, never a squash or
  stretch (the Home greeting's old squish was removed; he now grows in whole
  and greets with `greet` on the engine). The one wink is his left eye, so a
  wink always tips toward it. Effects are short and land on the moment
  (`DR_FX_LIFE`: burst, glint, question).
- **His personality comes from task states, not timers.** `drTask(kind)`
  (available, attentive, processing, answering, celebrating, uncertain;
  offline, appointment and resting follow the phone) is one state for the
  whole app; each controller runs that state's hold (thinking while Ask works,
  reading an answer with you) at `DR_P.TASK`, so idle can't interrupt it.
  React by meaning: `smileyReact(kind)` for team news, `smileyStudy()` for a
  study result, `askReact()` for an Ask outcome (`askOutcome`: verified only
  when a source checks out locally, never `fromHub` alone; the card's
  provenance label is untouched). No mouth movement for silent text: `talk()`
  is for real audio only. Lively / Focused / Still is `setSmileyMode`
  (`ih_smileyMode`); the phone's reduced motion always means Still.
- **Home's decor: what loops, what settles** (S1 in `docs/PLAN.md`, then
  Jose's call, 2026-10-15). The petals and the heartline are part of the
  look and loop forever; everything else settles. Petals: one canvas per
  place (banner, rank card), painted from a Web Worker on an
  OffscreenCanvas (`petalPainter`, home-polish.js, S1b; the same painter
  runs on the page where a phone lacks OffscreenCanvas), drawn from the old
  keyframes' math with the same seeded values and artwork. The page only
  tells it sizes and whether each place is seen (`syncPetals`); it stops
  while hidden, scrolled away, and rests under reduced motion. They used to
  be one animated element each (Chrome re-layered Home every frame); a
  frame loop on the page was worse still (a full Home frame 60 times a
  second), hence the worker. Settles: the Ask badge's breeze
  (`BREEZE_S`, then `askBadge`'s loop ends once it hangs still; a pet or a
  new hello swings it again), one halo glow per arrival (`askHalo`), the
  rank card ring glows on arrival only. Breathing, drift and the halo's turn
  are compositor-only. Don't add an endless JS loop on the page (the petals'
  runs in their worker, only while they are seen) or per-item `will-change` on Home;
  `tests/suites/home-rest.cjs` checks it.
