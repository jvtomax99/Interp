# Practice scenes (the doctor, nurse and visitor in practice)

Jose picked the place on 2026-11-04 (practice scenes), after seeing the Tripo figures beside the code ones
(`docs/mockups/characters/`, branch `claude/hub-figures`), and OK'd this plan the same day. Built in the memory
trainer (branch `claude/practice-scenes`): `memSceneHtml`, `memFigHtml`, `MEM_FIG`, `MEM_PROVIDER` in `index.html`
(section "Memory trainer"), styles "Practice scenes" in `app.css`, pictures in `figures/`.

## As built

- `figures/doctor.webp`, `nurse.webp`, `visitor.webp`: 480 px tall, about 20 KB each, transparent, facing forward.
  Since 2026-11-04 (third version) they are **rendered from the Meshy 3D figures**: Jose's ChatGPT picture of each
  (`docs/art/*-single.png`, prompts in `docs/mockups/characters/meshy/prompts.md`, all on branch
  `claude/hub-figures`) made into a model by Meshy's image to 3D (`meshy-7.1`, 2K texture, 30 credits each; the nurse
  in Jose's Meshy app, the doctor and visitor through the API), slimmed to phone GLBs (`meshy/*.glb`, ~1.7 MB, kept
  on that branch, not deployed), then rendered front on in Blender (`tools/toy/plain.py`, `EXPO=-0.9`), cropped to
  the figure and scaled to 480 px. The doctor's hair was lightened to his picture's brown. Before: cut out of Jose's
  drawing (second version), and Tripo renders (first; Jose found the visitor ugly). The guide credits Meshy (its
  free-plan models are CC BY 4.0; paid-plan models are the owner's, per Meshy's help pages).
- Shown in the **Listen** and **Your turn** stages only, either side of the ring (`.mem-scene`, a 3-column grid; the
  figures 150 px tall, 126 px under 360 px wide). Listen: the speaker leans in 3 px and 2 degrees on `--spring0`,
  then bobs 3 px every 0.9 s, with a sound mark by the head; the other is at 60% and less saturated. Your turn: both
  at rest. Reduced motion or Dr. Smiley's Still: the lean is held, nothing moves.
- Who says provider lines (`MEM_PROVIDER`): the nurse for Discharge, Medications, Labor and delivery, Pediatrics; the
  doctor for Consent, Emergency, False Friends. The visitor is the patient or family (the chip above still says
  which).
- Precached by `sw.js`, so practice works offline as before.

## What it does

In the memory trainer (and later the drills), the line you are about to interpret gets a speaker you can see. A
provider line (English) is said by the doctor or the nurse; a patient line (Spanish) by the visitor, standing in as
the patient or family. While the phone reads the line aloud, the speaker leans in slightly and a small sound mark
moves beside them. The other figure waits. You, the interpreter, are not drawn: the phone is you.

Who it is for: the HUMC interpreters, practising consecutive between assignments. It makes "who is talking"
obvious at a glance, which is the first thing an interpreter tracks in a real session.

## How it is made (and why it is cheap)

- The figures are **pictures**, not live 3D: each Tripo figure rendered once to a small transparent WebP (front,
  about 3/4 turned toward the other speaker), around 30-60 KB each at 2x. No three.js on the practice screen, no
  1.5 MB models to download, no battery cost.
- The "speaking" motion is CSS on the picture (a lean and a soft lift on `--spring0`, a sound mark), started and
  stopped by the same code that starts and stops the voice. Reduced motion and Still: no lean, the sound mark stays
  still.
- Doctor and visitor need **no rigging** for this: pictures of them standing are enough. That saves the ~70 credits
  a rig and walk for each would cost. The nurse's walk (already made) stays for the campus question.
- Matte finish, as Jose's reference picture.

## Not in this version

- No moving mouths (lip sync). Tripo's faces are painted on, so a mouth cannot move without new art.
- No live 3D, no walking, no figures on Home, the campus or the guide.
- No new lines, no new practice modes, no AI conversation partner.
- No patient information, ever (the `AGENTS.md` rule): the scenes use the existing practice lines only.

## Similar tools, and where this can be better

- **Duolingo** gives its characters moving mouths matched to the audio, made with Rive, a real-time animation tool,
  across 40+ languages ([its blog](https://blog.duolingo.com/world-character-visemes)). That takes an art team and
  per-character mouth sets. Here: no mouths, but "who is speaking" is shown just as clearly, for almost nothing.
- **Exec.com** sells AI role-play for medical interpreters: a three-way doctor and patient scene, scored afterwards
  ([page](https://www.exec.com/learn/medical-interpreters-ai-roleplay-training)). It is a paid, online, general
  product. Here: offline, free for the team, with HUMC's own roles and the trainer's span tracking.
- **Canopy Quest** (medical Spanish for providers, not interpreters) has the user play the doctor in clinical
  scenes ([App Store](https://apps.apple.com/us/app/canopy-quest/id1068609971)). Here the interpreter sits between
  both speakers, which no tool found does.

None of the three was opened and tried; this is from their own pages.

## Open

Meshy's terms: from its help pages (searched, not opened): paid plans own their models outright, free plan is CC BY 4.0 (credit Meshy). Which plan made the nurse was not checked; the guide's credit covers both.

Earlier, Tripo's terms on commercial use: Jose read them on 2026-11-04 and says the figures can be used in the app.
(Claude could not open Tripo's pages from the cloud session, so this rests on his reading.)
