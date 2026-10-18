# Team promo video

A 45-second vertical (1080×1920) promo for the interpreter team, made with
Tesseract (installed in every cloud session by `.claude/hooks/session-start.sh`).
Not part of the app: `.vercelignore` keeps this folder off the live site.

Versions: `hub-promo-v1.mp4` (no voice), `v2` (narration), `v3` (re-edit to a beat,
30 s), `v4` (45 s, new intro), `hub-promo-v5.mp4` (current: v4 with the voice warmed up). `build.py` builds v5; older builds are
in git history.

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
   -c:a aac -b:a 160k -movflags +faststart hub-promo-vN.mp4
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
