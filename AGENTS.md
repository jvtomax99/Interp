# AGENTS.md — read this before you change anything

Instructions for **any** AI tool working on this repo: ChatGPT / Codex,
Claude, or anything else. Claude also reads `CLAUDE.md`, which has the long
version. This file is the short shared contract. If the two ever disagree,
this file wins.

## The one thing that keeps going wrong

**More than one tool writes to this repo, and both push straight to `main`.**
Recent history, by who pushed it:

```
Claude (git)   Clear the grey haze under the hero
ChatGPT (git)  Restore curved photo fade behind home search
ChatGPT (git)  Apply approved glass hello banner
```

Neither tool is told when the other pushes. Two real failures came from that:

1. Work was reviewed against a stale copy, because `main` had moved eleven
   commits and the tool never re-fetched.
2. The coloured press glow silently died. A `.is-pressed` rule in
   `index.html` was outranked by an `#content.is-home` rule in
   `home-polish.css`. No error — the feature just stopped working, and it
   took measuring six cards' computed shadows to find out why.

So:

- **Fetch `main` before you write anything, and again before you push.**
  If it moved, read what changed before continuing. Do not assume the copy
  you were given is current.
- **Say what you changed, in the commit message.** A real sentence. The next
  tool has no other way to know.
- **Never hand back a whole rewritten file to be uploaded.** Give the edited
  file in place, or the specific block to replace. A whole-file upload
  silently deletes everything the generating tool did not know about.
- **Never resolve a conflict with `git checkout --ours`.** It once wiped the
  `pin-icons` and `home-polish` wiring out of `index.html` in one command.
  Resolve hunk by hunk.

## Where a change goes

| Change | File |
|---|---|
| Home look — greeting, search, rails, cards, tiles | `home-polish.css` |
| Mobile top bar and tab bar | `home-polish.css` (`max-width:900px` block) |
| Domain folder / section overlay styling | `home-polish.css` |
| Home behaviour — hello wave, rail dots, overlay | `home-polish.js` |
| Pin and icon artwork | `pin-icons.js`, artwork files in `pins/` (one per pin) |
| 3D Body (anatomy viewer) | `atlas/` is someone else's built app; read `atlas/README.md` first |
| Everything else | `index.html` |

**The shared design scale** (type `--fs-*`, spacing `--sp-*`, icon sizes
`--ic-*`) lives in the "Visual refinement" block at the end of `index.html`'s
stylesheet; Home's half is the block of the same name at the end of
`home-polish.css`. Use those values instead of new one-off sizes. The
interface face is Inter; the serif is for quoted human speech only.

**Sidebar and tab bar switch at 900px**, both of them. Between 761 and 900px
they used to show together.

**Subgroups open in place.** On a parent domain (and on All domains) each
subgroup is a collapsed heading: the heading opens it where it is, and its
Open button navigates (`setCategory`, so Back retraces it). A new touch
control that should show a press goes in the `LIFTS` list in `index.html`.

**Dr. Smiley is never moved by a paused animation seeked by hand** while a
CSS animation runs on the same element: on an iPhone that froze him tiny at
the start of the Home greeting. Write the value each frame instead
(`placeFace` in `home-polish.js`).

**Every change someone can see updates the User Guide in the same commit.**
Jose's standing rule: a new feature, a changed behaviour, a new or moved or
renamed button, a new message. Dr. Smiley answers "how do I…" from the
guide's entries (`GUIDE_TOPICS`), so a stale answer becomes a wrong answer
from him too; nine had drifted. In `index.html`:
- `GUIDE_TOPICS`: add an answer for something new, rewrite any answer the
  change makes wrong (search the guide for the old label or wording).
- `GUIDE_STEPS` (drawn steps) and `GUIDE_COACH` (the "Show me" selectors):
  change them when the control they draw or point at changes.
- `GUIDE_NEWS` ("New lately", three cards): a new feature gets a card,
  newest first; the oldest card drops off (its answer stays).
- `GUIDE_SECTIONS` / `GUIDE_SECTION_PINS`: only when a new area of the app
  needs its own tile.
A fix nobody can notice needs no guide change; say so in the commit
message. Changes to `home-polish.*` or `pin-icons.js` still update the
guide, which lives in `index.html`.

