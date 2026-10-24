# AGENTS.md — read this before you change anything

Instructions for **any** AI tool working on this repo: ChatGPT / Codex,
Claude, or anything else. Claude also reads `CLAUDE.md`, which has the long
version. This file is the short shared contract. If the two ever disagree,
this file wins.

**How work is run:** one pull request = one phase from `docs/PLAN.md` (plan,
do, test, update the plan, open a pull request). A chat runs phase after
phase in a row; when it gets extremely heavy, it writes `docs/handoff.md`
and hands it to Jose to start a new chat (Jose, 2026-10-20, replacing "never
ask"). It offers to start that chat itself, with the handoff and a summary
of this chat pasted in (Jose, 2026-10-23); the new chat opens by telling
Jose what is being worked on and the goal. A new chat reads the docs and the
handoff, not the old chat. Details: `docs/PLAN.md`.
When a chat is done, say "Archive this chat" (Jose, 2026-10-18; when,
in `docs/PLAN.md`).

**Feature notes** (Ask the Hub, Dr. Smiley's memory and movement, Term Review,
the Daily Drill, 3D Body, the User Guide, Team access, …) are in
`docs/features/`, one file each. Read the one for what you touch; update it
in the same commit when the behaviour changes.

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
| 3D Body (anatomy viewer) | `atlas/` is someone else's built app; read `atlas/README.md` first. Card text: `atlas/hub-catalogue.json` (no rebuild) |
| Styles for every other screen (glossary, chat, Practice, sheets, the guide…) | `app.css` |
| User Guide answers (`GUIDE_TOPICS`, `GUIDE_SECTIONS`) | `guide/topics.js` |
| CoreCHI practice questions (`SEED_QUESTIONS`, `CCHI_DOMAINS`) | `practice/questions.js` |
| False Friends list (`FALSE_FRIENDS`) | `falsefriends/list.js` |
| The Translate tool's code (`renderTranslate`, `runTranslate`…) | `features/translate.js` |
| The 3D Body's Hub side (`anatomySync`, the `ATLAS` bridge, `atlasOnMessage`) | `features/3d-body.js` (the wall rules above still apply) |
| Looking a term up (`openTermLookup`, its trusted sources and caches) | `features/term-lookup.js` |
| The Voice and mic check in More (`voiceCheckOpen`, `audioMode`) | `features/voice-check.js` |
| Dr. Smiley's performances (`DR_PERF`, `drSquashKeys`, his mood, the effects off his head) | `features/smiley-performances.js` |
| Dr. Smiley full-length: his rig and acting (`drBody`, `DR_BODY_PERF`, `DR_BODY_STATES`) | `drsmiley/body.js` |
| Where he stands full-length and how the app reaches him (`drBodyMount`, `drBodyStage`, `DR_BODY_ACT`) | `features/smiley-body.js`; his place and tap on Home in `home-polish.js`/`.css`, the quiz corner in `app.css` |
| Notifications (Web Push, the Notifications screen, owners' sends) | `api/push.js`, `api/_push-team.js`, `api/_webpush.js`, `sw.js` (`push`), client in `index.html` ("Notifications that reach a closed phone"); `docs/features/notifications.md` |
| HUMC Brain (double-tap Dr. Smiley's head) | `brain/index.html` (the page), `brain/data.json` (from `tests/tools/brain-data.cjs`), opener in `home-polish.js`; `docs/features/humc-brain.md` |
| Your knowledge brain (Term Review's small live brain, CoreCHI Practice tile; separate from his) | `brain/you.html`, its data from `knowledgeBrainData` in `index.html`; `docs/features/knowledge-brain.md` |
| Everything else | `index.html` |

**The app's stylesheet is `app.css`** (2026-10-21, phase 1 of
`docs/split-index.md`). `index.html` has no `<style>` block any more: it
links `app.css`, then `home-polish.css`, which must stay after it so it
still wins. Never put a `<style>` block back in `index.html`; a style
change goes in `app.css` (or `home-polish.css` for Home).

**Features are moving out of `index.html` into `features/*.js`** (phase 3
of `docs/split-index.md`; Translate first, 2026-10-22). A feature's code
lives in its file: edit it there, never paste a copy back into
`index.html`. Those files load with plain `<script src>` before
`index.html`'s script, so they may only declare things at the top level;
a top-level line that calls into `index.html` would run before it exists.

**The shared design scale** (type `--fs-*`, spacing `--sp-*`, icon sizes
`--ic-*`) lives in the "Visual refinement" block at the end of `app.css`; Home's half is the block of the same name at the end of
`home-polish.css`. Use those values instead of new one-off sizes. The
interface face is Inter; the serif is for quoted human speech only. The one
exception is the Home hello banner (Jose's pick): the name in Parisienne, the
quote in Lora italic (the block "Hello banner lettering" at the end of
`home-polish.css`). Don't spread those two faces anywhere else. On the
first hello the name is written by a navy ball of light (`namePen`,
`home-polish.js`); Still and reduced motion turn it off.

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

**Dr. Smiley's size is one number per place**, in `home-polish.css`:
`--ds-k` for his button beside the tab bar, `--hw-size` for the Home
greeting (both against the size he's drawn at). Everything inside him is
drawn for that old size and scaled, so change the number, never the
pixel offsets inside him. His scroll sway pins his pivot (`smileySway` in
`index.html`: 50% 92% in the dock, 50% 85% on Home), which is why both
places move him back with `translate` or offsets after scaling; a scale
without that pushes him up. In the greeting he has one fixed place, whatever
the name (block "Dr. Smiley's own place" at the end of `home-polish.css`):
on a phone the name has the line under the greeting to itself and he stands
under it near the right edge (`--hw-left`, 48px in), his thought cloud
opening to his left; on a
computer he is 48px in from the right end of the name's line. He is never resized
for a name: `fitWave` in `home-polish.js` shrinks a name too wide for its
line instead.

**Dr. Smiley's gestures use only his drawn frames, a tilt and a lift.** Never
slide his picture sideways to fake a head turn. The one squash and stretch is
Jose's pick from a preview (E3, 2026-10-19): only the cheer's and the greet's
spring, Lively only, at most 4% of his height, on his picture and never on what
holds him (`drSquashKeys`, `DR_SQUASH` in `features/smiley-performances.js`). Don't add it anywhere
else or make it bigger without showing Jose first. A gesture the art can't draw
needs new frames, not a trick.
His five performances (`DR_PERF` in `features/smiley-performances.js`) are built fresh each play,
with their own calmer Focused versions; new gestures go there.

**Speed never costs the look** (Jose, 2026-10-15). A speed or battery fix
must leave every screen looking and moving the same: same animations, same
counts, same loops, same timing. Make the same thing cheaper (fewer layers,
transform/opacity, work moved off the first paint); never remove, shorten,
thin out or stop a visual to win a number. If a gain is only possible by
changing what Jose sees, ask him first with the numbers and a screenshot.
He reversed S1's stopped petals and one-shot heartline for this reason.

**No `:has()` for app state on `body` or other big containers.** The
browser re-checks such a rule whenever a class changes anywhere under it,
scrolling included; these rules were most of Home's style work while
scrolling. Set a class where the state changes instead, with the same
selector weight (doubled class: `body.ov-open.ov-open`). Examples: the tab
bar's `.no-current`, the overlay classes kept by `overlayFlags` in
`index.html` (`ov-open`, `gs-open`, `dm-open`).

**A rule on a body state class ends on a class, never a bare tag.**
`body.dock-mini .tabbar-btn > span:not(.x)` made every tab bar tuck
restyle every span on the page (S7b); `> span.tabbar-name` touches only
the tab names. Give the element a class instead. The dock-tuck suite
checks rules on `dock-mini`, `ov-open`, `gs-open` and `dm-open`.

**Every change someone can see updates the User Guide in the same commit.**
Jose's standing rule: a new feature, a changed behaviour, a new or moved or
renamed button, a new message. Dr. Smiley answers "how do I…" from the
guide's entries (`GUIDE_TOPICS`), so a stale answer becomes a wrong answer
from him too; nine had drifted.
- `GUIDE_TOPICS` (the answers) and `GUIDE_SECTIONS` live in
  `guide/topics.js` (plain data, loaded just before `index.html`'s script;
  2026-10-21). Add an answer for something new, rewrite any answer the
  change makes wrong (search the guide for the old label or wording).
- In `index.html`: `GUIDE_STEPS` (drawn steps) and `GUIDE_COACH` (the "Show me" selectors):
  change them when the control they draw or point at changes.
- `GUIDE_NEWS` ("New lately", three cards): a new feature gets a card,
  newest first; the oldest card drops off (its answer stays).
- `GUIDE_SECTIONS` (`guide/topics.js`) / `GUIDE_SECTION_PINS`: only when a new area of the app
  needs its own tile.
A fix nobody can notice needs no guide change; say so in the commit
message. Changes to `home-polish.*` or `pin-icons.js` still update the
guide (`guide/topics.js` and `index.html`).

`home-polish.*` and `pin-icons.js` **only cover the Home screen.** They hold
nothing for the glossary, terms, chat, Doctor Prep, study, quizzes, profile,
settings or the guide — those exist only inside `index.html`. Say so rather
than inventing a place to put them.

**Match specificity, do not escalate it.** `home-polish.css` is written with
ID selectors (`#content.is-home .x`) and loads last, so it beats
`app.css`. Anything new added there at that strength will quietly disable
`:active`, `.is-pressed` and `:focus-visible` states defined in
`app.css`. Use the weakest selector that works, then check press, focus
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
  The Hub and the viewer talk only by `postMessage`, and the Hub checks every
  message (`atlasOnMessage`: the frame on screen, opaque origin, agreed
  shape, allowed action, a structure in its own catalogue). Never let a
  message from the frame navigate, run code, write data or supply text the
  Hub shows; the Hub uses its own catalogue and glossary. The viewer's
  source changes go in `atlas/hub-changes.patch` and are rebuilt, never
  edited in the minified bundle. A body part's Spanish name goes in
  `hub-catalogue.json` only with a source that supports it.
- **Each AI job gets the cheapest model that does it well.** Judgment stays
  on the strong models: Dr. Smiley (`api/ask.js`, Opus 5.5), Term lookup and
  Doctor Prep (Sonnet, web search). Routine, high-volume jobs (Translate,
  the term check) go to Claude Haiku 5.5 through `api/_routine.js`, which
  retries once on the endpoint's previous model when Haiku declines, is cut
  off or fails. Change a model in one place, and raise effort before
  swapping to a bigger model.
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
- **The Daily Drill (Home's warm-up card) uses only written, checked
  material**: the False Friends' own lines (`heard`, `trap`, `truth`), the
  glossary, and the CoreCHI seed questions. Never generate a line, a
  rendering or a question for it, and never store what someone typed.
- **The events watcher has its own login**: `FIREBASE_SERVICE_ACCOUNT` in
  Vercel (a Google service account's JSON key; `api/_service-login.js`), so
  it keeps working once the Hub is locked. The key lives only in Vercel's
  settings: never in the repo, the database, a chat or a log.
- **A new `api/*.js` endpoint that spends money** starts with
  `if (!(await allowTeam(req, res))) return;` (from `api/_hub-access.js`),
  and the app calls it with `...(await hubAuthHeaders())` in its headers.

## Every deploy that touches `index.html`

Vercel auto-deploys on push to `main`. No build step.

**Do not edit `const BUILD_ID`, `const BUILD_TIME` (`index.html`) or
`const CACHE_VERSION` (`sw.js`) yourself, in a pull request or in a push
to `main`.** After each push to `main` that changes the app, the GitHub
Action `.github/workflows/bump-version.yml` moves all three and pushes a
commit "Bump version to bMMDD.HHMM", which Vercel deploys. (When every
change bumped them by hand, every open pull request conflicted with every
other on those lines.) Any changed `api/*.js` ships in the same push.

Then confirm that bump commit's `BUILD_ID` is actually live at
https://interp-six.vercel.app before reporting success.

## Before pushing `index.html`

It is one ~24,500-line, 1.4 MB file with all the app's JS inline (its CSS is
`app.css`), used mostly on phones in a hospital. Do not push it unverified.

**The checks live in `tests/`** (see `tests/README.md`): `cd tests && npm
install && node run.cjs`. GitHub runs the same suites on every push
(`.github/workflows/tests.yml`), whoever made the change; a red X on a commit
means something broke. Add or update a check with any change to what a suite
covers, and never weaken one to get green.

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

**Reporting to Jose: extremely concise. Sacrifice grammar for concision.**
(His standing rule.) And (Jose, 2026-10-20): **plain words, as to someone new to this** (no git or CI jargon: "a change waiting for your OK", not "a PR with green checks"; say what a word means the first time); **say "working on it" when something is still running**, and **always say "done" when it is finished**, every time, so he never has to ask "still working?".

**Always say your recommendation** (Jose, 2026-10-19). Whenever there are
options, a next step or a trade-off, name the one you would pick and why,
in plain words, without being asked. Options in plain language, not code
names.

**Ambiguous request: ask one clarifying question before doing anything.**
**Evidence before confidence:** state something as true only with evidence
for it (a measurement, a test, a primary source, the code). Say plainly what
is unproven, and don't round a lead up to a result (Jose, 2026-10-17).

**Every finished job comes with a preview and a phone notification**
(Jose, 2026-10-17). When a job is done (a PR ready, CI green, something
merged or live, or you're blocked on him), send him a preview he can look at
on his phone: screenshots of what changed (before/after when the look
changed; phone size first), or for work with nothing to see, a short
summary of what changed and what it needs from him. Then notify his phone
so he can come back and review. Not for routine progress, only when there
is something to review or decide.
