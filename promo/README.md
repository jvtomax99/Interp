# Team promo video

A 45-second vertical (1080×1920) promo for the interpreter team, made with
Tesseract (installed in every cloud session by `.claude/hooks/session-start.sh`).
Not part of the app: `.vercelignore` keeps this folder off the live site.

Versions: `hub-promo-v1.mp4` (no voice), `v2` (narration), `v3` (re-edit to a beat,
30 s), `v4` (45 s, new intro), `v5` (v4, voice warmed up), `v6` (for the CEO pitch), `v7` (v6 with the
Chatterbox voice), `v8` (v7, "Safer care." retaken), `v9` (Jose's pick of take), `v10` (the Spanish lines
with a Latino accent), `v11` (on-screen capitals fixed), `hub-promo-v12.mp4` (current: more colour,
motion and Hackensack). `build.py` builds v12; older builds are in git history.

## How the chats run (Jose, 2026-10-19)

The promo work lives in chats named **Inter hub video guide ( Tesseract )**, on branch
`claude/voice-chatterbox-v7-0ks20a`. When a chat gets heavy, Claude starts the next one
under that same name (pointing it at this README), then archives the old one. Jose gave
standing permission for that.

## v7: the Chatterbox voice (2026-10-19)

v6's edit, script and timings, read by Chatterbox (`voice_chatterbox.py`) instead of
Kokoro. The Kokoro takes stay in `voice/kokoro/`.

- **Fitting.** 13 of 18 lines fit `max_ms` on the first take. A line's `cb.seed` in
  `narration.json` picks its take; seeds repeat exactly, so a rerun gives the same
  audio. Lines 0 and 5 got shorter seeds; line 5 also starts 100 ms earlier (7.7 s, still
  ending by 9.55 s) and line 1 10 ms earlier.
- **Word check.** Every take was transcribed with Whisper (`small`). Retaken for that:
  line 2 ("¿Fallo cardíaco?" came out "Fayo caliaco"), line 6 ("HUMC's" came out
  "ITUMC's"; now written `H.U.M.C.'s`, which read right in 3 of 3 seeds against 2 of 4)
  and line 12 ("staff" came out "stuff").
- **Trim.** The multilingual model can trail up to 2 s of low noise and open on a
  quarter second of hiss; `trim()` now works on a loudness envelope (see its docstring).
- **WARM, measured.** Chatterbox's 60-300 Hz already matches v6's warmed Kokoro (within
  0.3 dB), its 1-5 kHz runs 5 dB hotter and its loud/soft spread is 15 dB against 11.5.
  So the chain keeps the 3 kHz cut and the compression and drops the 180 Hz boost and the
  room echo (`WARM` in `build.py`).
- **Voices.** Both are Chatterbox's built-in male voice: English at a 115 Hz median, as
  `am_puck`; Spanish at 142-200 Hz, so the interpreter still sounds like a second person.
  Line 2 now rises at the end (204 to 222 Hz); Kokoro's fell.

Unheard by Claude: Whisper and the measurements prove words, timing and level, not how
natural it sounds.

**v8** (2026-10-19): Jose heard "Safer care." end rising. Retaken from 14 takes (seeds
30-39, and 30-33 at exaggeration 0.4): seed 32, 1530 ms, falls 4.6 semitones on "care".
Automatic pitch tracking is shaky on this voice (pyin marks few frames voiced, YIN jumps
octaves), so his ear is the test; seeds 33 and 35 were the runners-up. -15.0 LUFS, -1.0 dBTP.

**v9** (2026-10-19): Jose picked seed 33 by ear (1790 ms). Nothing else changed.

**v10** (2026-10-19): Jose: the Spanish didn't sound right, make it more Latino. Cause:
the multilingual model was copying its built-in English voice, and Resemble's own notes
say the accent of the reference clip carries over. Now both Spanish lines take
`voice/ref_es_ald.wav` as their reference: 14 s of Mexican Spanish from Piper's
`es_MX-ald-medium` (public-domain dataset, es-419 pronunciation; how to remake it is in
`voice_chatterbox.py`). He heard four options and picked it ("C"). Whisper: line 2 Spanish
at 0.98 (v9's read as Italian, 0.35), line 4 at 0.93. Line 4 ran 30 ms long, so it is sped
up 4.5% (`cb.tempo`, ffmpeg atempo, pitch kept) and line 5 starts at 7.71 s. The interpreter
is now audibly a different man from the narrator. -15.1 LUFS, -1.2 dBTP.

**v11** (2026-10-19): Jose: "Insuficiencia" was lower case; check all the grammar. The hook's
quoted words now start with a capital: "Heart failure", "¿Fallo cardíaco?" (Spanish capitalises
after ¿), "Insuficiencia cardíaca". The barrage's "beta blocker" is now "beta-blocker". Every other
line on screen and in `narration.json` was read and left as is. Audio unchanged. (First encoded
without `loudnorm`, at -20.7 LUFS; re-encoded at -15.1.)

**v12** (2026-10-19): Jose: more dynamic, more Hackensack, more exciting, more colours. His picks:
the campus photo, the hospital's blues with bright pops, more motion graphics (not faster cuts,
music or type). Same script, voice, music and timing as v11. Added in `build.py`:

