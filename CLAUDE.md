# CLAUDE.md — HUMC Interpreter Hub

Read this before changing anything. Two files rank above the rest:

- **`AGENTS.md`** (repo root) is the contract shared with ChatGPT, and it
  wins over this file where they overlap. Read it at the start of a
  session. When a shared rule changes, change it there first, or the two
  tools drift apart. Never edit it without Jose's OK.
- **`docs/PLAN.md`** is the working list: how a session runs, what's next,
  what waits on Jose.

**How work is run** (Jose, 2026-11-10): one pull request = one phase from
`docs/PLAN.md` (plan, do, test, update the plan, open a pull request). A
chat runs phase after phase until a new-session trigger hits (general rules
below, "New session triggers"). Then it asks once with buttons, "Start a
new session" first as the pick and "Keep going" second, over a short
summary; a new chat is made only when he picks it, with `HANDOFF.md`
written at the repo root. Whenever a chat starts a new chat for Jose, it
gives him a fresh summary in plain words, in two parts, a few lines each:
**what is being worked on now** (and its goal) and **what was worked on
before** (the last chat's changes and where each stands). The new chat
opens with the same two parts, its title names its focus in plain words
("Campus code to its own file"), and it reads `HANDOFF.md` first and
confirms the next step. `HANDOFF.md` is deleted once its work is done;
`docs/handoff.md` is older notes (last written 2026-11-07), left as it is.
When a chat is done, say "Archive this chat" (Jose, 2026-10-18). The steps
for all of this: `docs/PLAN.md`, "How a session runs".

## What this is

A Spanish/English medical-interpreting tool for the interpreter team at
Hackensack University Medical Center (HUMC / Hackensack Meridian Health).
Installable PWA, used mostly on phones, in a hospital, often one-handed
between assignments.

- **Live:** https://interp-six.vercel.app
- **Repo:** `jvtomax99/Interp`
- **Owner:** Jose Vazquez — staff medical interpreter, beginner web developer.
  He directs the product; Claude writes, tests and debugs all the code.

## This project: how the general rules apply here

The general rules are at the end of this file. Where this project differs,
this section says so.

- **Going live.** Merging into `main` is going live (see Deploying).
- **What a "preview" means here.** There are no preview links. `vercel.json`
  turns off deployments for `claude/**` branches (`git.deploymentEnabled`),
  to save the free 10 GB of deployment storage. The preview is Playwright
  screenshots (phone width first, then desktop) sent as files, the checks in
  `tests/` (`node run.cjs` run inside `tests/`), and a short "try this" list. In a
  pull request, the screenshots go where the general rules say "preview link".
- **Who the real user is.** The interpreter team at HUMC (41 phones joined
  by 2026-11-07), not only Jose. Jose is one of them and directs the
  product. For a big feature, remind him to check the plan with the team.
- **Plan, spec and phases** (Jose, 2026-11-10). `SPEC.md` says *what*: who
  it's for, one "Done when" line per feature, Not in v1, Later (gaps marked
  TO FILL for Jose). `docs/PLAN.md` says *in what order* (Next, Waiting on
  Jose, Later). A new feature gets its "Done when" line in `SPEC.md` and
  its detail, with "not in this version", in its `docs/features/` note.
- **"Checked off" here** means the phase is in `docs/PLAN-done.md` (the
  plan has no checkboxes). That is what the cleanup check and `HANDOFF.md`
  deletion in the general rules go by. A chat's decisions and measurements
  go in `docs/FACTS.md`; search it for the area you touch before measuring
  or retrying anything. Neither file is read whole.
