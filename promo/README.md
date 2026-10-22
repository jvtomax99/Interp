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
`ost/render.sh` plays it through the FluidR3 GM sound bank (piano and
strings over a son/salsa groove: clave, congas, bongos, cowbell, guiro,
timbales, tumbao bass, piano montuno, nylon guitar, brass, and hard string
stabs, hats and backbeat in the manner of an anime fight track), adds what
the bank can't make with `ost/synth.py` (an 808 sub-bass, risers, impacts,
and the silent cuts before each slam), packs it to -14 LUFS and lays
it under `media/hub-promo.mp4`. Output goes to `ost/out/` (not in git);
`media/` is replaced by hand once the result is approved.

```
apt-get install fluidsynth fluid-soundfont-gm && pip install mido
ost/render.sh       # out/built-here.wav, out/hub-promo-ost.mp4
```

To change the music, edit the notes in `score.py` and render again. If the
video is re-cut, re-measure its cuts first
(`ffmpeg -i ../media/hub-promo.mp4 -vf "select='gt(scene,0.12)',showinfo" -an -f null -`)
and move the times at the top of the file.
