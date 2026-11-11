# Dr. Smiley's memory and follow-ups

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `features/ask-hub.js` (moved out of `index.html` 2026-10-25,
with a few load-time lines left where it began) unless a file is named.
Keep this in step with the code.

**What Dr. Smiley remembers (on this device).** `ih_smileyMemory` holds, per
name typed on this phone, a few allowlisted choices (`DR_MEM_FIELDS`: lang,
length, focus = a specialty id, mode, practice on/off) and which next step was
already offered today. "Remember… / Forget… / What do you remember?" are
handled on the phone (`askMemoryIntent`, nothing sent); a confirmation only
after the write reads back (`drMemStore`), otherwise it says the phone
refused and keeps it in memory until the app closes. The screen is
`openMemory()` (Ask's header, the profile sheet). Another name on the phone
gets its own set, its own animation mode, and a cleared Ask conversation
(`drMemNameChanged`). `api/ask.js` gets only lang/length/focus as
`context.prefs` and, when practice is on, personal counts as
`context.practice` (unfinished briefing/quiz/review, still learning, due) --
style and personal choices, kept apart from team notes; "brief" is enforced
server-side (`fitLength`). The practice next step is offered unasked at most
once a day per step.

**Following a conversation (follow-ups).** "Make it simpler", "Now in
Spanish", "What's the difference between that and the previous term?", "Go
back to my appointment prep" are read on the phone first (`askFollowUp`, then
`askPlan`). `ASK.convo` is this conversation's record, in memory only and
bounded (`ASK_CONVO_MAX`): the last 4 subjects (entry ids, or none when an
answer wasn't about a Hub entry, so "that" never skips back past it), the
briefing it's about, a language for this conversation, and up to 3 of the
interpreter's corrections. One reading: sent as `context.conversation`
(followUp, resolved, topic, previous, task, lang, corrections) with those
entries first; `api/ask.js` (`cleanConversation`) keeps only ids that were
sent. Several readings: one short question, a `pick_topic` button per option
(the model can ask too: `clarify` + `topicIds`). None: he says what's missing,
nothing sent. "Go back to my prep" is answered on the phone from the
unfinished deck, the running appointment, this conversation's briefing, the
screen Ask came from, then the last briefing (`askPlanResume`). A correction
(`usedCorrection`) is never "from the Hub" and never a verified outcome; "Send
to … for review" opens the usual Correct this note (pending). "Use Spanish in
every conversation" is the only way a conversation language becomes a saved
preference. Visible Stop (`.ask-stop`) and New conversation (`askNewConversation`,
saved preferences stay). Nothing from a stopped or overtaken request is
applied (`stale()` in `submitAsk`, `ASK.gen`). His voice is enforced
server-side too (`tidyVoice`: no greeting, praise or introduction).

## Rules moved here from `AGENTS.md` (2026-11-11)

Word for word as they stood there; `AGENTS.md` keeps the short form.

- **An account is optional** (email sign-in, live since 2026-11-07;
  `docs/features/email-sign-in.md`). The team code joins a *phone*, and the
  name is whatever was typed on it. Someone who also signs in with their
  email gets their name, photo, practice and settings on every phone
  (`account-sync/{uid}`). Dr. Smiley's remembered preferences
  (`ih_smileyMemory`: explanation language, brief/detailed, study focus, how
  he moves, use my practice record) still live only on that phone, filed
  under that name, signed in or not (Jose's call, 2026-11-06). Never sync them to Firestore, never mix them into `hub-lessons`
  (approved team knowledge), never add a free-text field to them (no patient
  details), and never present team points as one person's progress.
- **A conversation with Dr. Smiley is not a preference.** What "that" or
  "the previous term" means, a language asked for with "Now in Spanish", the
  briefing being talked about and the interpreter's own corrections live in
  `ASK.convo` (in memory, bounded, cleared by New conversation), never in
  `ih_smileyMemory` and never in Firestore. Only an explicit tap saves a
  preference ("Use Spanish in every conversation"), and only an owner-approved
  `hub-lessons` note is team knowledge: a correction is used for the rest of
  the conversation, labelled "not checked", and never verified or a source.
  A follow-up that can mean two things asks one question with a button per
  option; one that refers to nothing says so. Never resolve a reference to an
  entry the phone didn't send (`api/ask.js` drops such ids), and nothing from
  a stopped request may change the screen or the record.
