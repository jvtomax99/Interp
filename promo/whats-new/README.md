# What's new in the Hub: a 15-second video

Jose's ask (2026-10-25): a short vertical video in the Motion Graphics starter kit's Liquid Glass
style (Damiano Caudullo's kit), separate from the 45-second promo. It shows the User Guide's three
"New lately" cards (`GUIDE_NEWS` in `index.html`), one per scene, meant for posting in Team Chat.
Not part of the app: the deploy skips `promo/` (`.vercelignore`), and nothing loads it.

| Time | Scene | What's on screen |
|---|---|---|
| 0-2.2 | Title | The app icon, "What's new in Interpreter Hub" |
| 2.2-5.9 | Notifications | The real Notifications screen; a Team Chat notification drops in; three ticks: Team Chat, New training, Messages from the team's owners |
| 5.9-9.5 | Your knowledge brain | Term Review; its small brain opens out into the full brain; Lit, Red, Dim |
| 9.5-13.1 | The 3D film | 3.2 s of `media/hub-promo.mp4` in a glass card: the 3D Body, the campus, Dr. Smiley's brain |
| 13.1-15 | End | Interpreter Hub, "All three are in the User Guide, under New lately", the address |

The look is the kit's Liquid Glass (frosted cards, drifting light, calm `power3.out` rises, nothing
bounces) in the app's own colours and font (Inter, the app's own file). Sound: the kit's effects
only, no music: a pop for the icon and the notification, a tick per tick, a soft switch as the brain
opens, a chime on the end.

## Files

- `index.html`: the whole video (layout, words, the GSAP timeline, the sound clips).
- `assets/notifications.webp`, `review.webp`, `brain.webp`: the app's screens, from
  `tools/capture.cjs` (this checkout with the tests' stand-ins). The brain is lit by a made-up
  record (about half the terms known); the stand-in database has none.
- `assets/film.mp4`: cut from `media/hub-promo.mp4` (13.3-14.4 and 28.9-30.0 s, then 34.92-35.42 s, the brain, slowed to half speed; its
  captions cropped off). The ffmpeg line is in the commit that added it; recut it if the promo changes.
- `fonts/`, `sfx/`, `vendor/gsap.min.js`: Inter (OFL), the kit's sounds, GSAP 3.12.5.

## Commands

```
node promo/whats-new/tools/capture.cjs                 # the app's screens again
node promo/whats-new/tools/stills.cjs out/stills.jpg 1.6 4.95 8.8 11.3 14.6
cd promo/whats-new
HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell \
HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.8.181 render -o out/whats-new.mp4 -f 30 -q high -w 2
```

The stills tool's browser can't decode H.264, so the film card can show the wrong frame in
stills; the render takes the film's frames with ffmpeg and is right.
