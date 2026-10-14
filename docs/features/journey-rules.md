# Integration rules from the end-to-end journey audit

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**Integration rules from the end-to-end journey audit** (each has a check in
the journey test):
- A handoff answer (it hands over a Hub tool: a briefing, Term Review, a next
  step) is a success for his face (`askHandsOver` -> outcome `handoff`),
  whatever its provenance label says.
- Ask opened from the briefing or an appointment knows that specialty
  (`askFromSpecialty`): the context names it and "Prep me." uses it.
- An action that has to wait (loading the review record) re-checks that it's
  still the latest tap and you're still where you tapped
  (`askActionSeq`); otherwise it does nothing and says nothing.
- A retried question carries its own term (`submitAsk(q, true, { sel })`);
  it never changes the term picked since.
- Questions waiting for a connection are kept on the phone
  (`ih_askWaiting`, not ones that looked like patient details) and sent after
  a reload once online.
- Term Review answers go through the outbox and the card never waits for
  the network (`saveTermReview`).
- The briefing deck keeps your place in memory when the phone refuses
  storage (`prepDeckMem`).
