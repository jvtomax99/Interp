# Your knowledge brain

Jose, 2026-10-21: the glossary as a 3D brain (`brain/you.html`), lit by this
person's own Term Review record. **Separate from Dr. Smiley's brain**
(`brain/index.html`, the code map, `humc-brain.md`): his head opens his,
Term Review's small live brain and the CoreCHI Practice tile open this one, and neither links to the other
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
| After a session | Term Review's summary shows the session in the small brain (`kbMiniHtml({ session: { right, missed } })`): its terms dark until their turn, the right ones glow on one by one (260 ms apart), then the missed ones pulse red, then all settle; played once per session (`KBM.played`), end state at once under reduced motion. **See it in your brain** (`kbMiniOpen`) opens the full brain with `focus`: home-polish.js passes it with the data, `selectSession` in you.html dims the rest, makes those terms glow whatever their level, turns and zooms to them (Close puts the view back) and lists them; tapping a name shows its label at its dot |
| Figures | Fig. 1 coverage by domain, weakest first; Fig. 2 next up (missed, then due); Fig. 3 progress from `ih_knowledgeLog` (a note until there are two days) |
| Entrances | The small live brain at the top of Term Review's start screen (`kbMiniHtml`, `kbMiniStart`/`kbMiniFrame`: a 2D canvas in the app, no 3D loaded; domains as bands, so a preview, not the same layout; ~30 fps only while on screen, still under reduced motion; `.kb-mini` in `app.css`, in `LIFTS`), and the **Your knowledge brain** tile on the CoreCHI Practice dashboard. Both `openHumcBrain('you')` (`knowledgeEntryHtml`, styled with the memory trainer tile: `.kb-entry*` and `.kb-go` sit beside `.mem-entry*` in `app.css`) |
| Drawing | Dots are two `THREE.Points` layers (core, halo) with light added and alpha left alone (`ADD`): plain additive blending also adds alpha, and on the see-through canvas faint dots cut dark holes in the background |

**Privacy (K2, 2026-10-21).** The view reads only your own record, and
once the Hub is locked so do the rules: `term-reviews` is read and written
only by a phone whose name in `hub-members/{uid}.who` (trimmed, lower case)
matches the record's `who` (`ownReview` in `firestore.rules`); no listing of
everyone's. Practice mode leaves it open, as before. Jose's pick: **by
name**, so a record follows its person to a new phone; the weak spot is a
phone renamed to a teammate's name (names are self-reported). Per phone
(uid) was the other option: unspoofable, but a new phone or cleared storage
would start from zero. The app keeps `who` in step (`syncAccessWho`); when a
read or save is refused, `syncAccessWhoNow` waits for that sync and tries
once more (`loadTermReviews`, `saveTermReview`). Two names that make the same
document id (`reviewDocId`: "Ana-Maria", "Ana Maria") now refuse each other's
saves instead of silently overwriting. Tested in the Firestore emulator (18
cases); the retry in `tests/suites/humc-brain.cjs`. Takes effect only once
the rules are published in the Firebase console.

| Guide | `GUIDE_TOPICS` id `knowledgebrain` (section study, `guide/topics.js`); `GUIDE_NEWS` card `knowledgebrain` |
| Test | `tests/suites/humc-brain.cjs` (both brains, and that they stay apart) |
