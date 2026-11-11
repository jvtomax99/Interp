# AGENTS.md: read this before you change anything

The rules for **any** AI tool on this repo (ChatGPT / Codex, Claude,
anything else). Claude also reads `CLAUDE.md`, which holds only what is
Claude's alone. If the two disagree, this file wins. Change a shared rule
here first, and never edit this file without Jose's OK.

**At the start of a session read:** this file, `HANDOFF.md` if there is one
(then confirm the next step with Jose), `docs/PLAN.md`, and the short map
at the top of `docs/ARCHITECTURE.md` (down to "Full file map"). Nothing
else until the work needs it.

## Who this is for

Jose Vazquez, staff medical interpreter at Hackensack University Medical
Center (HUMC, Hackensack Meridian Health) and a beginner web developer. He
directs the product; the AI writes, tests and debugs all the code. The real
users are his interpreter team (41 phones joined by 2026-11-07), so for a
big feature remind him to check the plan with them.

The app is a Spanish/English medical-interpreting tool: an installable web
app (PWA), used mostly on phones, one-handed, between hospital assignments.
Live at https://interp-six.vercel.app, repo `jvtomax99/Interp`.

## Not building

A request that crosses one of these gets flagged before any work starts.

- **No patient information, ever.** No names, record numbers, dates of
  birth, room numbers or anything else that identifies a patient, in
  Firestore, `localStorage`, Team Chat or an AI request. The Hub is for
  terms, doctors and practice.
- **Not a replacement for the hospital's official interpreting systems,**
  its scheduling or its records. It is a study and prep tool beside them.
- **No app-store app.** It stays an installable web app.

## How work is run

- **One pull request = one phase from `docs/PLAN.md`**: plan, do, test,
  update the plan, open a pull request. The steps, when a chat hands over
  to a new one (`HANDOFF.md`, the new-session triggers, the two-part
  summary) and when to say "Archive this chat" are all in `docs/PLAN.md`,
  "How a session runs". Follow it; it is the only copy.
- **`SPEC.md` says what, `docs/PLAN.md` says in what order.** `SPEC.md`:
  who it's for, one "Done when" line per feature, Not in v1, Later (gaps
  marked TO FILL for Jose). Keep it current, and update it whenever Jose
  corrects you. A request that isn't in it, or is on "Not in v1": say so
  and ask "now, or Later?". If it is ever missing, draft it from the code
  and ask Jose to fill the gaps; a new project gets its `SPEC.md` written
  with him before any code. (The build order and its phases are
  `docs/PLAN.md` here, with no checkboxes: a finished phase moves to
  `docs/PLAN-done.md`.)
- **Treat the AI as a junior developer Jose manages, not a genie.**
- **A new feature starts with its spec, not its code.** Its note in
  `docs/features/` first (what it does, who for, what it does **not** do in
  this version) and its "Done when" line in `SPEC.md`. Before that, look at
  how two or three similar tools do it (their own docs or the product, not
  a summary site) and say in the spec where ours can be better or should
  copy; new
  ideas go to "Later" unless he approves.
- **A big feature** (a new page or screen, a new kind of stored data, a new
  outside service) also needs a plan he OKs before any code: what you'll
  build and how, in plain words, assumptions listed separately. In a
  scheduled or background run, do small changes only and leave the plan.
- **Feature notes** are in `docs/features/`, one per feature (the list is
  in `docs/ARCHITECTURE.md`). Read the one for what you touch; update it in
  the same commit when the behaviour changes.
- **`docs/ARCHITECTURE.md`** stays short and current: update it when the
  structure changes. In `index.html`, navigate by the banner comments
  (`/* ---------- Team Chat ---------- */`); never read the whole file for
  one section.

## Branches, commits, merging

More than one tool writes to this repo, and neither is told when the other
pushes. Work has been reviewed against a stale copy because `main` had
moved eleven commits.

- **Never commit straight to `main`.** Work on your own branch with a plain
  name (`fix-login-button`), in small commits, and push it freely. Each
  commit message says what changed in a real sentence: the next tool has no
  other way to know.
- **Fetch `main` before you write anything, and again before you push.** If
  it moved, read what changed before continuing. Check for uncommitted
  work before you start, too.
