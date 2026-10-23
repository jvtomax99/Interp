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
