# Team promo video

A 30-second vertical (1080×1920) promo for the interpreter team, made with
Tesseract (installed in every cloud session by `.claude/hooks/session-start.sh`).
Not part of the app: `.vercelignore` keeps this folder off the live site.

`hub-promo-v1.mp4` is version 1 (no voice, sound accents only).

## What's in it

| Time | Scene |
|---|---|
| 0–3.6 s | Hook: "heart failure" turns into "insuficiencia cardíaca" |
| 3.6–5.8 | Hub icon, "Interpreter Hub", "for the HUMC interpreter team" |
| 5.8–25 | Phone with six real screens, 3.2 s each: Home, Emergency glossary, Translate, doctor page, Ask the Hub, Daily Drill. A heading and a floating chip each; Dr. Smiley pops up on the Ask beat |
| 25–30 | End card: Dr. Smiley, the address, "Add to Home Screen" |

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

## Next: the AI voice (Jose's pick, 2026-10-18)

`narration.json` is the script: one line per beat, with where it starts and
how long it may run. One voice reads both the English and the Spanish.

Plan: ElevenLabs, model `eleven_multilingual_v2` (one voice that handles
English and Spanish). It needs, in the cloud environment's settings:

1. An ElevenLabs API key as the environment variable `ELEVENLABS_API_KEY`.
2. `api.elevenlabs.io` allowed under Network access.

Then, in a new session: list a few voices and send Jose short samples to
pick from; generate each line; trim silence; if a line runs past `max_ms`,
rephrase it rather than speed it up; import each as an Audio layer at its
`start_ms`; lower the sound accents under the voice (about −6 dB); measure
loudness (aim −16 to −14 LUFS, true peak under −1 dBTP); export v2 and send
it to Jose before anything else.