- **Colour.** `BRIGHT`: one colour per phone beat (coral, gold, mint, pink, violet, orange, sky,
  lime, cyan) on that beat's headline bar, detail ring and a glow behind the phone. The hook gets a
  coral glow on the wrong word, mint on the right one, gold on the title. `BLUES` are the HMH blues.
- **Shapes.** Sixteen squares and diamonds (the HMH mark's two pieces, not the logo) drift round
  the edges, dim until the drop, then pulse every half bar. Bursts of them on "Heart failure",
  on the drop and on "Safer care." The Hub icon gets twelve that fly in and form a ring.
- **Wipes and streaks.** Five slanted colour bands cover the frame at the two scene changes (into
  the title, into the end card). Three light streaks cross on each phone screen change.
- **Hackensack.** The end card is the campus photo (`hero.jpg`, the pink tree and the HUMC sign)
  on "Built here, for our patients", with a HACKENSACK UNIVERSITY MEDICAL CENTER caption, a strip of
  the blues under it, Dr. Smiley standing on it, the text below. The sign stays clear of words and
  fades; the photo pulls back from its corner. The background marquee now reads Hackensack
  University Medical Center.

-15.1 LUFS, -1.2 dBTP.

## v6: for the pitch to the hospital's CEO (2026-10-18)

Jose: better word graphics, better voice acting; the audience is now HUMC's CEO.
Tone picked: confident, a little wit. Same 45 s structure as v4 (below), changed:

- **Script** (`narration.json`): staff-built, glossary first, physician prep,
  false friends caught before a patient, daily practice, national certification
  prep, one team channel with no patient details, Dr. Smiley answering from the
  team's own glossary; ends "Interpreter Hub. Built here, for our patients. /
  It's live today, on any phone. / Better words. Safer care." No numbers or
  outcomes are claimed that the app doesn't show. Cut as too flip for a CEO:
  "You're welcome", "A.I. gets the leftovers", "Cartoons don't sleep", "Told you."
- **Type**: `kline()` sets a line word by word (each word rises out of a mask
  with a small tilt, 70 ms apart, fading in as it goes; the mask alone did not
  hide words before they moved). Second headline lines sit on a cyan marker bar
  that wipes in first. `stack()` slams the hook's big words in line by line.
  Hook tags: THE DOCTOR / THE INTERPRETER / THE RIGHT WORD. End card: address,
  "Live today, on any phone", tagline with "Safer care." on the marker.
- **Voice**: still Kokoro (warmed) as a stand-in. Jose chose **Chatterbox**;
  it needs `huggingface.co` allowed in the environment's network settings
  (blocked on 2026-10-18). Next session: `voice_chatterbox.py` (UNTESTED,
  instructions at its top) regenerates `voice/` and keeps the Kokoro takes in
  `voice/kokoro/`; check each line still fits its `max_ms` (Chatterbox may run
  slower: shorten text or nudge `start_ms`), decide whether the `WARM` filter in
  `build.py` still helps (probably drop it for Chatterbox), rebuild, export.

## What's in it (v4, 2026-10-18)

Cut to a 120 BPM music bed: every change lands on a beat (500 ms grid).

| Time | Scene |
|---|---|
| 0–8.4 s | Hook. "The doctor says: heart failure", with a barrage of cardiology words behind it. "You've got half a second": a countdown runs 0.50s to 0.00s. The interpreter (a second voice, Kokoro's native Spanish `em_alex`) tries "¿Fallo cardíaco?"; struck out, "Nope. Not with patients." (the app's own caution on that term). A beat of silence, then "insuficiencia cardíaca" slams in on the drop at 6.0 s. "There it is." |
| 8.3–10 | Hub icon spins in, "Meet Interpreter Hub" |
| 10–37 | Phone with nine real screens, 3 s each: Home, Emergency glossary, Translate, doctor page, False Friends, Daily Drill, CoreCHI Practice, Team Chat, Ask the Hub. Each beat whips in its screen, pushes in on the detail that backs the line, rings it in cyan and pulls out. Two-line masked headlines, a story-style progress bar. Stickers: "Told you." (Translate, a callback to the hook), "constipado = a cold" (False Friends), Dr. Smiley's "I'm a cartoon. I don't sleep." (Ask) |
| 37–45 | End card: Dr. Smiley, "Built by our team, for our team", the address, the three Add to Home Screen steps popping in as they're said, "See you on the floor." on the last hit. English only |

Motion blur is on (composition setting plus the moving layers).

Screens are real app screens with the tests' sample data, never the live Hub.
The doctor page uses a made-up doctor (Dr. Elena Marín) on purpose: the test
fixture's name looks like a real Hackensack physician.

## Rebuild

```
cd promo
python3 build.py          # writes edit/promo.tsrct (fonts download on first run)
T=~/.local/share/Tesseract/bin/tsrct
$T filmstrip --project edit/promo.tsrct --start-ms 0 --duration-ms 30000 --interval-ms 2000 \
   --tile-width 270 --tile-height 480 --output edit/strip.png
$T export --project edit/promo.tsrct --encoder-backend external-ffmpeg-command \
   --ffmpeg-path "$(which ffmpeg)" --output edit/master.mp4
ffmpeg -i edit/master.mp4 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p \
   -af "loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 160k \
   -movflags +faststart hub-promo-vN.mp4
```

On Linux, MP4 export needs the system FFmpeg (the flags above); Tesseract's
own bundle has no H.264 encoder. The 30 s export takes about 100 s.

`build.py` is the whole edit: timings, copy, colours (the app's navy, accent
and cyan; Inter, the app's typeface), motion and sound. `lib.py` holds the
layer and keyframe helpers. The editable `.tsrct` is rebuilt, never committed.

## Re-capturing the screens

`shots/` holds the nine screens (plus spares) at iPhone size (393×759 at 3×). From `tests/`
(after `npm install`):

- Home: `node ../promo/capture-home.cjs ../promo/shots`
- Emergency and Translate ("heart failure" typed in): `capture-glossary-translate.cjs`
- Doctor page with the made-up doctor: `capture-doctor.cjs`
- Ask the Hub: `tests/out/journey/2-prep.png` after `node run.cjs journey`
- Daily Drill: `tests/out/drill/390-L1-light-ace-r1-result.png` after
  `node run.cjs daily-drill`, cropped to its bottom 2259 px
- Practice and False Friends: `capture-more.cjs ../promo/shots practice,falsefriends`
- Team Chat with five made-up messages (no patient details): `capture-chat.cjs`

## The voice (v2, rewritten for v3)

The voice is Kokoro (an open voice model
that runs on this machine, no account or key), voice `am_puck`, speed 1.0:
the same narrator as Jose's CPA/EA guide video. That was measured, not
guessed: every Kokoro English voice read the guide's first two captions word
for word, and `am_puck` matched the real recording far closer than any other
(MFCC distance 0.14 vs 0.32 for the next; same length and pitch).

`narration.json` is the script, one line per beat (`start_ms`, `max_ms`). A line
with `parts` is read part by part, joined with a 120 ms breath; `build.py` finds
that join in the WAV (line 1: "heart failure" slams in on it). A line can name
another `voice`: the two Spanish lines are `em_alex`.
`voice/` holds one WAV per line, made by `voice.py`:

```
python3 -m venv /tmp/kk && /tmp/kk/bin/pip install kokoro-onnx soundfile
mkdir -p /tmp/kkm && cd /tmp/kkm && for f in kokoro-v1.0.onnx voices-v1.0.bin; do \
  curl -fsSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done
/tmp/kk/bin/python promo/voice.py /tmp/kkm     # prints each line's length against its max
```

 The share copy is encoded with
`-t 30 -af "loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000"`: v2 measures
v4 measures -15.4 LUFS, true peak -1.3 dBTP. v3's Spanish words were the English voice reading Spanish and sounded off;
v4 gives them to `em_alex` and keeps the ending English only.

**v5, the voice warmed up** (Jose's pick from a comparison of seven, 2026-10-18):
`build.py` passes every line through a light EQ, compression and a touch of
room (`WARM` in `build.py`) into `voice/warm/`, which is what the edit uses.
The raw Kokoro files in `voice/` are unchanged. v5 measures -14.7 LUFS,
-1.3 dBTP. A more natural voice (Chatterbox, native Spanish too) needs
`huggingface.co` allowed in the environment's network settings; it was blocked.

Unheard by Claude: the checks above prove level and timing, not how it sounds.

## The music (v3)

`sfx/music.wav` is synthesized by `music.py` (numpy only: no samples, no
service, so nothing to license): 120 BPM, C–G–Am–F, pad and a pulse for the
hook with a clock ticking under the countdown, 250 ms of silence, drums and
bass from the 6.0 s drop, a clap fill into 25 s, thinning out on the end card,
a last hit on "floor".
`build.py` puts it under everything at 0.7 and ducks it to 0.35 (-6 dB)
while the voice talks (a `volume` animator built from the voice timings), so
the voice sits about 10 dB above the bed.

The 45 s export takes about 215 s with motion blur.