- **Into `main`:** a pull request with a short plain summary, the "Done
  when" check and screenshots; then Jose's "push" (see "Push" below).
  Nothing merges without him. After a merge, say in one line how to undo it
  if it breaks the live app.
- **Ask first** before: deleting data or files he may need (never delete
  anything he hasn't approved), changing logins or accounts, pushing to
  `main`, deploying, anything that costs money.
- **Never without asking**, and if he asks for one, first explain what it
  will do and what can't be undone: force push, deleting a branch with work
  not in `main`, rewriting history (`git reset --hard`, rebase on `main`),
  changing repo settings (the repo is public; Vercel works with a private
  one, but making it private is his call).
- **Never commit secrets, keys or `.env` files** (`.gitignore` keeps them
  out). The repo is public, so paid raw assets can't be committed either
  (`docs/assets.md`, section 9). Warn him before committing a file over
  100 MB (GitHub rejects it) and suggest compressing it or Git LFS.
- **Never hand back a whole rewritten file to be uploaded.** Edit in place
  or give the block to replace: a whole-file upload silently deletes what
  the generating tool did not know about.
- **Never resolve a conflict with `git checkout --ours`.** It once wiped
  the `pin-icons` and `home-polish` wiring out of `index.html` in one
  command. Resolve hunk by hunk, then confirm all four files are still
  loaded in `index.html`: the `<link>`s to `app.css` then
  `home-polish.css`, the `<script>` for `home-polish.js` near the end of
  `<head>`, and the one for `pin-icons.js` just before `</body>`.

## Where a change goes

Jose's other tools edit `home-polish.css`, `home-polish.js` and
`pin-icons.js`. **Put changes in those files wherever they can hold them.**

| Change | File |
|---|---|
| Home look: greeting, search, rails, cards, quick tiles | `home-polish.css` |
| Mobile top bar and tab bar | `home-polish.css` (the `max-width:900px` block) |
| Domain folder / section overlay styling | `home-polish.css` |
| Home behaviour: hello wave, rail dots, section overlay | `home-polish.js` |
| Pin and icon artwork | `pin-icons.js`; each picture is a pre-cut `pins/<key>.webp` (to change a pin, replace its file) |
| Styles for every other screen | `app.css` |
| User Guide answers (`GUIDE_TOPICS`, `GUIDE_SECTIONS`) | `guide/topics.js` |
| The lists: CoreCHI questions, False Friends, Sound-Alikes | `practice/questions.js`, `falsefriends/list.js`, `soundalikes/list.js` |
| A feature with its own file (list below) | `features/<name>.js`; its styles in `app.css` |
| 3D Body, the viewer | `atlas/` is someone else's built app; read `atlas/README.md` first. Card text: `atlas/hub-catalogue.json` (no rebuild) |
| Notifications | `api/push.js`, `api/_push-team.js`, `api/_webpush.js`, `sw.js` (`push`), client in `index.html` ("Notifications that reach a closed phone") |
| HUMC Brain (double-tap Dr. Smiley's head) | `brain/index.html`, `brain/data.json` (made by `tests/tools/brain-data.cjs`), opener in `home-polish.js` |
| Your knowledge brain | `brain/you.html`; the Hub's side in `features/knowledge-brain.js` |
| Everything else | `index.html` |

**Features with their own file** in `features/` (22): `3d-body` (the Hub's
side, the frame bridge), `account` (email sign-in; the server is
`api/sign-in.js` with `api/_mail.js`), `account-sync`, `ask-hub` (Ask the
Hub: Dr. Smiley's conversation, actions and memory), `backfill`, `campus`
(its motion, `campusLife` and `campusDepth`, stays in `index.html`),
`credits`, `csv`, `doctor-sheets`, `duplicate-doctors`, `false-friends`,
`sound-alikes`, `guide-front`, `knowledge-brain`, `opening`,
`photo-adjust` (with the name sheet's `handleMyPhotoSelected`),
`smiley-engine`, `smiley-performances`, `term-lookup`,
`tool-banners`, `translate` (`renderTranslate`, `runTranslate`),
`voice-check`. Each file's role and function names are in the full file
map in `docs/ARCHITECTURE.md`; search there or in the code for a name. A
feature's styles sit in `app.css` under a section named for it ("Tool
banners", "Opening", "Your account", "Adjust your photo").

- **A feature's code lives in its file.** Edit it there; never paste a
  copy back into `index.html`. These files load with plain `<script src>`
  before `index.html`'s script, so they may only declare things at the top
  level. A listener one adds at load (resize, keydown, message) can fire
  before `index.html`'s script has run: guard its names with `typeof`
  (`tests/suites/load-order.cjs` checks this).
- **A new feature file** joins the three lists in `docs/split-index.md`
  ("Three lists to update with every new file": `sw.js`,
  `.github/bump-version.cjs`, `tests/support/harness.cjs`), the list
  above and `docs/ARCHITECTURE.md`.
- **The stylesheet is `app.css`.** Never put a `<style>` block back in
  `index.html`. `home-polish.css` is linked after `app.css` and must stay
  after it so it still wins.
- **`home-polish.*` and `pin-icons.js` only cover Home.** They hold nothing
  for the glossary, terms, chat, Doctor Prep, study, quizzes, profile,
  settings or the guide: those are in `app.css` (styles) and `index.html`
  or their `features/` file (code). Say so rather than inventing a place.
- **Match specificity, do not escalate it.** `home-polish.css` is written
  with ID selectors (`#content.is-home .x`) and loads last, so a rule added
  there at that strength quietly disables `:active`, `.is-pressed` and
  `:focus-visible` states from `app.css`. That is how the coloured press
  glow died with no error. Use the weakest selector that works, then
  measure that press, focus and hover still fire; do not assume.
- **Packages.** There is no root package list. `tests/package.json` (the
  checks) and `promo/package.json` (the video) each have their own
  `npm install`.

## Deploying

**Merging into `main` is going live.** There is no build step and there
are no preview links (branches do not deploy).

- **Vercel deploys `main` only on a "Bump version" commit.** Every other
  commit is skipped by `ignoreCommand` in `vercel.json` and shows as
  canceled on Vercel; that is normal. If the bump fails, the change is not
  live: re-run the workflow (Actions, Bump version, Run workflow).
  `tests/suites/deploy-rule.mjs` holds the rule and the bump's commit
  title together.
- **Never edit the version lines by hand**, in a pull request or on
  `main`: `const BUILD_ID` and `const BUILD_TIME` (`index.html`),
  `const CACHE_VERSION` (`sw.js`). After each push to `main` that changes
  the app, `.github/workflows/bump-version.yml` moves all three and pushes
  "Bump version to bMMDD.HHMM" (UTC). `BUILD_ID` is the only reliable way
  to confirm what is live; without a new `CACHE_VERSION`
  (`interpreter-hub-v<n>-<BUILD_ID>`) returning users keep the stale
  cached app.
- **No bump, so no deploy,** for a push that changes only `docs/`,
  `tests/`, `.github/`, `.claude/`, `*.md` or the Firebase rules. A changed
  `api/*.js` ships in the same push as the app.
- **After a merge, confirm it yourself** before reporting success: the
  bump commit lands on `main` (a minute when the runners are free, about
  10 behind the merge's own test runs) and its `BUILD_ID` is the one live.
  Do not ask Jose to check something you can check.

## Checks before pushing

**The checks are in `tests/`** (`cd tests && npm install && node run.cjs`,
about 8 minutes; `tests/README.md`). GitHub runs the same suites on every
pull request and every push to `main`, whoever made the change; "App
checks result" is the one line that says how it went. A change to nothing
but `docs/`, `.claude/` and `*.md` files skips them and still goes green.
Add or update a check with any change to what a suite covers (a new suite
needs only its line in `run.cjs`), and never weaken one to get green.

Never push `index.html` (18,400 lines, 1.0 MB; its split into `app.css`
and `features/` is finished) without all four:

1. Syntax: `node --check` on the extracted inline scripts.
2. A runtime smoke test: run them once against a browser-globals stub
   (`new Function()`) or jsdom.
3. A Playwright screenshot at **phone width first**, desktop second.
4. **Numeric measurement**: computed styles, bounding boxes,
   `elementFromPoint`. Colour overrides and overlapping tap targets have
   both shipped looking fine in a screenshot.

**The preview** Jose gets is those screenshots sent as files, the checks,
and a short "try this" list. In a pull request the screenshots go where a
preview link would.

## Data and team access

Teammates get in with one shared team code, which the owner shares and can
change on the Team access screen. The real lock is `firestore.rules` /
`storage.rules`. **The Hub has been locked since 2026-11-07** (practice
mode off): anything that isn't a joined phone, or a signed-in account in
the team, is refused with no error on screen
(`docs/features/team-access.md`). The collections are listed in
`docs/ARCHITECTURE.md`, "Data model".

- **A new Firestore collection** needs a line in `firestore.rules` using
  `if team()`, and Jose has to paste the rules into the Firebase console.
  Without it the collection simply fails everywhere.
- **A new database call at startup** goes inside `hubAuthReady.then(...)`
  (see the Init block), or the locked Hub refuses it as a stranger.
- **The Firebase SDK loads in the background** (`firebaseReady`, next to
  `firebaseConfig`). `db`, `storage` and `hubAuth` are `null` until it
  resolves (`hubAuthReady` includes it): never read them at script load,
  and never put the SDK back as plain `<script src>` tags (that was 8 s of
  blank screen on slow Wi-Fi).
- **Terms are one document each** (`terms/{id}`). They used to be one
  shared blob, which lost concurrent edits. Do not bring that back.
- **A write someone makes goes through `queuedWrite()` (the outbox), never
  a bare `.set()`.** The app runs without Firestore's offline cache, so
  offline a bare write stalls the screen and is lost if the app closes.
- **Migrations** (new domains or terms) are idempotent functions, each
  gated on its own boolean flag in `terminology-meta/migrations` (written
  with `{merge:true}`; never on `terminology-meta/categories`, which
  `saveCategoriesMeta()` overwrites whole, so the flag would be erased and
  the migration would run again), each awaited in the `loadData()` init
  chain. Never write one that runs twice. Once its flag reads `true` in
  the live database, delete the migration: every launch waits on it.
- **A new `api/*.js` endpoint that spends money** starts with
  `if (!(await allowTeam(req, res))) return;` (from `api/_hub-access.js`),
  and the app calls it with `...(await hubAuthHeaders())` in its headers.
- **Each AI job gets the cheapest model that does it well.** Judgment
  stays on the strong models: Dr. Smiley (`api/ask.js`, Opus 5.5), Term
  lookup and Doctor Prep (Sonnet, web search). Routine, high-volume jobs
  (Translate, the term check) go to Haiku 5.5 through `api/_routine.js`,
  which retries once on the endpoint's previous model when Haiku declines,
  is cut off or fails. Change a model in one place, and raise effort
  before swapping to a bigger model.
- **The events watcher (`api/check-events.js`) has its own login**:
  `FIREBASE_SERVICE_ACCOUNT` in Vercel (a Google service account's whole
  JSON key; `api/_service-login.js`), which the lock doesn't apply to. The
  key lives only in Vercel's settings: never in the repo, the database, a
  chat or a log, and never as a shared secret inside the documents it
  writes.
- **`atlas/` (3D Body) is outside code, walled off.** Its frame is
  sandboxed without `allow-same-origin`, and `vercel.json` sends the same
  sandbox as a header. Never add `allow-same-origin` or load its scripts
  into the Hub's own page: it would then reach the team sign-in and saved
  data. The Hub and the viewer talk only by `postMessage`, and the Hub
  checks every message (`atlasOnMessage`: the frame on screen, opaque
  origin, agreed shape, allowed action, a structure in its own catalogue).
  Never let a message from the frame navigate, run code, write data or
  supply text the Hub shows. The viewer's source changes go in
  `atlas/hub-changes.patch` and are rebuilt, never edited in the minified
  bundle. A body part's Spanish name goes in `hub-catalogue.json` only
  with a source that supports it.

Four features carry trust rules. The short form is here; read the note
before touching the feature.

- **What Dr. Smiley remembers** (`ih_smileyMemory`: explanation language,
  brief/detailed, study focus, how he moves, use my practice record) lives
  only on that phone, under that name, signed in or not. Never sync it to
  Firestore, never mix it into `hub-lessons` (approved team knowledge),
  never add a free-text field to it (no patient details). An account
  (email sign-in) is optional and carries name, photo, practice and
  settings between phones (`account-sync/{uid}`), not this.
  `docs/features/email-sign-in.md`.
- **A conversation with Dr. Smiley is not a preference.** What "that"
  means, a language asked for mid-chat, the briefing being discussed and
  the interpreter's corrections live in `ASK.convo` (in memory, bounded,
  cleared by New conversation): never in `ih_smileyMemory`, never in
  Firestore. Only an explicit tap saves a preference; only an
  owner-approved `hub-lessons` note is team knowledge. A correction is
  used for the rest of the conversation, labelled "not checked", never
  verified or a source. A follow-up that can mean two things asks one
  question with a button per option; one that refers to nothing says so.
  Never resolve a reference to an entry the phone didn't send, and nothing
  from a stopped request may change the screen or the record.
  `docs/features/ask-memory-followups.md`.
- **Term Review is the one practice record** (`term-reviews/{who__termId}`).
  Don't start a second one. Answers are judged only against the team's
  glossary (`reviewAccepted`); one that differs but might be valid goes to
  the person to compare, never to a guessed "wrong". A result counts only
  once `saveTermReview` says it was stored, and a failed save shows on the
  card. No claims of mastery, and team points are never presented as one
  person's progress. `docs/features/term-review.md`.
- **The Daily Drill uses only written, checked material**: the False
  Friends' own lines, the glossary, the CoreCHI seed questions. Never
  generate a line, a rendering or a question for it, and never store what
  someone typed. `docs/features/daily-drill.md`.

## Things that broke before: do not relearn these

- **`:hover` never fires on touchscreens.** Press feedback is `:active`
  plus a JS `.is-pressed` class held about 260 ms, from the `LIFTS` list in
  `index.html`; a new touch control that should show a press goes in that
  list. A domain family card is marked as a whole, not the button inside
  it (that was why its glow never showed).
- **An entrance animation never fills forwards on anything with a press or
  hover rule.** `.card` and `.doc-card` ran `cardIn ... both`, the last
  frame held their `transform` for ever, and an animation's held value
  beats every normal rule: press glow and hover lift were dead for weeks
  with no error. Use `backwards` (`tests/suites/feel.cjs` guards it).
- **Never under 16px font-size on an input**: iOS zooms the page.
- **Visual separation is not tap separation.** Check which element gets
  the tap at a coordinate (`document.elementFromPoint`).
- **Back navigation.** Anything that takes you to a subgroup calls
  `setCategory()` so it lands on the history stack; on a parent domain
  that is a subgroup heading's **Open** button. Tapping the heading only
  opens the section in place (`toggleSection`, `openSections`): not
  navigation, nothing on the stack. The "Up to [Parent]" pill is explicit
  up-navigation; Back does pure history retracing. This broke three
  times: do not "simplify" it.
- **Subgroups start collapsed.** A parent domain lists its subgroups
  first, as headings, then its own General terms. All domains at rest is a
  grid of colour tiles, one per top-level domain (`domainTilesHtml`; a tap
  is `setCategory`); while searching or with a Slang filter it lists every
  domain as headings, and opens whichever sections have matches.
  `domainRenderOrder()` follows that order.
- **Term cards skip layout off screen** (`content-visibility:auto`;
  heights are guesses until drawn). Anything that jumps into the card list
  (a scroll restore, `scrollIntoView` on a card) adds `cv-all` to
  `#content` first, or it lands on a guess; iPhone Safari has no scroll
  anchoring to fix it. `renderContent` does this itself for redraws.
- **No `:has()` for app state on `body` or other big containers**: the
  browser re-checks it on every class change under it, scrolling included.
  Set a class where the state changes, with the same selector weight
  (doubled class: `body.ov-open.ov-open`). Overlays set `body.ov-open` /
  `.gs-open` / `.dm-open` through `overlayFlags` in `index.html` (a
  watcher, so new overlays need nothing); the tab bar uses `.no-current`.
- **A rule on a body state class ends on a class, never a bare tag**
  (`> span.tabbar-name`, not `> span:not(.x)`, which restyled every span
  on the page). The dock-tuck suite checks rules on `dock-mini`,
  `ov-open`, `gs-open` and `dm-open`.
- **Sidebar and tab bar switch at 900px**, both of them.
- **Cache-first startup.** The app paints from the `localStorage` glossary
  cache, so the first load after a deploy is always slow. That is expected,
  not a regression. `ih_myName` holds the user's display name.
- **When a bug survives a fix, ask Jose for a concrete path** ("Radiation,
  Back, Home"). General fixes have repeatedly missed.

## Design

**Read `DESIGN.md` (every value and rule of the look) and
`docs/design-rules.md` before any visual change**, and change `DESIGN.md`
in the same commit when a value changes. Take values from `DESIGN.md` or
the code, never from memory. If `docs/design-rules.md` is ever missing,
stop, ask Jose to paste his design rules, and create the file before
starting. Assets (models, textures, icons,
fonts, images, sounds, templates): read `docs/assets.md` first and follow
it; if it is missing, stop, ask him to paste his asset rules, and create
it before starting.

- **Jose's bar is "high end", "dynamic", "alive"**, and he will notice a
  feature that does not match. Inherit the existing system; never invent a
  second one.
- **Speed never costs the look.** A speed or battery fix leaves every
  screen looking and moving the same: same animations, counts, loops and
  timing. Make the same thing cheaper (fewer layers, transform/opacity,
  work moved off the first paint); never remove, shorten, thin out or stop
  a visual to win a number. If a gain needs a change he can see, ask him
  first with the numbers and a screenshot.
- **Use the tokens.** The shared scale (type `--fs-*`, spacing `--sp-*`,
  letter spacing `--tr-*`, icons `--ic-*`) is the "Visual refinement"
  block at the end of `app.css`, with Home's half at the end of
  `home-polish.css`. When adjusting spacing or type, move the component
  onto them instead of adding a one-off value.
- **Faces.** The interface face is Inter; the serif is for quoted human
  speech only. The one exception is the Home hello banner: the name in
  Parisienne, the quote in Lora italic (block "Hello banner lettering" at
  the end of `home-polish.css`). Don't spread those two anywhere else. On
  the first hello the name is written by a navy ball of light (`namePen`,
  `home-polish.js`); Still and reduced motion turn it off.
- **The Home banner photo is set per mode** (block "Hello banner photo:
  tuned per mode" at the end of `home-polish.css`). Its brief is in
  `DESIGN.md`; change the sign's band and the photo position together.
- **Dr. Smiley: read `docs/features/dr-smiley.md` before touching his
  face, size or motion.** Three rules from it, because they were broken
  before: never move him with a paused animation seeked by hand while a
  CSS animation runs on him (it froze him tiny on an iPhone; write the
  value each frame, `placeFace`); his size is one number per place
  (`--ds-k`, `--hw-size`), never the pixel offsets inside him, and he is
  never resized for a name (`fitWave` shrinks the name); his gestures use
  only his drawn frames, a tilt and a lift, never a sideways slide, and
  the one squash (the cheer's and the greet's spring, Lively only, at most
  4%) is not added elsewhere or made bigger without showing Jose first.
  New gestures go in `DR_PERF` (`features/smiley-performances.js`). A
  gesture the art can't draw needs new frames, not a trick.

## The User Guide

**Every change someone can see updates the User Guide in the same
commit**: a new feature, a changed behaviour, a new, moved or renamed
button, a new message. Dr. Smiley answers "how do I..." from the guide, so
a stale answer becomes a wrong answer from him too. Changes to
`home-polish.*` or `pin-icons.js` count.

- `GUIDE_TOPICS` (the answers, `guide/topics.js`): add one for anything
  new; rewrite any the change makes wrong (search the guide for the old
  label or wording).
- `GUIDE_STEPS` (drawn steps) and `GUIDE_COACH` (the "Show me" selectors),
  in `index.html`: change them when the control they draw or point at
  changes.
- `GUIDE_NEWS` ("New lately", three cards): a new feature gets a card,
  newest first; the oldest drops off (its answer stays).
- `GUIDE_SECTIONS` (`guide/topics.js`) / `GUIDE_SECTION_PINS`: only when a
  new area of the app needs its own tile.

Say in the report what changed in the guide. A fix nobody can notice needs
no guide change; say so in the commit message.

## Working with Jose

- **Plain words, as to someone new to this.** No git or CI jargon ("a
  change waiting for your OK", not "a PR with green checks"); say what a
  word means the first time. **Say "working on it" while something is
  still running, and always say "done" when it is finished**, every time,
  so he never has to ask "still working?".
- **He reviews from a phone.** One step at a time; screenshots beat
  description.
- **Reports.** Status updates extremely concise, fragments fine.
  Explanations in plain full sentences. After a meaningful change, 2 or 3
  plain sentences on what changed and why.
- **Challenge him.** Say plainly when an idea is weak, costly, off his
  goal or already covered by the app, why, and what's better; name the
  biggest risk he's missing. No sugarcoating, no praise for its own sake;
  skip small stuff. Once he has decided after hearing you out, build it
  his way.
- **Ambiguous request: one clarifying question before doing anything.**
- **Evidence before confidence.** State something as true only with a
  measurement, a test, a primary source or the code behind it. Say plainly
  what is unproven; don't round a lead up to a result. Never say "fixed",
  "works" or "done" without running or testing it: say what you checked,
  or "not verified" and why. A small change ends with a screenshot or a
  short "try this" list; a big feature with its "Done when" line checked
  and the screenshots.
- **A question with options gets buttons**, one per option, the
  recommended one first, in plain language and not code names. **Always
  say your recommendation and why**, unasked, whenever there are options,
  a next step or a trade-off. Where a tool has no buttons, list the
  options plainly with the pick marked.
- **Every finished job: a preview, then a phone notification.** When a job
  is done (a pull request ready, checks passed, something merged or live,
  or you're blocked on him), send screenshots of what changed (before and
  after when the look changed; phone size first), or for work with nothing
  to see, a short summary of what changed and what it needs from him. Then
  notify his phone, one line saying what's ready and what he needs to do. Only when there is something to review or decide,
  never for routine progress.
- **"Push" is a phone notification and a button.** Every time a change is
  ready for his OK to go live (its checks passed), notify his phone,
  naming the change and saying it needs his "push", even if he seems to be
  in the chat (where you can't notify, put that at the very top of your
  message). Ask with buttons, "Push" first as the pick and "Not yet"
  second. On "Push", merge it yourself, then confirm it is live as in
  Deploying. Never leave him a merge button or a link to find.
- **A phone notification when something goes live**: once Vercel reports
  the bump commit's deploy completed, tell him which change and its
  `BUILD_ID`, even if he seems to be in the chat.
- **Settings come ready to paste.** Whenever something has to be saved
  somewhere (a domain under Network access, a secret, an environment
  variable, a setup-script line), give the exact text in its own code
  block, one block per field, each under the field's name and where it
  goes (menu, then field). Exactly what to paste: no `https://`, no `www`
  unless the address has it, no quotes, no explanation inside the block;
  several domains go one per line in one block. Never only describe the
  value. The exception is a secret's value (an API key): say where to get
  it and which field it goes in, write `YOUR_VALUE_HERE` where a block
  shows it, and never ask him to paste one into the chat or put one in
  code.
- **Installs.** Project packages (`tests/package.json` and the like)
  install without asking: mention them and add them to the package list so
  one command restores everything. Anything else (a program, plug-in,
  connector, MCP server, anything paid, anything that needs an account or
  changes his computer) asks first with buttons: "Install" first as the
  pick, with what it is, its size and what it buys, then "Not now". On
  "Install", install it yourself and check it works. Never work around a
  missing tool in silence when one would do the job better, and don't ask
  about what's installed already. An install lasts only for that chat's
  machine: to keep it, give him the setup-script line to paste. In a
  scheduled or background run, skip the install and say what you skipped
  and why.
