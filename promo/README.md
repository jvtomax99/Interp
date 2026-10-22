# promo: the Hub's videos, written in code

[Remotion](https://www.remotion.dev) 4 project. Not part of the app: the
deploy skips this folder (`.vercelignore`), and nothing in `index.html`
loads it. Finished videos go to `media/` by hand.

```
cd promo
npm install
npm run studio      # preview in the browser, scrub the timeline
npm run render      # writes out/hub-title.mp4
```

In a cloud session, point it at the preinstalled Chromium instead of
letting it download one:

```
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npm run render
```

`src/Root.tsx` lists the videos (compositions); `src/HubTitle.tsx` is a
3-second starter title card in the app's colours, 1280 x 720 at 30 fps
like `media/hub-promo.mp4`.

Licence (`node_modules/remotion/LICENSE.md`): free for individuals,
non-profits and companies of up to three people; other for-profit
companies need a paid company licence.

## ost/: the soundtrack, "Built Here"

The promo's music, written as a score in code: `ost/score.py` writes a MIDI
file whose every note is timed to the video's cuts (listed at the top of
the file; a new card every 3 s is one bar at 80 beats a minute), and
`ost/instruments.py` plays it through real recorded instruments (sfizz,
an SFZ player): Salamander Grand Piano for the piano and VSCO 2 Community
Edition for strings by section, trumpet, horns, trombones, contrabass
pizzicato, harp, glockenspiel and the Latin percussion (congas, bongos,
claves, cowbell, guiro, cabasa, snare and crash), balanced, placed left to
right and put in one room. `ost/synth.py` adds what an orchestra library
doesn't have: an 808 sub-bass, kick, clap and hi-hat, risers, impacts and
the silent cuts before each slam. `ost/render.sh` packs it to -14 LUFS and
lays it under `media/hub-promo.mp4`. Output goes to `ost/out/` (not in
git); `media/` is replaced by hand once the result is approved.

Credit that must go with the video (its description is enough):
"Piano: Salamander Grand Piano by Alexander Holm (CC BY 3.0)". VSCO 2 CE
is CC0 and sfizz is BSD 2-Clause; neither asks for anything.

```
ost/fetch-libs.sh   # once: the libraries (~3 GB) and the player, into ost/libs/
ost/render.sh       # out/built-here.wav, out/hub-promo-ost.mp4
```

To change the music, edit the notes in `score.py` and render again. If the
video is re-cut, re-measure its cuts first
(`ffmpeg -i ../media/hub-promo.mp4 -vf "select='gt(scene,0.12)',showinfo" -an -f null -`)
and move the times at the top of the file.
