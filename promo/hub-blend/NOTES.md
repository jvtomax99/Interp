# Interpreter Hub × HUMC blend – working notes

Output: `out/interpreter-hub-humc-blend.mp4` (31.0 s, 1080×1920, 30 fps, v11 music). Rendered 2026-10-20, 48 min on this 2-core box.

## What it is
Blend of three references:
- **v11 promo** (Jose's): story (doctor says "Heart failure" → 0.38s → 0.00s → "¿Fallo cardíaco?" struck, "Not for patients." → "Insuficiencia cardíaca, There it is."), navy/cyan palette, white-line + cyan-box captions, real app screens, Dr. Smiley, music.
- **Laptop reel** (`/home/claude/reel`): glossy table, laptop, screen light spill, floating caption reflected in the table, cube grid / dashboard / metaball scenes, HUD.
- **Slate-style phone reel**: 3D kinetic type in a void, phone spin-in, icon rising from screen with holo rings, UI layers lifting on the beat.
- **HUMC photos**: opener collage (0–2 s), blurred pavilion window behind the laptop, aerial with pin on "Built here.", skybridge behind the end card.

## Timeline (total time)
0–2 HUMC opener (`src/opener.js`) · 2–10 hook in the void (`src/void.js`) · 10–14 phone spin, icon pop, reveal · 14–24 five features, 2 s each · 24–25 morph · 25–27 "Built here." aerial · 27–31 dim + end card over skybridge.
Inside `main.js` everything after the opener uses `t = time - OPEN` (OPEN = 2); `T` in `src/config.js` is in that shifted time.

## Files
- `src/config.js` – all copy (`COPY`), palette, act boundaries `T`, `OPEN`, `DURATION`.
- `src/main.js` – director: camera `KEYS`, `PHONE_AT`, `CAPTIONS`, `SWAPS` (phone screen changes), end overlay timing.
- `src/phone.js`, `src/void.js`, `src/opener.js`, `src/screen2d.js` (laptop scenes), `src/cubes.js`.
- `assets/screens/*.png` – app screens flattened out of v11 (perspective-warped). Drills screen was too blurred, left out.
- `assets/drsmiley.png`, `assets/appicon.png` – cut from v11. `assets/humc/*.jpg` – Jose's HUMC photos (small: 500–1000 px).
- `assets/music.m4a` – v11 track 0–28 s + 41.75–45 s, crossfaded, 31 s.

## Tools
- Stills: `QS='?keys=...&phone=...' node /home/claude/tools/stills.mjs /home/claude/blend <outdir> 1.2 13.0 ...` (times are total time).
- Render: `HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell HYPERFRAMES_SKIP_SKILLS=1 npx --prefix ../humc-reel hyperframes render -o out/x.mp4 -f 30 -q high -w 2`

## Open items / known weak spots
- Holo rings around the rising icon barely read.
- Phone covers the right third of the laptop screen during features.
- HUMC photos are low-res; end-card skybridge is soft. Ask Jose for originals.
- HMH logo appears (app icon, signage in photos): needs HMH marketing sign-off before public posting.
- Final MP4 frame-by-frame check was pending when tools timed out: re-check with a contact sheet.

## Sound effects (2026-10-25)
Jose's pick: quiet effects under v11's narrator and music, which stay untouched (`assets/music-remake.m4a` is not changed). `tools/sfx.cjs` lists the cues and writes two files: `assets/sfx-remake.m4a` (the effects alone, the second `<audio>` in `remake.html` and `remake-final.html`, so a new render carries them; HyperFrames mixes its audio tracks with `amix`, read in its 0.8.181 code, not yet rendered) and, with `--promo`, `media/hub-promo.mp4` again (picture copied untouched, same frames; sound = music + effects from the .wav files).
Cues, in the shipped video's clock: the timer rolling to zero (counter, 1.97), the strike on "¿Fallo cardíaco?" (snap, 4.85), the right word (success, 6.0), each feature's cyan caption box (tick, start + 0.3), 145 Questions counting up (counter, 29.22 to 30.05), "Safer Care." (chime, 43.9). The 145 count in the shipped video runs later than `features.js` says (29.22, not 28.45): the times were read off the video's frames, so after any re-render, read them again.
Levels: each effect peaks 2 to 10 dB below the narrator and music at that moment; the mix's loudest point is the music's own (-5.1 dB), so nothing clips.
