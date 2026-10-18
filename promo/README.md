# Team promo video

A 30-second vertical (1080×1920) promo for the interpreter team, made with
Tesseract (installed in every cloud session by `.claude/hooks/session-start.sh`).
Not part of the app: `.vercelignore` keeps this folder off the live site.

`hub-promo-v1.mp4` is version 1 (no voice, sound accents only), `hub-promo-v2.mp4`
adds the narration, `hub-promo-v3.mp4` (current) is the re-edit below. `build.py`
now builds v3; v1 and v2 are in git history.

## What's in it (v3, 2026-10-18)

Cut to a 120 BPM music bed: every change lands on a beat (500 ms grid).

| Time | Scene |
|---|---|
| 0–4.4 s | Hook: "heart failure"; "fallo cardíaco" is struck out ("Avoid with patients", the app's own caution on that term); "insuficiencia cardíaca" slams in on the drop at 3.0 s |
| 4.4–6.4 | Hub icon spins in, "Interpreter Hub", "for the HUMC interpreter team" |
| 6.5–24.5 | Phone with six real screens, 3 s each: Home, Emergency glossary, Translate, doctor page, Ask the Hub, Daily Drill. Each beat whips in its screen, pushes in on the one detail that backs the line, rings it in cyan and pulls out. Two-line masked headlines, a story-style progress bar. Stickers: "Told you." on Translate (callback to the hook), Dr. Smiley's "I'm a cartoon. I don't sleep." on Ask |
| 24.5–30 | End card: Dr. Smiley, the address, "Add to Home Screen", a "¡gracias!" sticker on the last word |

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

`shots/` holds the six screens at iPhone size (393×759 at 3×). From `tests/`
(after `npm install`):

- Home: `node ../promo/capture-home.cjs ../promo/shots`
- Emergency and Translate ("heart failure" typed in): `capture-glossary-translate.cjs`
- Doctor page with the made-up doctor: `capture-doctor.cjs`
- Ask the Hub: `tests/out/journey/2-prep.png` after `node run.cjs journey`
- Daily Drill: `tests/out/drill/390-L1-light-ace-r1-result.png` after
  `node run.cjs daily-drill`, cropped to its bottom 2259 px

## The voice (v2, rewritten for v3)

The voice is Kokoro (an open voice model
that runs on this machine, no account or key), voice `am_puck`, speed 1.0:
the same narrator as Jose's CPA/EA guide video. That was measured, not
guessed: every Kokoro English voice read the guide's first two captions word
for word, and `am_puck` matched the real recording far closer than any other
(MFCC distance 0.14 vs 0.32 for the next; same length and pitch).

`narration.json` is the script, one line per beat (`start_ms`, `max_ms`). A line
with `parts` mixes languages: "Not" in English, "fallo cardíaco" in Spanish,
joined with a 120 ms breath. `build.py` finds that join in the WAV to time the
strike-out and the ¡gracias! sticker to the spoken word.
`voice/` holds one WAV per line, made by `voice.py`:

```
python3 -m venv /tmp/kk && /tmp/kk/bin/pip install kokoro-onnx soundfile
mkdir -p /tmp/kkm && cd /tmp/kkm && for f in kokoro-v1.0.onnx voices-v1.0.bin; do \
  curl -fsSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done
/tmp/kk/bin/python promo/voice.py /tmp/kkm     # prints each line's length against its max
```

 The share copy is encoded with
`-t 30 -af "loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000"`: v2 measures
v3 measures -15.5 LUFS, true peak -1.4 dBTP. The Spanish line is the same English voice
reading Spanish; if it sounds accented, `em_alex` is Kokoro's native Spanish
male voice for that one line.

Unheard by Claude: the checks above prove level and timing, not how it sounds.

## The music (v3)

`sfx/music.wav` is synthesized by `music.py` (numpy only: no samples, no
service, so nothing to license): 120 BPM, C–G–Am–F, pad and a pulse for the
hook, drums and bass from the 3.0 s drop, thinning out on the end card.
`build.py` puts it under everything at 0.7 and ducks it to 0.35 (-6 dB)
while the voice talks (a `volume` animator built from the voice timings), so
the voice sits about 10 dB above the bed.

The export takes about 145 s with motion blur.
