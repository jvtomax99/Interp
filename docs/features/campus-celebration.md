# Campus celebration (a building finished)

Jose picked this on 2026-11-05 as the next campus piece (item 2c in `docs/PLAN.md`: "fireworks, ribbon, gold badge
when a building is finished"). This is the spec, written before any code (his rule, `AGENTS.md`, "How Jose works with
AI tools"). Waiting for his go.

## As built (2026-11-05, branch `claude/campus-celebration`)

- `renderCampus` (`features/campus.js`): `fin` is `cover >= 0.9999` (every question known, none shaky); `cheer` is `fin`
  with levels already drawn on this phone (`ih_campusLv` present) and the building not yet in `ih_campusDone`. A cheer
  writes three `.cp-fire` spans at the badge point (offsets -44/-70, 52/-104, 4/-146 render px, each with eight `<i>`
  sparks, `--dom` the domain colour, `--f` the start: 1 s + tenths climbed x 0.32 s + 0.5 s, or 0.4 s when nothing
  climbed, `--n` the burst 0-2) and one `.cp-ribbon` 6 px under the badge; the badge gets `is-done`, a star instead of
  the percentage and "finished" in its label. `ih_campusDone` is rewritten on every drawing with the finished keys only,
  so a drop under 100% clears it. `data-sig` carries an F per finished building.
- `app.css` beside `.cp-spark`: `.cp-fire` is an 11%-wide square container (`container-type:size`) so the sparks fly
  `cqw` units, the same share of the card at every size; each spark rotates by its `--a` and runs out on `--spring0`,
  bursts 0.6 s apart, 1.3 s each (about 2.5 s in all); a soft glow (`::before`) at each burst's heart. Reduced motion:
  `.cp-fire` hidden, the ribbon's fade off; Still: the page's `.is-still` rule stops their animations, which leaves the
  sparks at opacity 0 and the ribbon simply there. `.is-away` pauses the bursts with the rest of the card.
- Checks in `tests/suites/campus-alive.cjs` (the cases under Checks below). Guide: one sentence in the practice answer
  and the first New lately card (`GUIDE_NEWS`, `index.html`).

## What it does

On the CoreCHI Practice card, each exam area is a building on your HUMC campus, painted a tenth at a time as you learn
its questions. The moment an area is **finished** (every one of its questions known, the badge at 100%), the campus
celebrates it, once, on the building itself:

1. **Fireworks** over its roof: three small bursts, one after the other, rising from the building's badge point and
   opening in the domain's colour and gold, about 2.5 s in all. They start right after the paint's last tenth has
   climbed and its warm flash has played (the existing `.cp-rise` and `.cp-spark` sequence), so the climb, the flash and
   the fireworks read as one event.
2. **A ribbon** across the building for the rest of that visit: a short gold band with "Finished" in small capitals,
   hung under the badge, fading in with the last burst and gone on the next drawing of the card.
3. **A gold badge** for good: the area's badge turns gold with a star after its name (the same mark the 3D campus
   already gives a finished building), and stays gold on every later visit. The badge still works as before: a tap
   picks the building, a second tap starts practice.

Who it is for: an interpreter studying for the CoreCHI exam, on their phone between assignments. Finishing an area is
weeks of work; the Hub should make the moment feel like something, in the place where the work shows.

## When it plays

- The campus is drawn when you come to the Practice screen (after a quiz, the results screen, then Back lands here).
  `renderCampus` already remembers, per phone, the tenth each building had last time (`ih_campusLv`) and plays the
  climb when one went up. The celebration follows the same memory: a new key `ih_campusDone` keeps which buildings this
  phone has already celebrated; a building at 100% that is not in it gets the fireworks and the ribbon, then is written
  in. A building drawn at 100% on a first visit (a new phone, a cleared browser) is just drawn gold, no fireworks: the
  moment was somewhere else.
- 100% means `cover` = 1 (every question known, none shaky), not the paint's top tenth (`campusLevel` rounds to 10
  from 95%). The paint reaches the roof at 95%; the gold and the fireworks wait for the real 100%.
