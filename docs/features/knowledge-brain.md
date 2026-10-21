# Your knowledge brain

Jose, 2026-10-21: the glossary as a 3D brain (`brain/you.html`), lit by this
person's own Term Review record. **Separate from Dr. Smiley's brain**
(`brain/index.html`, the code map, `humc-brain.md`): his head opens his,
the CoreCHI Practice tile opens this one, and neither links to the other
(Jose's call after a first version put them in one frame as two tabs). They
share the frame (`.overlay.brain-ov`, `openHumcBrain` in `home-polish.js`),
the look and vendored Three.js.


The glossary as a brain, lit by this person's own Term Review record.

| What | Where |
|---|---|
| The data | `knowledgeBrainData()` in `index.html` (banner "Your knowledge brain"), sent by message: the page posts `{ih:'brain-want'}`, `home-polish.js` answers `{ih:'brain-data', data}`. Only `TERM_REVIEWS` (loaded by the person's own name) goes in |
| Which terms | Every term with English and Spanish (what Term Review can ask); `noSpanish` counts the rest |
| Levels | `kbLevel`: 0 never practised (faint slate dot), 1 missed last time (red), 2 learning (box 1-2), 3 known (box 3+, right 3+ in a row). Overdue dims the glow (`glow` in the page) |
| Where the record comes from | `term-reviews/{who__termId}`, written by Term Review, Daily Drill round 2 and Doctor Prep flashcards (`prepMark`). Latest state only, no history |
| Progress over time | `kbLogNote()`: one count a day `[practised, known, total]` in `ih_knowledgeLog` (this phone, per name, 400 days), written when the record loads and after each saved answer. Started 2026-10-21; nothing before that exists |
| Layout | Cortex spots on both hemispheres; each top domain gets an anchor (spread apart, biggest first), spots go to the nearest domain with room. Inside a domain its own terms take the middle, each subgroup a wedge |
| Actions | Domain sheet: **Practise** → `{ih:'brain-practice', domain}` → `knowledgePractise` (top domain: `startReview({spec,n:10})`; subgroup: its terms from `reviewBuild`). Term sheet: **Open the card** → `{ih:'brain-term', id}` → `knowledgeOpenTerm` → `revealTerm`. Both close the brain first |
| Figures | Fig. 1 coverage by domain, weakest first; Fig. 2 next up (missed, then due); Fig. 3 progress from `ih_knowledgeLog` (a note until there are two days) |
| Entrance | Only the **Your knowledge brain** tile on the CoreCHI Practice dashboard (`openHumcBrain('you')`) (`knowledgeEntryHtml`, styled with the memory trainer tile: `.kb-entry*` and `.kb-go` sit beside `.mem-entry*` in `app.css`) |
| Drawing | Dots are two `THREE.Points` layers (core, halo) with light added and alpha left alone (`ADD`): plain additive blending also adds alpha, and on the see-through canvas faint dots cut dark holes in the background |

**Privacy.** The view reads only your own record. But `term-reviews` is
readable by the whole team in `firestore.rules` and keyed by typed name, so
that promise holds only inside the app. K2 in `docs/PLAN.md` fixes it.

| Guide | `GUIDE_TOPICS` id `knowledgebrain` (section study, `guide/topics.js`); `GUIDE_NEWS` card `knowledgebrain` |
| Test | `tests/suites/humc-brain.cjs` (both brains, and that they stay apart) |
