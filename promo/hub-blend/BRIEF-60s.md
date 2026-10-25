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

## Done so far (2026-10-25)

- Draft render of the 60 s cut, voice only: `hyperframes render -c remake-60.html -w 3` took 16 min 40 s
  at 540x960 on 4 cores (`out/`, not kept in git). Lint: copy `remake-60.html` alone into a scratch
  folder as `index.html` (with the folders linked), since the project has several root pages.
- Sound effects for the cut: `node tools/sfx.cjs --60` (`assets/sfx-60s.m4a`, 21 cues read off the draft's frames).
- Final render, voice and effects, no music: `renders/hub-promo-60s.mp4` (1080x1920, 51 min 27 s on 4 cores).
  `renders/` is kept out of git (`.gitignore`), so a new chat renders it again from `remake-60-final.html`;
  Jose has the file.
- Music (Jose heard the 15 s sample: "clean, use it"): `assets/music-60s.m4a`, from
  `tools/music60.py` (six bars of the middle played twice, one join at 25.70 s, starts at 1.18 s so
  its last notes land on "Safer Care." at 57.08 s). Mixed 12 dB under the voice as in v11 (voice
  -17.3 LUFS, music set to -29.3), under the render's own voice and effects, picture copied
  (`-c:v copy`).

## Not proven yet

- Removing v11's narrator (done 2026-10-25): Demucs' model host (dl.fbaipublicfiles.com),
  Hugging Face and download.pytorch.org still answer 403 here. What works instead:
  `pip install "audio-separator[cpu]" audioread standard-aifc standard-sunau` in a venv, then
  `audio-separator v11.wav --model_filename UVR-MDX-NET-Inst_HQ_3.onnx --single_stem Instrumental`
  (it fetches its 67 MB model itself; about 1 min on 4 cores). The music sat 12 dB under v11's
  narrator (-33 against -21 LUFS); a second pass with `UVR-MDX-NET-Voc_FT.onnx` finds voice left
  at -62 LUFS, 29 dB under the music. Jose: "clean".
- Voice, locked (Jose, 2026-10-25, draft 2): draft 1 (one clip per line) sounded robotic, so
  the script is read in 7 long passages (`assets/voice-60s/groups.tsv`, Michael at `-s 0.92`,
  the two Spanish lines in Dora), joined to end at 56.3 s: `assets/voice-60s.m4a`. Passage
  starts and the pauses inside each: `voice-cues-60s.tsv` (silencedetect at -40 dB, 0.18 s;
  it misses some line breaks, so read the exact cut points off the waveform in step 4).
  Cloud voices (Microsoft, ElevenLabs, OpenAI) are blocked here too.
- Kokoro's pacing over a full minute: only a 13 s sample has been heard.
- New shots for Notifications and the knowledge brain: built as desk shots, stills only so far (`SHOTS-60s.md`).
- The feature shots play on one desk (`desk.js`); the 3D Body was never cut, it played inside the Glossary.
