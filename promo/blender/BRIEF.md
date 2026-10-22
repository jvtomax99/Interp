# Brief: Dr. Smiley builds a glossary card

A 12-second 3D film made from code, after the guide "Claude + Blender: Make
3D Motion Graphics From Code" (AI Automation Society; prompt shape by rari,
@0xwhrrari). For learning, not for the app (Jose, 2026-10-22). Six blocks,
as in the guide. Only BRAND is specific to this film.

## BRAND

- **Hero:** Dr. Smiley, as Jose drew him: `drsmiley/base.webp` with his eye
  and mouth frames from `drsmiley/face.webp` (30 frames, 151 x 111 each,
  order in `DR_FACE_FRAMES`, `index.html`) and his brows. A flat cutout
  with a thin edge, never a new 3D model. He starts as the picture on the
  Hub's Home screen and peels off it like a sticker.
- **App:** the Interpreter Hub's "Add term" editor, as a fake workspace in
  the Hub's look (Inter, the `--accent`/`--navy`/`--cyan` palette, the card
  finish from CLAUDE.md). Panels: the domain list with real pins on the
  left, the card preview in the middle, a button row along the bottom:
  **Type, ES/EN, Domain, Audio, Example, Save**. No HMH or HUMC logos.
- **Result:** one bilingual term card, built a piece at a time:
  "shortness of breath" / "falta de aire", Pulmonology
  (`pins/pulmonology.webp`), an example line
  "Do you get short of breath when you walk?" /
  "¿Le falta el aire cuando camina?", then saved.
- **Set:** a dark navy void (`#0B1030`), soft floor glow, the panels as
  floating slabs of black glossy glass.

## FORMAT

Blender 5.2 as a Python module (`bpy`), Cycles on the **CPU** (this cloud
machine has no graphics card), 1280 x 720, 30 fps, 12 s = 360 frames, 120
BPM (one beat = 15 frames). The interface is HTML screenshotted by
Puppeteer into one 2560 x 1440 image; the card is drawn on a canvas, one
image per frame. One shared timeline file, `timeline.py`, holds every
button position and every event time; everything else reads it.

## BEATS

| Seconds | What happens | What the card gets |
|---|---|---|
| 0.0 - 1.5 | Wide. The workspace floats in the dark; Dr. Smiley is the hello picture on the Home panel, blinking | empty card outline |
| 1.5 - 2.5 | He peels off the screen corner first, pops into 3D (surprised, then smile) | |
| 2.5 | Hop onto **Type** | "shortness of breath" types in |
| 3.5 | Hop onto **ES/EN** | "falta de aire" flips in under it |
| 4.0 | The drop: music hits, panels brighten | |
| 4.5 | Hop onto **Domain** | the Pulmonology pin stamps into the corner with a glow |
| 5.5 | Hop onto **Audio** | a voice waveform ripples across the card |
| 6.5 | Hop onto **Example** | the example pair writes in |
| 7.5 | Hop onto **Save** | the card lifts and gets its shadow, a check, "Saved"; he winks |
| 8.5 - 10.0 | Every panel powers down and falls away, one after another | |
| 10.0 - 12.0 | Only the card is left; he hops onto its top edge, laughs, settles | the finished card, the poster frame |

## CAMERA

Wide to start (whole workspace). From the peel on, it follows each hop at
Dr. Smiley's height with shallow focus on him. As the panels fall it pulls
back and ends square on the card alone.

## LOOK

Screens glow under black glossy glass. Lights never show in the glass
(hidden from glossy rays). The app's colours and his drawing must come out
true: Standard view transform rather than AgX (the guide's "salmon pink"
trap), then one measured pixel checked against its hex.

## CHECKS

1. The interface image and a contact sheet of the card frames, looked at
   before any 3D.
2. 18 stills at half size (640 x 360), low samples, looked at as one grid:
   text readable at phone size, buttons where they belong, his colours
   right, no white blowouts in the glass, a last frame strong enough to be a
   poster.
3. Fixes written as exact changes, then the full render in chunks.
