# Term Review sessions

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**Term Review sessions (Dr. Smiley's teaching).** One record, the existing
`term-reviews/{who__termId}`, now with `lastResult`, `misses`, `lastAt`
(written by `saveTermReview`; older records read box 0 as "missed last
time"). A session (`reviewBuild`): you pick the specialty and 5/10/15;
missed first (most-missed first), then due, about one in five for variety
(new to you, else a quick check), one card per English term, spread out,
each with its reason (`RS.why`). Answers (`reviewCheck`): right when the
glossary accepts it (`reviewAccepted`: the card's Spanish, "A / B" and
"A (word)" parts, other entries for the same English; accents, capitals and
a leading article ignored, with a "Written:" note); wrong only for blank /
"no sé" / this term's false friend; everything else is self-review (compare,
you decide). After a miss: `reviewDistinction` and "Try it again later"
(back 4 cards on). `saveTermReview(..., { confirm: true })` returns
`{ ok, how }`; the record, the session and the summary change only after
ok, and a failure shows "Not saved" with Try saving again / Skip. Your place
is in `ih_reviewSession` (ids, index past the last saved answer, reasons,
results; never what was typed): Pause, a reload or Dr. Smiley's Resume
(`askUnfinished`, `continue_review`) pick it up. Show answer → Got it still
moves straight on. Reactions: a nod, a smile when a previously missed term
is right, encourage after a miss, `smileyStudy` at the end.

**The small live brain** (2026-10-21) sits at the top of the start screen, under the intro: your terms on a turning brain, known count and %, tap to open the full knowledge brain. `kbMiniHtml`; `knowledge-brain.md`. The session summary has its own copy: the session's terms light up in it, and **See it in your brain** opens the full brain turned to them.
