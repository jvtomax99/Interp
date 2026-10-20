# Brief: the 3D remake of the promo (v12)

Jose's ask (2026-10-20): something like `media/hub-promo.mp4` (v11), which
explains the app feature by feature, but with the 3D look of four reference
reels he sent. This file is the plan; a fresh chat can work from it alone.

## What stays from v11

v11 works because of one move, repeated: a two-line caption (white line,
then a cyan box wiping in behind the payoff), the real app screen flying in
and filling the frame, and a cyan outline ringing **the one item on screen
that proves the caption**. Keep the order, the copy word for word, the
palette (navy, cyan `#3fc6ee`, red strike `#f0436a`) and that rule.

What v11 gets wrong, and this remake fixes: every feature uses the same flat
move, the camera never moves, and the 8 s end card drags the length to 45 s.

**The change:** the cyan outline is replaced by a 3D move. The proof item
lifts off the screen toward the camera, lit, casting a shadow, and Dr.
Smiley interacts with it where the table says so. The camera is always
moving, low and close to the surface, with the background out of focus.

## The four references (what each one teaches)

- **Slate (phone):** real UI on a real phone, camera skimming the glass at a
  grazing angle, UI layers peeling off at different heights, the app icon
  rising into glowing rings. Its lyric section: thick 3D words under one
  spotlight, cut on every syllable.
- **motionloved (laptop):** the screen is the only light; its colour reaches
  the keys, the table and the reflection. That is what makes it look real.
- **andremass (studies):** one hero object per shot with a convincing
  material (clay, chrome); a field of hundreds of copies rippling.
- **After Effects mascot:** a flat UI turned into a landscape, a character
  crossing it with intent, low camera, warm light, real shadows. Ours is
  Dr. Smiley.

## Copy (from v11, unchanged)

Hook: "The doctor says:" / "Heart failure" / "TO FIND THE WORD" 0.33s /
"¿Fallo cardíaco?" struck, pill "Not for patients." / "Insuficiencia
cardíaca". Logo: "Interpreter Hub", "for the HUMC interpreter team".
End: "Interpreter Hub" / "Built here, for our patients." /
"interp-six.vercel.app" / "Live today, on any phone." / "Better words."
"Safer care." (cyan box).

## Shot table

About 32 s, 1080x1920, 30 fps, v11's music re-cut to length, cuts on the
beat. Features 2.5 s each (never under 2.3 s).

| # | Shot | Caption | Reference | What happens (proof item in bold) |
|---|---|---|---|---|
| 0 | Hook, ~6 s | v11 hook | Slate lyric section | Thick 3D words under one spotlight; the camera moves through them; timer, red strike, then the right word |
| 1 | Logo, ~1.5 s | Interpreter Hub | Slate icon | The **app icon** rises from a lit phone screen into glowing rings that light the glass |
| 2 | Home | Built by our / own interpreters. | Slate phone | Camera skims the Home screen; its layers lift off the glass, nearer ones more; **the quick tiles** come forward |
| 3 | Glossary | One glossary. / Every specialty. | andremass clones | A field of the 41 specialty pins (`pins/*.webp`) ripples like a wave, then folds into the Emergency list with **Avascular necrosis** |
| 4 | Translate | Glossary first. / AI second. | AE mascot | Dr. Smiley types "heart failure" in Search; the glossary card rises first and tall, the AI card **insuficiencia cardíaca** second and lower |
| 5 | Doctor Prep | Ready for / every physician. | andremass chrome | **Dr. Elena Marin's card** turns like a solid object; her 10 prep terms fan out |
| 6 | False Friends | 101 false friends. / Flagged. | AE mascot | Dr. Smiley steps on **constipado**; it flips over red: "≠ constipated, a cold" |
| 7 | Daily Drill | Daily drills. / Sharp skills. | Slate lyric section | **"Fue un ingreso de urgencia"** drops in word by word; the trap word cracks |
| 8 | CoreCHI | National certification. / Prep built in. | motionloved dashboard + AE | The bars grow, **145** counts up, Dr. Smiley climbs the bars like stairs |
| 9 | Team Chat | One team. / One channel. | Slate layers | Chat bubbles stack in depth; **"Lavado del port. Added it to the glossary."** comes forward |
| 10 | Ask | Stuck? / Ask Dr. Smiley. | AE mascot | Dr. Smiley steps out of the screen; **his oncology briefing card** rises behind him |
| 11 | End, ~4 s | v11 end copy | motionloved laptop | Laptop and phone on a glossy table, the screen the main light, its colour on the table and reflection; end lines on the laptop screen |

If it must be shorter, cut 5 (Doctor Prep) or 9 (Team Chat): the least
distinct on screen.

## Rules every shot is checked against

- Captions at least 64 px tall, v11's two-line style.
- The proof item readable with the frame shrunk to 360 px wide.
- Dr. Smiley never covers the proof item.
- No dark or empty phone screen in any frame.
- Screens are real app captures in layers (step 2), not crops of v11.

## Steps (one at a time; Jose reviews each before the next)

1. This brief, and the project committed here. **Done.**
2. Real screens in layers: Playwright on this checkout (Firebase and AI
   stood in for, as in `tests/support/`) at 390x844, 3x density, the exact
   states in the table; each region a transparent PNG plus a JSON of
   positions; one labelled sheet for Jose. The old `assets/screens/*.png`
   (cut from v11, soft) stay until these replace them, so the current
   reel still renders.
3. Dr. Smiley puppet: a flat cutout in Three.js from `drsmiley/` (base,
   face strip, brows), card thickness, contact shadow, screen light on him,
   squash and stretch. Moves: hop, land, type, point, step out, wave. Six
   stills at 540x960.
4. Hook and logo. Draft at 540x960, contact sheet at 2 fps.
5. Shots 2-6. Draft, contact sheet.
6. Shots 7-11. Draft, contact sheet.
7. Check against the rules above, side by side with v11 per feature; fix;
   full render; send with the side-by-side.

## Practical

- No GPU here: Three.js renders in software. The first hub-blend (31 s) took
  48 min on 2 cores. Work on stills and 540x960 drafts; one full render at
  the end. Real motion blur multiplies render time; use it only where it
  shows.
- Render command and still tool: `NOTES.md`.
- The HMH logo appears (app icon, photos): needs HMH marketing sign-off
  before public posting (from `NOTES.md`).