`home-polish.*` and `pin-icons.js` **only cover the Home screen.** They hold
nothing for the glossary, terms, chat, Doctor Prep, study, quizzes, profile,
settings or the guide — those exist only inside `index.html`. Say so rather
than inventing a place to put them.

**Match specificity, do not escalate it.** `home-polish.css` is written with
ID selectors (`#content.is-home .x`) and loads last, so it beats the inline
CSS. Anything new added there at that strength will quietly disable
`:active`, `.is-pressed` and `:focus-visible` states defined in
`index.html`. Use the weakest selector that works, then check press, focus
and hover still fire — measure them, do not assume.

## Team access — the Hub is for the team only

Teammates get in with one shared team code, which the owner shares and can
change on the Team access screen. The real lock is `firestore.rules` / `storage.rules`; once the owner
turns practice mode off, anything that isn't a joined phone is refused, with
no error on screen. So when you add something:

- **A new Firestore collection** needs a line in `firestore.rules` using
  `if team()`, and Jose has to paste the rules into the Firebase console.
  Without it the collection is denied everywhere.
- **A new database call at startup** goes inside `hubAuthReady.then(...)`
  (see the Init block), or a locked Hub refuses it as a stranger.
- **The Firebase SDK loads in the background.** `db`, `storage` and `hubAuth`
  are `null` until `firebaseReady` resolves (`hubAuthReady` includes it), so
  code that runs as the page loads must wait for one of them before reading
  those. A `<script src>` tag for the SDK would block the whole app again.
- **`atlas/` (3D Body) is outside code, walled off.** Its frame is sandboxed
  without `allow-same-origin`, and `vercel.json` sends the same sandbox as a
  header. Never add `allow-same-origin` or load its scripts into the Hub's
  own page: it would then reach the team sign-in and saved data.
- **A write someone makes goes through `queuedWrite()` (the outbox), never a
  bare `.set()`.** The app runs without Firestore's offline cache, so offline
  a bare write just waits for the server: the screen stalls on it and the
  change is lost if the app closes. The outbox keeps it on the phone and
  sends it when the connection is back.
- **There are no personal accounts.** The team code joins a *phone*; the name
  is whatever was typed on it. Dr. Smiley's remembered preferences
  (`ih_smileyMemory`: explanation language, brief/detailed, study focus, how
  he moves, use my practice record) live only on that phone, filed under that
  name. Never sync them to Firestore, never mix them into `hub-lessons`
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
- **Term Review is the one practice record** (`term-reviews/{who__termId}`:
  box, nextReviewAt, reviewCount, lastResult, misses, lastAt). Don't start a
  second one. Answers are judged only against the team's glossary
  (`reviewAccepted`); one that differs but might be valid goes to the
  person to compare (self-review), never to a guessed "wrong". A result
  counts only once `saveTermReview` says it was stored, and a failed save
  shows on the card. No claims of mastery, and team points are never
  someone's own progress.
- **A new `api/*.js` endpoint that spends money** starts with
  `if (!(await allowTeam(req, res))) return;` (from `api/_hub-access.js`),
  and the app calls it with `...(await hubAuthHeaders())` in its headers.

## Every deploy that touches `index.html`

Vercel auto-deploys on push to `main`. No build step. Three things move
together or returning users get a stale app:

1. `BUILD_ID` in `index.html` (~line 16080, format `bMMDD.HHMM`) — bump it.
2. `CACHE_VERSION` in `sw.js` (~line 29) — bump it.
3. Any changed `api/*.js` ships in the same push.

Then confirm the new `BUILD_ID` is actually live at
https://interp-six.vercel.app before reporting success.

## Before pushing `index.html`

It is one ~21,000-line, 1.1 MB file with all CSS and JS inline, used mostly on
phones in a hospital. Do not push it unverified.

1. Syntax-check the inline scripts.
2. Run them once against a browser-globals stub — catch runtime errors.
3. Screenshot at **phone width first**, desktop second.
4. **Measure numerically** — computed styles, bounding boxes,
   `elementFromPoint`. Colour overrides and overlapping tap targets have
   both shipped looking fine in a screenshot.

## Who this is for

Jose Vazquez, staff medical interpreter at Hackensack University Medical
Center, and his interpreter team. Spanish/English, installable PWA, used
one-handed between hospital assignments. He directs the product and reviews
from a phone: one step at a time, screenshots over description.
