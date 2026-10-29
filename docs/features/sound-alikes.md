# Sound-Alikes

Approved by Jose 2026-10-29 (parent chat "Nesting feature application").
Words that sound the same, or nearly, but are spelled differently and mean
different things: *heel / heal / he'll*, *ileum / ilium*, *vaso / bazo*.
An interpreter who **hears** one has to pick the right meaning from
context, in real time, with no spelling to lean on. This tool trains that.

Jose's first idea was "help pronounce them out loud and translate them".
It changed to listening first: true homophones sound identical, so saying
one can't go wrong in a way that matters. Hearing one and rendering the
wrong meaning can (*hypotension* heard as *hypertension* flips the
treatment).

## Who it is for

The interpreter team, on a phone, between assignments. Same audience and
pattern as False Friends: Study to read, Drill to test the reflex.

## What it does (first version)

- **Data**: `soundalikes/list.js`, `SOUND_ALIKES`, plain data. Each set:
  `id`, `lang` (`en`: heard in English, rendered in Spanish; `es`: heard in
  Spanish, rendered in English), `kind` (`same` = true homophones, `near` =
  near sound-alikes that get misheard), `tag`, `words` (each: `w` spelling,
  `means` English gloss, `say` the rendering in the other language, `line`
  one hospital sentence in the heard language, `lineTo` that sentence
  rendered), `note`, `mw` / `rae` (dictionary entries for the medical meanings).
  `esChecked: false` on every set until Jose has checked the Spanish; the
  card shows "Spanish not yet checked" while it is false. Flip it per set
  when checked.
- **Screen**: `features/sound-alikes.js` (`renderSoundAlikes`), styles in
  the "Sound-Alikes" block of `app.css`. Study lists every set: each
  spelling with a speaker button (`speakText`, the device voice, en-US or
  es-US by the set's language), its meaning, its rendering and its
  sentence. Search and a filter: All / Sound the same / Sound close /
  Heard in Spanish.
- **Drill**: ten questions. The phone speaks a sentence that contains one
  of a set's words; the sentence is hidden. You pick the right rendering
  from the set's own renderings (the other spellings are the lures) plus
  one or two from other sets so a two-word set still has four options.
  **Hear again** and **Slower** buttons (Duolingo and Quizlet both give a
  replay and a slow replay). **Show the words** reveals the sentence with
  the sound-alike blanked out, for a phone with no voice or a noisy
  corridor. After answering, the full sentence and its rendering show.
  The result counts how often a sound-alike lure caught you.
- **Voice**: `saSpeak`, not `speakText`, for two reasons: the drill's
  Slower replay needs its own rate, and Spanish asks for a Latin American
  voice (es-US, es-MX, es-419) over a Spain one, because a Spain voice says
  *sien* and *cien*, *taza* and *tasa* differently (no seseo), which would
  hide the point of those sets. The glossary's own speakers use es-ES.
- The glossary's search bar is hidden on this screen (it searched the
  glossary, not the sets).
- **Checks**: `tests/suites/sound-alikes.cjs`.
- **Wiring**: a tool tile after False Friends (`getToolTiles`, the ear
  icon), first on Home's study rail (new tools go first, see the comment
  there), global search hits (group "Sound-Alikes"), precached in `sw.js`,
  a User Guide answer (`soundalikes`) and a New lately card.

## Not in this version

- Recording or scoring the user's voice.
- Adding the sets to Term Review, the Daily Drill, Ask the Hub or the
  memory trainer.
- Team-added sets, or anything in Firestore. Nothing is stored at all, not
  even drill results.
- Dr. Smiley reactions.
- Recorded human audio (the device voice only).
- Sound-alike **drug names** (the ISMP list). Worth a later version, but
  that list is ISMP's copyright and much longer.

## How similar tools do it (research, 2026-10-29)

- **Duolingo listening exercises**: a speaker button to replay as often as
  you like and a turtle button that replays slower; early in a unit the
  words are shown, later audio only
  ([Duolingo blog, listening skills](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-listening-skills/)).
  Copied: Hear again, Slower, and hidden text with an opt-in reveal.
- **Quizlet**: a speaker icon on every card, device text-to-speech, a
  slow-audio option ([Quizlet Help, Studying with Flashcards](https://help.quizlet.com/hc/en-au/articles/360030988091-Studying-with-Flashcards)).
  Copied: a speaker on every word in Study.
- **ISMP List of Confused Drug Names**: the hospital world's own
  sound-alike list, pairs of drug names to put safeguards around
  ([ISMP via ECRI](https://home.ecri.org/blogs/ismp-resources/list-of-confused-drug-names)).
  Where ours is better for interpreters: neither app above tests *meaning
  from context*; they test spelling or recognition. Ours makes you choose
  the rendering, with the other spellings as the lures, which is the
  actual failure on the floor.

## Sources and what is unproven

Each set's `mw` and `rae` name the dictionary entries behind its medical
meanings (Merriam-Webster Medical Dictionary, the RAE's Diccionario de la
lengua española); the card links them. The links follow each site's
address pattern but could not be opened from the build session (its
network blocks those sites), so they are unchecked. The Spanish renderings
are Claude's and unchecked until Jose flips `esChecked`.

The device voice is the weak point: it reads the *spelling*, so a near
pair (perineal / peroneal) sounds as distinct as the voice makes it, which
may be clearer than a doctor in a hallway. True homophones are unaffected.
