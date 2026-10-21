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
