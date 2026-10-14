# The Daily Drill

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**The Daily Drill (Home's warm-up card).** Jose found the one-question
warm-up too easy; it is now three rounds a day in the same sheet
(`openWarmupSheet`, `#warmupSheet`; the card is still `#warmup`):
1 *Catch the trap*, a False Friend's patient line (`heard`), rendered in
English by the interpreter; using the trap word (`drillTrapRe`, from
`looks`, only for lines where it's in `trap` and not in `truth`) is a miss,
anything else is compared with `truth` and judged by them. 2 *Hear it,
write it*, a glossary term (still learning, else due), Spanish checked by
`reviewCheck` and saved to Term Review. 3 *The judgment call*, a
`SEED_QUESTIONS` item from ethics / encounter / cultural, with its
explanation. Levels (`DRILL_LEVELS`: Reading, Listening, Consecutive, Under
pressure) move up on 3/3 and down on 0-1; from Listening the words are a tap
away (never when the phone can't speak), Under pressure adds `DRILL_SECS`.
Nothing plays by itself. State in `ih_warmup` (drill built once a day,
`run` = your place, verdicts only, never what was typed; `seenFF`/`seenQ`
avoid repeats; `last`, `best`, `lvl`, `streak`).
