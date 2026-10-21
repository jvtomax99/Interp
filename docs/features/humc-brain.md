# HUMC Brain

Two tabs in one full-screen frame (Jose, 2026-10-21): **You**, your
knowledge brain (`brain/you.html`, the default), and **How the Hub is
built**, the code map below. Tabs swap the page inside the frame with
`location.replace`, so Back still closes the brain.

## Your knowledge brain (`brain/you.html`)

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
| Entrances | Head double-tap on Home; the **Your knowledge brain** tile on the CoreCHI Practice dashboard (`knowledgeEntryHtml`, styled with the memory trainer tile: `.kb-entry*` and `.kb-go` sit beside `.mem-entry*` in `app.css`) |
| Drawing | Dots are two `THREE.Points` layers (core, halo) with light added and alpha left alone (`ADD`): plain additive blending also adds alpha, and on the see-through canvas faint dots cut dark holes in the background |

**Privacy.** The view reads only your own record. But `term-reviews` is
readable by the whole team in `firestore.rules` and keyed by typed name, so
that promise holds only inside the app. K2 in `docs/PLAN.md` fixes it.

## How the Hub is built (`brain/index.html`)

Jose, 2026-10-21: the census map of `index.html` (`tests/tools/census.cjs`,
`docs/split-index.md`) as a 3D brain, opened by a **double-tap on Dr.
Smiley's head** in the Home hello, for **everyone** (he first picked admins
only, then changed it). The styling borrows medical words on purpose
("nuclei", "tracts", accession numbers, an Impression); every page of it
says it is **not patient data**. Keep that line.

## Where it lives

| What | Where |
|---|---|
| The page | `brain/index.html`: one file, its own CSS and JS. Three.js r128 vendored beside it (`brain/three.min.js`, MIT, `brain/three.LICENSE`) so it works offline and never waits on a CDN |
| The data | `brain/data.json`: sections (title, bytes, region), links (user, used, how many names), total bytes, named-piece count, date measured |
| Making the data | `cd tests && node tools/brain-data.cjs` (writes it); `--check` says if it's out of date. Run it after a PR that adds, renames or moves sections, or before showing it off |
| Opening it | `home-polish.js`: the hello's click handler (`onHead`, `HEAD_SHARE` 0.62 of his picture, `DOUBLE_TAP_MS` 320) and `window.openHumcBrain(view)` (a `.overlay.brain-ov` holding an iframe of `brain/you.html`, or `brain/index.html` with `'code'`) |
| Its frame's look | `home-polish.css`, last block: no padding, no backdrop, full screen |
| Offline | `sw.js`: never opened online yet → a one-line note in its frame, not the whole app inside it |
| Guide | `GUIDE_TOPICS` id `brain` (in `guide/topics.js`) (section Asking Dr. Smiley; now about your knowledge brain, the code tab in one line); `GUIDE_NEWS` card `brain` |
| Test | `tests/suites/humc-brain.cjs` |

## Taps

- Double-tap on his head (top 62% of his picture): the brain. No Ask.
- One tap on his head: Ask the Hub, after 320 ms instead of 200 (the wait
  for a possible second tap). Below his head (badge, shoulders): Ask at
  200 ms as before. Keyboard or screen-reader clicks: Ask, no wait.
- Press and hold: pets him (`smileyPettable`), unchanged.

## Closing

It's an `.overlay`, so the app's own rules apply: Back (`navigateBack`
closes the top `.overlay.show`), leaving the screen (`closeAllOverlays`),
Escape. Inside the frame, the X and Escape post `{ih:'brain-close'}` to the
app (same origin only). When it closes, the frame is removed after 300 ms,
so the 3D stops drawing and its memory goes.

## Regions

`tools/brain-data.cjs` names which sections go where; anything it doesn't
name goes to the cortex ("Other features"). Core = thalamus (stays inline),
startup = brainstem (stays), big data lists = hippocampus (move out as
files), safe first moves = cerebellum, Ask the Hub = Broca's area, Dr.
Smiley = motor strip. A renamed section shows in the tool's output as "Not
found in the census"; update the list.

## What's real and what isn't

Real (from the census): every dot, size, link, count, degree, clustering
coefficient, the matrix, flux table, scatter, histogram, treemap and top-15
table. Made up for the look: positions inside each region, the moving
signals, the spike raster, the EEG trace and "spikes/s" (Fig. 7's caption
says so), the MNI coordinates (from the 3D position) and the Brodmann
areas (from where the dot sits).

## No WebGL

If the phone can't make a WebGL context, the scan shows a line saying so
and the figures below still work.
