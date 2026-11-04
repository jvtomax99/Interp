# Practice scenes (the doctor, nurse and visitor in practice)

Plan, not built. Jose picked the place on 2026-11-04: practice scenes, after seeing the Tripo figures beside the code
ones (`docs/mockups/characters/`, branch `claude/hub-figures`). Waiting for his OK on this plan before any code.

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

## Open before building

1. **Tripo's terms on commercial use**: Jose reads them (not read by anyone yet). If they don't allow it, the code
   figures are the fallback: the same plan works with them.
2. Provider lines: always the doctor, or doctor and nurse taking turns? (Suggested: taking turns, the nurse for
   nursing lines.)
3. The figures' size on a phone screen (a first guess: about a third of the screen's width each, above the controls).
