# HUMC Interpreter Hub – laptop motion reel

A recreation of the "laptop on a glossy table" motion reel, built entirely in code with HyperFrames + Three.js. 18.4 s, 1080×1920, 30 fps, no audio.

## How the original is built (reverse-engineered)

1. **Screen content is code.** Each 1.5–2 s scene is a web animation (Canvas/CSS/GSAP, Three.js for the 3D grid). The corner HUD labels, timecode and mono type are the giveaway.
2. **It's rendered frame by frame**, not screen-recorded: a headless browser seeks to each frame and FFmpeg encodes them (HyperFrames or Remotion).
3. **The laptop shot is a separate layer.** The caption and logo reflect in the table, so they live in the 3D scene (or the whole top half was flipped and faded). Here everything is one Three.js scene: procedural laptop, mirror floor with a fade layer on top, the screen's own light spilling onto the keys and table, and a slow camera push.

## Files

- `src/config.js` – every word on screen, the caption, colors and duration. Change text here.
- `src/screen2d.js` – the screen scenes (signal line, title, kinetic type, dashboard, particles, UI card, metaball blob, end card) and the scene timing table `SCENES`.
- `src/cubes.js` – the rippling cube grid with the glass orb (scene 3).
- `src/main.js` – laptop, floor reflection, lights, camera drift (`CAM`), end overlay.
- `index.html` – fonts, layers and the HyperFrames root.

Everything is a pure function of time (`hf-seek` event), so any frame renders identically.

## Commands

```bash
npm install                      # once
npx hyperframes preview          # live Studio preview
npx hyperframes render -o out/reel.mp4 -q high
```

On a machine without the bundled Chrome, run `npx hyperframes browser ensure` first. Fonts (Inter Tight, Instrument Serif, JetBrains Mono, all OFL) are in `fonts/`, and Three.js and GSAP are in `vendor/`, so rendering needs no network.

## Retiming to music

Scene boundaries are in `SCENES` in `src/screen2d.js`. To cut on beats, run `npx hyperframes beats <track>` and copy the beat times into the `start`/`end` values, then add an `<audio>` clip in `index.html`.