- **Architecture.** `docs/ARCHITECTURE.md`: at the start of a session read
  only its short map (down to "Full file map"). The full file map (every
  file's role and line count) and the list of feature notes below it are
  for looking things up. Inside `index.html`, sections are marked with
  banner comments (`/* ---------- Team Chat ---------- */`): use them to
  navigate, never read the whole file for one section.
- **Branches.** A cloud session is handed a `claude/...` branch; use it.
  No tool commits straight to `main` (`AGENTS.md`, Jose's pick,
  2026-11-10). **Fetch `main` before writing and again before pushing:**
  it moves between sessions as other branches merge, with no notice, and
  that once had a whole session's work reviewed against a stale copy.
- **Packages.** No root package list. `tests/package.json` (the checks) and
  `promo/package.json` (the video) each have their own `npm install`.
- **Public repo, paid assets.** The repo is public (checked 2026-11-10), so
  paid raw files can't be committed (`docs/assets.md`, section 9). Vercel
  works with a private repo, but making it private is a repo setting: ask
  Jose first.
- **Taste skill.** Saved in `.claude/skills/taste/` (Senlin's, MIT;
  `SOURCE.md` there says where from). It asks for the Playwright MCP
  server; in a cloud session use the Playwright already installed instead
  (run its `references/extract.js` with `page.evaluate`).
- **Refactor prompt.** `docs/refactor.md`, run when Jose asks for
  "Refactor: CLEANUP.md items ...".

## Where to make a change

**Jose works on this app with other tools too, and their edits land in
`home-polish.css`, `home-polish.js` and `pin-icons.js`. Put changes in those
files wherever they can hold them.** Two people editing the same thing in two
different places is what silently killed the coloured press glow: a
`.is-pressed` rule in `index.html` lost to an `#content.is-home` rule in
`home-polish.css`, no error, just a dead feature.

| Kind of change | Goes in |
|---|---|
| Home screen look — greeting, search, rails, cards, quick tiles | `home-polish.css` |
| Mobile topbar and tab bar | `home-polish.css` (the `max-width:900px` block) |
| Domain folder / section overlay styling | `home-polish.css` |
| Home behaviour — wave, rail dots, section overlay | `home-polish.js` |
| Pin and icon artwork | `pin-icons.js`; the pictures are `pins/<key>.webp` |
| Styles for every other screen | `app.css` |
| User Guide answers | `guide/topics.js` |
| The lists: CoreCHI questions, False Friends, Sound-Alikes | `practice/questions.js`, `falsefriends/list.js`, `soundalikes/list.js` |
| A feature with its own file (list below) | `features/<name>.js`; its styles in `app.css` |
| Everything else | `index.html` |

**Features with their own file** in `features/` (22; each one's function
names are in `AGENTS.md`, "Where a change goes"): `3d-body` (the Hub's side,
the frame bridge), `account` (email sign-in, More's card; the server is
`api/sign-in.js`), `account-sync` (what follows your account between
phones), `ask-hub` (Ask the Hub, Dr. Smiley's conversation, actions and
memory), `backfill` (old doctor terminology), `campus` (the scene and the
building pick), `credits`, `csv` (glossary export and import),
`doctor-sheets` (the place picker, the doctor's add and edit sheet),
`duplicate-doctors`, `false-friends` and `sound-alikes` (the screens: Study,
Drill), `guide-front` (the guide's front page and search),
`knowledge-brain` (the Hub's side), `opening` (Badge in, More's Opening
card), `photo-adjust`, `smiley-engine` (art, animation, how lively, task
states), `smiley-performances`, `term-lookup`, `tool-banners` (and the
pin's fly from Home), `translate`, `voice-check`. A new feature file gets
its row in `AGENTS.md` and its line in `docs/ARCHITECTURE.md`.

**The overlay files only cover Home.** They contain nothing for the glossary,
terms, chat, Doctor Prep, study, quizzes, profile, settings or the guide —
those screens' styles are in `app.css` and their code in `index.html` or
their `features/` file, so that is where their changes have to go. Say so
plainly rather than inventing a place to put them.

**Match specificity, do not escalate it.** `home-polish.css` is written with ID
selectors (`#content.is-home .x`). Anything added there at the same or higher
specificity will quietly beat interaction states (`:active`, `.is-pressed`,
`:focus-visible`) defined in `app.css`. When adding a rule, use the lowest
specificity that works, and check that press, focus and hover still fire
afterwards — measure them, do not assume.

**Never resolve a merge with `git checkout --ours`.** It once discarded the
`pin-icons` and `home-polish` wiring out of `index.html` in a single command.
Resolve conflicts hunk by hunk, then confirm all four files are still loaded
(in `index.html`: the `<link>`s to `app.css` then `home-polish.css`, the `<script>` for
`home-polish.js` near the end of `<head>`, and the `<script>` for
`pin-icons.js` just before `</body>`) before pushing.

## Deploying

Vercel deploys the default branch only on a "Bump version" commit. There is
no build step. Every other commit is skipped by `ignoreCommand` in
`vercel.json` (2026-11-04): each merge used to deploy, then its bump deployed
the same app again seconds later, and that filled the free 10 GB of
Deployment Storage. A skipped commit shows as canceled on Vercel; that is
normal. If the bump fails, the change is not live: re-run the workflow
(Actions, Bump version, Run workflow). `tests/suites/deploy-rule.mjs` holds
the rule and the bump's commit title together.

**Never edit the version lines by hand; a GitHub Action moves them**
(2026-10-20). After every push to `main` that changes the app,
`.github/workflows/bump-version.yml` runs `.github/bump-version.cjs` and
pushes one small commit, "Bump version to bMMDD.HHMM", which Vercel deploys:

1. **`BUILD_ID`** (`index.html`, `const BUILD_ID`; `bMMDD.HHMM` in UTC,
   with `BUILD_TIME` on the next line). The only reliable way to confirm
   what is actually live.
2. **`CACHE_VERSION`** (`sw.js`, `const CACHE_VERSION`;
   `interpreter-hub-v<n>-<BUILD_ID>`). Without a new one, returning users
   keep the stale cached app.

Pull requests leave both lines alone. When every PR bumped them, every
open PR conflicted with every other on those two lines. Pushes that change
only `docs/`, `tests/`, `.github/`, `.claude/`, `*.md` or the Firebase
rules get no bump (nothing deployed changed). If an `api/*.js` file
changed, it ships in the same push.

After merging, verify: the bump commit lands on `main` (a minute when the
runners are free; ~10 min on 2026-10-20 behind the merge's own test runs),
and its `BUILD_ID` is the one to find live. From a cloud session the
site itself is blocked; read Vercel's status on that commit instead
(`curl -sS https://api.github.com/repos/jvtomax99/Interp/commits/<sha>/status`,
context "Vercel", "Deployment has completed"). Do not ask Jose to check
something you can check.

## Verifying before you push

**The suites are in `tests/`** (`cd tests && node run.cjs`, about 8
minutes; `tests/README.md`): events-watcher login, Daily Drill, User Guide,
the end-to-end journey, Dr. Smiley's gaze and his five performances, Home at rest, all
against this checkout in headless Chromium with Firebase and the AI
endpoints stood in for (`tests/support/`). GitHub runs them on every pull request and every push
to `main` (`.github/workflows/tests.yml`), so every tool's changes get
checked; a branch is checked once its pull request is open. There they run as six shares side by side
(`node run.cjs --shard=K/6`; a new suite needs only its line in `run.cjs`), and a change to nothing but
`docs/`, `.claude/` and `*.md` files skips them; "App checks result" is the one line that says how it went (2026-11-10). `.vercelignore` keeps `tests/` and `.github/` out of the deployed site.

Never push `index.html` without running all four:

1. `node --check` on the extracted inline scripts — syntax.
2. `new Function()` with a browser-globals stub, or jsdom — runtime smoke test.
3. Playwright screenshot at **phone viewport first**, desktop second.
4. Playwright **numeric measurement** — computed styles, bounding boxes,
   `elementFromPoint`. Several real bugs (color overrides, overlapping tap
   targets) were invisible in screenshots and only caught by measuring.

## Data model (Firestore)

Project `language-specialist`. Collections in use:

```
terms/{id}              one document per term  <-- never a single shared blob
terminology-meta/       categories; migrations = finished one-time updates' flags; smiley = team points (Dr. Smiley's rank)
terminology-hub/        legacy single-blob glossary; nothing reads or writes it any more
team-chat/              chat-typing/  term-attachments/  term-reviews/
healthcare-providers/   doctor-directory/  doctor-research-cache/
ce-events/  announcements/  practice-questions/  quiz-history/
activity-log/  deleted-items/  watcher-state/  team-members/  term-link-cache/
hub-access/{owner,settings}  hub-invites/{CODE}  hub-members/{uid}   <-- Team access
hub-lessons/{id}                                                     <-- Ask the Hub team notes
hub-admins/{uid}                                                     <-- Admin titles in Team Chat (team-access.md)
hub-titles/{account}                                                 <-- Titles the owner gives to an email account (email-sign-in.md, E3)
hub-credits/{key}                                                    <-- Idea credits, one per credited screen (credits.md)
push-subs/{id}  push-sent/{msgId}  push-log/{id}                     <-- Notifications (notifications.md)
accounts/{uid}  sign-in-codes/{id}  account-sync/{uid}               <-- Email sign-in (email-sign-in.md)
```

**Feature notes live in `docs/features/`.** Read the one for the feature you
touch before changing it; update it in the same commit when the behaviour
changes. The list of notes, by feature, is in `docs/ARCHITECTURE.md`.

**Every visible change updates the User Guide in the same commit** (Jose's
standing rule, written out in `AGENTS.md`): a new answer in `GUIDE_TOPICS`
(`guide/topics.js`) for anything new, any answer it makes wrong rewritten, `GUIDE_STEPS` and
`GUIDE_COACH` kept in step with the controls they draw or light up, and a
"New lately" card (`GUIDE_NEWS`) for a new feature. Say in the report what
changed in the guide; say so in the commit message when nothing needed to.

**Migrations:** new domains/terms are added by idempotent migration functions
gated on a unique boolean flag in `terminology-meta/migrations` (written with
`{merge:true}`; never on `terminology-meta/categories`, which
`saveCategoriesMeta()` overwrites whole, so a flag there would be erased and
the migration would run again), each awaited in the `loadData()` init chain.
Follow that pattern — never write a migration that runs twice. Once its flag
reads `true` in the live database, delete the migration: every launch waits
on it otherwise. `oncologySplit` and `slangGlossary` were removed that way
(2026-10-14; their code is in git history).

**Terms are individual documents.** They used to be one shared blob, which
lost concurrent edits. Do not reintroduce that.

## Hard-won gotchas — do not relearn these

- **`:hover` never fires on touchscreens.** Press feedback needs `:active`
  plus a JS `.is-pressed` class held ~260 ms.
- **iOS auto-zooms any input under 16px font-size.** Never go below 16px on
  an input.
- **Visual separation ≠ tap separation.** Check which element actually
  receives the tap at a coordinate (`document.elementFromPoint`).
- **Back navigation:** anything that takes you to a subgroup calls
  `setCategory()` so it lands on the history stack — on a parent domain that
  is a subgroup heading's **Open** button. Tapping the heading itself only
  opens the section in place (`toggleSection`, `openSections`); that is not
  navigation and adds nothing to the stack. The breadcrumb "Up to [Parent]"
  pill is explicit up-navigation; the Back button does pure history retracing.
  This broke three times — do not "simplify" it.
- **Subgroups start collapsed.** A parent domain lists its subgroups first,
  as headings, then its own General terms. All domains at rest is a grid of
  colour tiles, one per top-level domain (`domainTilesHtml`; a tap is
  `setCategory`, so Back retraces it, 2026-11-03); while searching or with a
  Slang filter it lists every domain as headings, as before. A search or a
  Slang filter opens whichever sections have matches.
  `domainRenderOrder()` follows that order (open subgroups, then the parent).
- **Press feedback on touch** comes from the `LIFTS` list in `index.html`
  (the `.is-pressed` class). A domain family card is marked as a whole, not
  the button inside it — that was why its press glow never showed.
- **Cache-first startup:** the app paints from the `localStorage` glossary
  cache. The first load after a deploy is always slow. That is expected; it is
  not a regression.
- **The Firebase SDK loads in the background** (`firebaseReady`, next to
  `firebaseConfig`). It used to be four blocking `<script>` tags, and the app
  ran no code at all until they arrived — 8 s of blank screen on slow Wi-Fi.
  `db`, `storage` and `hubAuth` are `null` until it resolves; `hubAuthReady`
  includes it. Never read them at script load, and never put the SDK back as
  plain `<script src>` tags.
- **Pins are pre-cut files.** `pin-icons.js` used to download 9 MB of sheets
  and cut every pin out on a canvas at each launch (~2.7 s on a phone). Now
  each pin is `pins/<key>.webp`; to change one, replace its file.
- **Term cards skip layout off screen** (S4, `content-visibility:auto`;
  heights are guesses until drawn). Anything that jumps into the card list
  (a scroll restore, `scrollIntoView` on a card) adds `cv-all` to
  `#content` first, or it lands on a guess; iPhone Safari has no scroll
  anchoring to fix it. `renderContent` does this itself for redraws.
- **An entrance animation never fills forwards on anything with a press
  or hover rule.** `.card` and `.doc-card` ran `cardIn ... both`, so the
  animation's last frame held their `transform` for ever, and an
  animation's held value beats every normal rule: their press glow and
  hover lift were dead for weeks with no error (found by the feel guard,
  `tests/suites/feel.cjs`, 2026-11-04). Use `backwards`; the last frame
  is the rest state anyway.
- **No `body:has(...)` for state** (`AGENTS.md`): it made scrolling Home
  restyle. Overlays open set `body.ov-open` / `.gs-open` / `.dm-open`
  (`overlayFlags` in `index.html`, a watcher, so new overlays need nothing).
- `localStorage` key `ih_myName` holds the user's display name.
- **Dr. Smiley's movement rules** (his controller, the iPhone entrance freeze,
  his size per place, the five performances, task states) are in
  `docs/features/dr-smiley.md`. Read it before touching his face, size or motion.
- **The Home banner photo is set per mode** (the block "Hello banner photo:
  tuned per mode" at the end of `home-polish.css`). Jose's brief: tree
  prominent, at least half the Hackensack sign readable and never behind
  the fade, the words or Search, the pool where there's room. The sign is
  at the photo's bottom-left, under where the words sit, so it gets its own
  band: the banner's bottom padding, ending 8px above Search, with the photo
  pinned to the banner's bottom (a longer quote grows the banner instead of
  covering it). Phone: photo 545px wide (`--ph-w`). Computer: 873-1000px
  (`--dk-w`), a mirrored blur past its right edge. Change the band and the
  photo position together; both use the same fractions of the photo width.

## Design

**`DESIGN.md` (repo root) holds every value and rule of the look**: colors
with their roles, the type scale, letter spacing by size, weights, the
finish shadow, motion, icons, do's and don'ts, known gaps, and how the Home
hello is built. `docs/design-rules.md` says how that file is made and used.
Read both before any visual change, and change `DESIGN.md` in the same
commit when a value changes. Take values from `DESIGN.md` or the code,
never from memory: this file used to carry a copy of the tokens, and one
went stale (`--ink-faint` kept its old, too-pale value here for a week).

Jose's bar is "high end", "dynamic", "alive", and he will notice if a new
feature does not match. Inherit the existing system; never invent a second
one. Two rules worth repeating here because they are broken most:

- **Speed never costs the look** (Jose, 2026-10-15; `AGENTS.md`). Make a
  visual cheaper, never smaller, shorter or stopped. Ask him first if a gain
  needs a visible change.
- **Use the tokens.** When adjusting spacing or type on a component, move
  it onto `--fs-*`, `--sp-*` and `--tr-*` rather than adding a one-off
  value.

## Subagents: the main model thinks, cheaper models fetch (Jose, 2026-10-14)

The main conversation plans, decides, writes the real code and reviews.
Repetitive work goes to the agents in `.claude/agents/`:

| Agent | Model | Use for |
|---|---|---|
| `scout` | Haiku | Finding code and usages, reading a long file or log for the few lines that matter |
| `test-runner` | Haiku | Running suites and syntax checks, reporting only failures |
| `builder` | Sonnet | Exactly specified text edits only: guide copy, renames, expected counts. Never code logic (Jose, 2026-11-10) |

Delegate when the job would pour a lot of text into the main conversation
(a full test run, sweeping `index.html` for every use of a name). Don't
delegate a one-line `grep` or a single small read: a subagent starts cold
and re-reads context, so for small jobs it costs more than doing it
directly. Check what a helper reports before relying on it; decisions,
design and anything touching data or rules stay with the main model.

## Working with Jose

The general rules at the end cover challenging him, reports, proof, asking
first, installs and pushing. These are the rules this project adds, each
also in `AGENTS.md`:

- **Plain words, as to someone new to this** (Jose, 2026-10-20): no git or
  CI jargon ("a change waiting for your OK", not "a PR with green checks");
  say what a word means the first time. **Say "working on it" when
  something is still running, and always say "done" when it is finished**,
  every time, so he never has to ask "still working?".
- **He works from a phone much of the time.** Concrete instructions, one
  step at a time; screenshots beat abstract description.
- **A question with options gets buttons** (Jose, 2026-10-18):
  `AskUserQuestion`, one button per option, the recommended one first.
  **Always say your recommendation and why**, unasked (Jose, 2026-10-19).
  Where the buttons are missing or refused, list the options plainly with
  the pick marked.
- **Ambiguous request: one clarifying question first. Evidence before
  confidence** (Jose, 2026-10-17): nothing stated as true without a
  measurement, test, primary source or the code behind it; say what is
  unproven.
- **Not building, ever** (`AGENTS.md`, "Not building"): no patient
  information of any kind; not a replacement for the hospital's systems; no
  app-store app. Flag a request that crosses one before any work.
- **Every finished job: a preview, then a phone notification** (Jose,
  2026-10-17). Screenshots of what changed (before/after, phone size
  first) sent as files with `SendUserFile` (status `proactive`), then
  `PushNotification` with one line saying what's ready and what he needs to
  do. Only when there is something to review or decide, never for routine
  progress.
- **"Push" is a notification and a button** (Jose, 2026-10-24 and
  2026-11-03). When a change is ready for his "push" (GitHub's checks
  passed), send `PushNotification` naming the change and saying it needs
  "push", even if he seems to be in the chat. Ask with `AskUserQuestion`,
  "Push (Recommended)" then "Not yet". On "Push", merge the pull request
  yourself (`merge_pull_request`, the head SHA pinned), then verify the
  deploy as in Deploying. Never only a link to GitHub's merge button.
- **A phone notification when something goes live** (Jose, 2026-11-03):
  once Vercel reports the bump commit's deploy completed, send
  `PushNotification` with the change and its `BUILD_ID`.
- **Settings to paste** (Jose, 2026-11-04), on top of the general rule:
  one code block per field, under the field's name and where it goes;
  exactly what to paste (no `https://`, no `www` unless the address has it,
  no quotes); several domains one per line in one block. Never ask for a
  secret's value in the chat.
- **Installs** (Jose, 2026-11-04), on top of the general rule: the buttons
  are "Install (Recommended)" (what it is, its size, what it buys) and "Not
  now". Never quietly work around a missing tool. Known here: Blender's
  site is blocked, but it installs from PyPI as `bpy` (about 400 MB,
  `pip install bpy`).
- **When a bug survives a fix, ask for a concrete reproduction path**
  ("Radiation → Back → Home"). That specificity is what has surfaced root
  causes; general fixes have repeatedly missed.

## Standing facts

- **The Hub is locked** (Jose, 2026-11-07, 41 phones in): practice mode
  is off, so the rules are enforced and anything that isn't a joined phone
  (or a signed-in account in the team) is refused, with no error on screen.
  A new collection without its rule line simply fails. Checked first: every
  collection the app uses has a rule, every AI call sends the sign-in, the
  events watcher logged in with its key, the Storage rules published,
  everyone had joined. Undo: Team access, Turn practice mode back on.
- **The events watcher (`api/check-events.js`) has its own login.**
  `api/_service-login.js` signs a JWT with the service account in
  `FIREBASE_SERVICE_ACCOUNT` (Vercel setting, the whole JSON key; role
  Cloud Datastore User), trades it for a one-hour token and sends that with
  every Firestore call, which the lock doesn't apply to. Each run's report
  says which login it used, and a refused key stops the run with the
  reason (first "service account" run: 2026-11-07, 14:42 UTC). Putting a
  shared secret inside the documents it writes was rejected as a
  credential leak.
- **`index.html` is 1.0 MB and about 18,400 lines** (measured 2026-11-10).
  Its split is finished (2026-10-25): the CSS is `app.css`, the data lists
  and 22 features have their own files, and what is left stays inline by
  design (`docs/split-index.md`, phase 4).

# General rules (all of Jose's website projects)

Same in every project. Where the "This project" section above differs, it wins.

## Planning

- **Challenge me.** Question my ideas; no sugarcoating. Say plainly when a plan is bad, why, and what's better; name the biggest risk I'm missing. Skip small stuff. Once I've decided after hearing you out, build it my way.
- **SPEC.md** (repo root): what it does and who for (if not me, who and what they need); one or two "Done when" lines per feature; "Not in v1"; "Later"; "Phases" (build order, a checkbox list per phase, each phase one or two sessions; check it off when done and verified). New project: write it with me before any code. Existing project without one: draft it from the code, then ask me to fill the gaps and "Not in v1". Keep it current. If I ask for something not in it or on "Not in v1", say so and ask: now, or "Later"?
- **Cleanup check.** After a phase is checked off, read "Last audit" at the top of docs/CLEANUP.md. If 3 phases have been completed since then, or it's been over 30 days, or the file is missing, offer docs/cleanup-audit.md with buttons: "Run it now" (recommended), "Next session", "Skip this time". If cleanup-audit.md is missing, ask me for the prompt and save it there.
- **docs/ARCHITECTURE.md**: short and current (main folders, key files, how data moves). Read it at session start instead of exploring; update it when the structure changes.
- **Big feature** = a new page or screen, a new kind of stored data, or a new outside service. Everything else is small.
- **Big features and new projects:** first look at 2 or 3 similar tools and tell me in a few lines how they do it and where mine can be better (new ideas go to "Later" unless I approve). Before any coding, use plan mode: what you'll build and how, in plain words, with assumptions listed separately; wait for my OK. Whenever I correct you, update SPEC.md. In a scheduled or background run, do small changes only and leave the plan. If the real user isn't me, remind me to check the plan with them.

## Proof and reporting

- **Show me it works.** I can't check code, so every feature ends with proof I can see. Never say "fixed", "works" or "done" without running or testing it; say what you checked, or "not verified" and why. Small change: a screenshot or a short "try this" list. Big feature: check its "Done when" line and give me the link to a preview I can open on my phone (what a preview is here: "This project").
- **Review before the pull request.** After a phase or big feature, and before opening its pull request, a separate reviewer subagent checks the changes for bugs, broken behavior and mismatches with SPEC.md, without seeing how the code was written. Fix what it finds; tell me in 2 or 3 lines what it caught.
- **Reports:** status updates extremely concise, fragments fine. Explanations in plain full sentences. After a meaningful change, 2 or 3 plain sentences on what changed and why.
- **Ask first** before: deleting data or files I may need, changing logins or accounts, pushing to main, deploying to the live site, anything that costs money.

## Usage

- **Keep the session light.** Read only the parts of files you need. Show me only the lines of logs and test output that matter. Big searches and many-file reads go to a subagent so only its summary comes back.
- **Helpers.** Haiku subagents for repetitive work (searching, test results, summaries, checklists). Planning, decisions and code changes stay on the main model; check helpers' results before relying on them.
- **New session triggers** (tokens or share of context, whichever first; a new session costs 20k to 40k to catch up): under 150k or 50%, keep going. 150k to 300k or 50% to 75%, finish the step, then hand off. Over 300k or 75%, hand off now, even mid-task. Over 100k and the next task is unrelated: hand off. Over 100k and I tell you I've been away over an hour: hand off. Ask once with buttons, "Start a new session" (recommended) and "Keep going"; if I keep going, don't ask again until the next trigger. If I say keep going past 75%, warn me once and write HANDOFF.md anyway (auto-compact is off, so a full session just stops).
- **HANDOFF.md** (repo root, short, pointing to what exists): the goal and exact next step; what's done (commits) and what's left; this session's decisions (also added to SPEC.md); files to look at first. Overwrite it each time; in a cloud session commit and push it on the current branch. At session start, if it exists, read it first and confirm the next step with me. Delete it once its work is done (phase checked off, pull request opened).
- **Effort.** No ultracode or max effort unless I ask.
- **Keep CLAUDE.md lean.** Suggest a one-line addition for a lasting decision; remove lines that no longer apply. Keep it short: it loads every session.

## Environment and installs

- **Settings to save** (API key, environment variable, setup step): one copy-and-paste block in the format that place expects, plus one line saying exactly where to paste it. Secrets I hold: YOUR_VALUE_HERE. Never put secrets in code or commit them.
- **Ask first, with buttons** (recommended first, plus Skip), before installing anything that changes my computer, costs money, needs an account or connects to my apps (plugins, MCP servers, connectors, system programs). Say what it is and why it helps. On yes, install it yourself and check it works. Don't ask about what's installed already. In a scheduled or background run, skip it and tell me what you skipped and why.
- **Project packages:** install without asking, mention them, and add them to the package list (package.json, requirements.txt) so one command restores everything.
- **Making installs stick:** the environment's setup script runs the project's install command; for system tools outside the project, give me the copy-and-paste line to add to it.

## Git and GitHub

- **Branches.** Never commit to main. One branch per feature or fix with a plain name (add-quiz-scores). Pull the latest main and check for uncommitted work first. (A cloud session handed a branch name uses it.)
- **Commits.** Small steps, plain-English messages ("Add score screen after practice quiz"). Never commit secrets, keys or .env files; keep them in .gitignore.
- **Pushing.** A feature branch: push freely. Into main: (1) a pull request with a short plain summary, the "Done when" check and the preview link (or screenshots where there are no previews); (2) a phone notification naming the change and saying it needs my "push" (if you can't notify, put that at the very top of your message); (3) wait for my OK before merging.
- **Never without asking** (if I ask for one, first explain what it will do and what can't be undone): force push; deleting a branch with work not in main; rewriting or resetting history (git reset --hard, rebase on main); changing repo settings (like making a repo public).
- **Big files.** GitHub rejects files over 100 MB: warn me before committing one and suggest compressing it or Git LFS.
- **Undo.** After a merge, one line on how to undo it if it breaks the live site.

## Assets and design

- **Assets** (models, textures, icons, fonts, images, sounds, templates): read docs/assets.md first and follow it. If it's missing, stop, ask me to paste my asset rules, and create it before starting.
- **Design** (any page or UI): read docs/design-rules.md and DESIGN.md first and follow them. If design-rules.md is missing, stop, ask me to paste my design rules, and create it before starting.
