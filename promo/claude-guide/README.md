# Build apps with Claude: the animated guide

Jose's ask (2026-10-29): an animated video, with a voice, that teaches his friends how to build apps
and websites with Claude, using the Hub's own pictures. Four short vertical chapters (1080x1920,
30 fps), Dr. Smiley as host, about 4.5 minutes in all. Not part of the app: the deploy skips
`promo/`, nothing loads this folder.

| Chapter | File | Length | What it teaches |
|---|---|---|---|
| 1 | `ch1.html` | 63 s | Claude is your junior developer: plan first (and what it will NOT do), one small thing at a time, check its work, say what's wrong |
| 2 | `ch2.html` | 49 s | Profile instructions: tell Claude once how to talk to you |
| 3 | `ch3.html` | 73 s | CLAUDE.md: the project's rulebook, `/init`, keep it short |
| 4 | `ch4.html` | 74 s | Handoff: context and tokens, why long chats cost more, start fresh with a one-page note |

The plan, who it's for, what it doesn't do and the facts checked against Anthropic's own pages:
`BRIEF.md`. The words, line by line with the picture for each: `SCRIPT.md`. The prompts that
drove it: `PROMPTS.md`.

## Jose's picks

- Look **A, sticker book** (`styles.html` has both looks he chose between): cream paper, die-cut
  stickers with a white edge, Fredoka, captions on a white card, key words under a pink highlighter
  (dark text on it: 8:1, not coloured text, which measured about 4:1).
- Voice **"puckwarm"**: Kokoro's Puck (`am_puck`) at normal speed, each script line read in one go
  with a breath between, a little warmth and a very light room (`tools/voice.py`). Slowed down
  (0.92) it sounded robotic.
- Script line 1.2: "He works at Hackensack", no job title.
- No HMH logo, no Hackensack photo, no real names: the app's top bar is cropped off its screens,
  Home isn't shown, and the screens come from the tests' fake data (`tools/capture.cjs`).

## How it's made

Each chapter is one page on one paused GSAP timeline, the HyperFrames format (`hyperframes.json`;
`window.__timelines.main`), built on a shared kit:

- `kit/kit.js`: Dr. Smiley built as the app builds him (`drSmileyArt` in
  `features/smiley-engine.js`): his mouth follows the voice's loudness frame by frame, he blinks,
  and acts (`mouth()`); sentence captions that change on the voice's own pauses (`captions()`);
  sticker pops, stamps, the robot; every sound cue recorded in `window.SFX`.
- `voice/ch<N>.beats.js` (from `tools/beats.py`): each line's sentences placed on the real
  pauses in the audio, and the voice's loudness at every frame.
- A timed `fromTo` paints its start values from the first frame, before its time. For anything
  that starts visible (a ripple, a thing that falls out of the bag), use `tl.set` then `tl.to`.

## Commands

From the repo root unless said. The voice needs a venv with `kokoro-onnx` and `soundfile`, and
Kokoro's files, which `hyperframes tts` downloads once (`promo/hub-blend/BRIEF-60s.md`, "Voice").

```
<venv>/bin/python promo/claude-guide/tools/voice.py [N ...]   # voice/ch<N>.wav + .m4a, voice/cues.tsv
<venv>/bin/python promo/claude-guide/tools/beats.py N ...     # voice/ch<N>.beats.js
node promo/claude-guide/tools/capture.cjs                     # the Hub's screens, fake data
cd promo/claude-guide
node tools/stills.cjs N out/sheet.jpg 3.5 9 20                # stills at those seconds, one sheet
node tools/mix.cjs N                                          # sound cues under the voice
node tools/draft.cjs N                                        # 720x1280 draft, out/ch<N>-draft.mp4
node tools/draft.cjs N 1                                      # finished chapter, renders/ch<N>.mp4
node tools/cards.cjs && node tools/join.cjs                   # renders/claude-guide.mp4, all four
```

`voice.py` also writes each `voice/ch<N>.m4a`; the `.wav`s aren't kept (`.gitignore`).

`draft.cjs` seeks the same timeline HyperFrames would and screenshots each frame, then joins them
with ffmpeg. Here a 720x1280 draft took 2-4 minutes per chapter; HyperFrames took 51 minutes for
the 60 s promo at full size, so the drafts and the finished chapters were both made this way. The
pages still render in HyperFrames (`npx --yes hyperframes@0.8.181 render -c ch1.html`), with the
voice and sound cues as their two `<audio>` tracks.

## Files kept

- `renders/ch1.mp4` … `ch4.mp4`, `renders/claude-guide.mp4`: the finished videos.
- `assets/`: Dr. Smiley's art, the pins and the app icon (copies), the Hub's screens.
- `sfx/`: the starter kit's sounds (its README says "Use them anywhere").
- `fonts/`: Fredoka and Inter, both SIL Open Font License (licences beside them).
- `vendor/gsap.min.js`: GSAP 3.12.5.