- Once per building per phone. Dropping back under 100% (a question marked shaky again) takes the gold off and clears
  the memory, so finishing it again celebrates again. That is the honest reading of the record, and rare.
- The quiz results screen keeps its own confetti for a strong score (`celebrateScore`); the two never play at once
  (different screens, different moments).

## How it is drawn (cheap, like everything on the card)

- The fireworks are CSS only: one `<span class="cp-fire">` per burst at the badge point, each with 8 spark children
  thrown out by a `transform` animation (translate and scale, opacity), staggered 0.6 s apart, on the page's spring
  (`--spring0` for the throw, ease-out for the fade). No canvas, no JavaScript timers: the drawing writes them, CSS
  plays them, they are gone at the next drawing. Transform and opacity only, so the compositor plays them (the feel
  audit's rule).
- The ribbon is one `<span class="cp-ribbon">` under the badge, `cpLight` in; the gold badge is a class on the existing
  `.cp-tag` (`is-done`), styled beside `.is-focus` in `app.css`. A finished building is never also the focus badge
  (the focus is the weakest area), so the two states never meet.
- Reduced motion (the phone's setting) and Dr. Smiley's Still: no fireworks, no ribbon fade; the badge is gold, the
  ribbon simply there for that visit.
- `.is-away` (the card off screen) pauses the bursts like everything else on the card.
- The 3D campus (`campus3d/`) is unchanged: it already shows a finished building at full height with its star.

## Not in this version

- No sound. The Hub plays no sounds outside the voice tools; a fanfare would be the first, and it is a hospital.
- No Dr. Smiley reaction (a cheer at the finished building). His cheer performance exists (`DR_PERF`); it could be
  added later as one line if Jose wants it. Left out so the first version is the fireworks alone.
- No celebration for the whole campus finished (all five). A bigger moment, its own piece.
- No shareable picture or Team Chat post. Nothing leaves the phone.
- No change to the "Your domains" rows under the card, the results screen or the 3D view.
- No history: the celebration is not logged anywhere (`quiz-history` already holds the sessions).

## How others do it, and where this can be better

Read before writing this (what could be read from here; Apple's and Duolingo's own pages are outside this
session's allowed network, so their pages are from memory and search summaries, marked):

- **Apple Watch, Activity rings.** Closing a ring fills the watch face with fireworks for a few seconds, once, and the
  closed ring stays as the record (from memory; Apple's support page could not be read here). The one thing people
  write about in Apple's own forums is the animation *not* playing: it is missed when it fails. Lesson: play it
  reliably, once, and leave a permanent mark (the gold badge) so the record outlasts the animation.
- **Duolingo, streak milestones and unit trophies.** The celebration is a full-screen moment with the mascot and a
  trophy; Duolingo's design blog says the team reworked the image and iterated the timing in rough passes (search
  summary of blog.duolingo.com/streak-milestone-design-animation; the page could not be read here). Lesson: the
  timing is the design; try it on the phone at a few speeds before settling.
- **Forest.** The tree you grew joins your forest for good; the reward is the collection, the animation is small
  (from memory). Lesson: the painted building and its gold badge are the collection; the fireworks are a garnish.

Where this is better than those: it happens **in the place**, on the real building you walk past at work, not in a
modal over the app, and it never blocks a tap (the card keeps working while it plays). It is also honest: gold means
every question known, and comes off if that stops being true.

## Checks

- `campus-alive.cjs` gets the cases: a building drawn at 100% with no memory is gold with no fireworks; a building that
  reaches 100% since the last drawing plays three bursts after the climb and the flash, shows the ribbon, turns gold,
  and is written into `ih_campusDone`; the next drawing has the gold and no fireworks; under 100% again the gold is
  off; reduced motion and Still draw the gold with nothing moving; the focus badge and the done badge never coincide.
- Phone screenshots at the burst's peak and at rest, before and after.
- User Guide: the practice answer gets a sentence on the celebration (`guide/topics.js`), and a "New lately" card.
