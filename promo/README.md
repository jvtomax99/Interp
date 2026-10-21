# promo: the Hub's 45-second video, written in code

[Remotion](https://www.remotion.dev) 4 project that makes
`media/hub-promo.mp4` (720 x 1280, 30 fps, 45.1 s). Not part of the app:
the deploy skips this folder (`.vercelignore`), and nothing in
`index.html` loads it. The finished file is copied to `media/` by hand.

```
cd promo
npm install
npm run shots       # fresh phone screenshots of the app (needs the tests' Playwright)
npm run studio      # preview in the browser, scrub the timeline
npm run render      # writes out/hub-promo.mp4
```

In a cloud session, point it at the preinstalled Chromium instead of
letting it download one:

```
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

What is where:

- `src/Promo.tsx`: the film. The hook (the doctor's words, the 0.31 s
  clock, "¿Fallo cardíaco?" struck out, "Insuficiencia cardíaca", the
  logo), nine 3-second app screens (`SCREENS`: screenshot, line, coloured
  pill), then the campus with Dr. Smiley. Cut times follow the soundtrack.
- `src/DrSmiley.tsx`: Dr. Smiley drawn as the app draws him
  (`drSmileyArt`): base, one face frame from the strip, brows.
- `capture/shots.cjs`: boots the app in the test harness (Firebase and the
  AI stood in for, a made-up doctor and chat seeded) and saves
  `public/shots/*.jpg`. Re-run it after the app's look changes.
- `public/art/`: copies of the app's art (campus photo, HMH mark, Dr.
  Smiley's layers), Inter, and `music.m4a`, the soundtrack taken from the
  first cut of the video.

Licence (`node_modules/remotion/LICENSE.md`): free for individuals,
non-profits and companies of up to three people; other for-profit
companies need a paid company licence.
