# Brief: the 1-minute promo

Jose's ask (2026-10-25): "redo the promo video, all 1 minute". This file is the plan; a fresh
chat can work from it alone. The 45-second remake it grows from is `BRIEF.md`, `NOTES.md` and
`remake-final.html` here.

## Decisions (Jose, 2026-10-25, all picked on buttons)

- **Look:** the same 3D remake (this folder, `remake-final.html`, `src/remake/`), extended to
  60 s with new shots. Not the Liquid Glass look of `promo/whats-new/`.
- **Voice:** a new AI narrator, Kokoro through HyperFrames. **Michael** (`am_michael`) for the
  English; the Spanish words read by **Dora** (`ef_dora`), so "Insuficiencia cardíaca" is said
  in Spanish. Jose heard both samples (Michael and Heart) and picked Michael.
- **Music:** v11's track with its old narrator taken out by Demucs (AI source separation), then
  stretched to 60 s. A sample goes to Jose before anything is built on it. If it sounds watery,
  fall back to a royalty-free track he sends.
- **Where it goes:** a separate file. The app keeps `media/hub-promo.mp4` (45 s), so no User
  Guide change. The 1-minute video is kept in `promo/hub-blend/renders/`.

## Why the audio has to be rebuilt

`assets/music-remake.m4a` is v11's mixed track: music **and** v11's narrator (`tools/music.py`
says so). The picture follows that narrator's clock (`HOOK_MAP` in `src/remake/main.js`, then
one feature every 3 s, `FEATURE_LEN`). A new narrator means a new clock. Make each line its own
clip (`hyperframes tts` per line), so every line's length is known exactly, and time the shots
from that cue list instead of `HOOK_MAP`.

## Steps (one at a time; Jose reviews each)

1. **Music sample.** Demucs on v11's track (`media/hub-promo.mp4`'s source is
   `assets/music-remake.m4a`), keep the "no vocals" stem, a 15 s sample to Jose.
2. **Script, 60 s.** v11's lines word for word where they still fit, plus about 15 s of new
   features. Candidates, from the User Guide's New lately (`GUIDE_NEWS`): Notifications, your
   knowledge brain. Jose approves the words before any voice is made.
3. **Voice.** Each line in Michael (Spanish words in Dora), joined, played over the music sample.
   To Jose.
4. **Shot table** for 60 s: the 45 s shots on the new clock, plus the new ones in the same 3D
   style (screens from the app via `promo/whats-new/tools/capture.cjs` or
   `tools/capture-layers.cjs`). Stills at phone size first.
5. **Draft render** at 540x960 (`remake.html`), then the final at 1080x1920
   (`remake-final.html`).
6. **Sound effects** (`tools/sfx.cjs` and `assets/sfx/`): cue times re-read off the new frames.

## How to run things (proved 2026-10-25)

- Kokoro: `python3 -m venv <dir> && <dir>/bin/pip install kokoro-onnx soundfile`, then
  `HYPERFRAMES_PYTHON=<dir>/bin/python HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.181 tts "text" -v am_michael -o line.wav`.
  The first run downloads the voice data (~27 MB). Output is 24 kHz WAV.
- Render: `HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
  (the 1194 path in `NOTES.md` is gone from this container). Time: 31 s at 1080 took 48 min on
  2 cores (`NOTES.md`); the 15 s 2D video took about 18 min. Expect 1.5 to 2 hours for 60 s of 3D.
- Run `npx hyperframes@0.8.181 lint` before every render. It caught two real errors on the What's
  new video: an `<audio>` without an `id` renders silent, and a timed `<video>` inside a timed
  element gets the wrong frames.

## Not proven yet

- Demucs: not installed, not tried; it needs PyTorch (a big install) and may sound watery.
- Kokoro's pacing over a full minute: only a 13 s sample has been heard.
- New 3D shots for Notifications and the knowledge brain: not designed.
