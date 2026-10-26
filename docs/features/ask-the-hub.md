# Ask the Hub

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `features/ask-hub.js` (moved out of `index.html` 2026-10-25,
with a few load-time lines left where it began) unless a file is named.
Keep this in step with the code.

**Ask the Hub.** The phone picks up to 24 matching entries (glossary, False
Friends, Doctor Directory, providers, Code of Ethics, User Guide) with
`askRetrieve()` and sends them, plus approved `hub-lessons`, to `api/ask.js`.
The model never changes; "learning" is teammates' corrections (status
`pending`) that the owner approves on the review view. Tapping the greeting
smiley opens it (`window.openAskHub`, called from `home-polish.js`).

**Dr. Smiley's actions.** Ask also sends a small `context` (`askContext`:
the screen Ask was opened from, the glossary term picked with "Explain with
Dr. Smiley" on a card's ⋯ menu, the specialties with a briefing, and how many
terms the Term Review record marks still learning: box 0-1). No patient data
and nothing free-form; `api/ask.js` cuts it down again (`cleanContext`). He may
suggest actions only from `ACTION_TYPES` (open_prep, choose_prep,
practice_learning, start_review, set_name, open_term, look_up, open_source),
each with a target the app sent (`allowedActions`). The phone recognises the
same three requests itself (`askIntent`: prep, practice, explain), so they
also work offline and when the server fails. Every action is re-checked when
drawn and when tapped (`askCheckAction`); "done" is said only after the
screen it opens is there (`askRunAction`). New action types go in both
lists.
