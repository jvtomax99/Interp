# CLAUDE.md — HUMC Interpreter Hub

Read this before changing anything. It is the source of truth for how this
project is built and shipped.

**How work is run** (Jose, 2026-11-10): one pull request = one phase from
`docs/PLAN.md` (plan, do, test, update the plan, open a pull request). A
chat runs phase after phase until a new-session trigger hits: about 150k
tokens or half the context, finish the current step, then hand off; over
300k or 75%, hand off now (general rules below, "When to start a new
session"). Then
it writes `HANDOFF.md` at the repo root and asks once with buttons, "Start
a new session" first as the pick and "Keep going" second, over a short
summary; a new chat is made only when he picks it. Whenever a chat starts
a new chat for Jose, it gives him a fresh summary in plain words, in two
parts, a few lines each: **what is being worked on now** (and its goal)
and **what was worked on before** (the last chat's changes and where each
stands). The new chat opens with the same two parts, its title names its
focus in plain words ("Campus code to its own file"), and it reads
`HANDOFF.md` first and confirms the next step. `HANDOFF.md` is deleted
once its work is done; `docs/handoff.md` is older notes. Details:
`docs/PLAN.md`. When a chat is done, say "Archive this chat" (Jose,
2026-10-18; when, in `docs/PLAN.md`).

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

- **Hosting.** Vercel, from `main`. It deploys only on the "Bump version to
  bMMDD.HHMM" commit that a GitHub Action pushes after a change to the app
  (see Deploying). So merging into `main` is going live.
- **What a "preview" means here.** There are no preview links. `vercel.json`
  turns off deployments for `claude/**` branches (`git.deploymentEnabled`),
  to save the free 10 GB of deployment storage. The preview is Playwright
  screenshots (phone width first, then desktop) sent as files, the checks in
  `tests/` (`node run.cjs` run inside `tests/`), and a short "try this" list. In a
  pull request, the screenshots go where the general rules say "preview link".
- **Who the real user is.** The interpreter team at HUMC (41 phones joined
  by 2026-11-07, see Open items), not only Jose. Jose is one of them and
  directs the product. For a big feature, remind him to check the plan with
  the team.
- **Plan, spec and phases** (Jose, 2026-11-10). `SPEC.md` says *what*: who
  it's for, one "Done when" line per feature, Not in v1, Later (gaps marked
  TO FILL for Jose). `docs/PLAN.md` says *in what order*: the phases
  (Next, Done), and Facts, where a chat's decisions go. A new feature
  gets its "Done when" line in `SPEC.md` and its detail, with "not in this
  version", in its `docs/features/` note.
- **Architecture.** `docs/ARCHITECTURE.md`: the short map, then the full
  file map and the list of feature notes. Read it at the start of a session.
- **Handoffs.** Root `HANDOFF.md` (see "How work is run"). `docs/handoff.md`
  is older notes (the last one written 2026-11-07); leave it as it is.
- **Branches.** A cloud session is handed a `claude/...` branch; use it.
  Since 2026-11-10 `AGENTS.md` tells every tool, ChatGPT included, never to
  commit straight to `main` (Jose's pick). `main` still moves between
  sessions as other branches merge, so fetch it before writing and again
  before pushing.
- **Packages.** No root package list. `tests/package.json` (the checks) and
  `promo/package.json` (the video) each have their own `npm install`.
- **`AGENTS.md`** is the shared contract with ChatGPT and wins over this file
  where they overlap. Do not edit it without Jose's OK.
- **Public repo, paid assets.** The repo is public (checked 2026-11-10), so paid raw files can't be committed (docs/assets.md, section 9). Vercel works with a private repo, but making it private is a repo setting: ask Jose first.
- **Taste skill.** Saved in `.claude/skills/taste/` (Senlin's, MIT; `SOURCE.md` there says where from). It asks for the Playwright MCP server; in a cloud session use the Playwright already installed instead (run its `references/extract.js` with `page.evaluate`).
- **Refactor prompt.** docs/refactor.md, run when Jose asks for "Refactor: CLEANUP.md items ...".

### Old rules settled (Jose, 2026-11-10)

- New session: the token triggers in "When to start a new session"; a chat
  runs phases in a row until one hits.
- Handoff: root `HANDOFF.md`, deleted once its work is done.
- Spec: `SPEC.md` for what, `docs/PLAN.md` for order and Facts,
  `docs/features/` for each feature's detail.
- Reports: status updates short, explanations in full plain sentences.
- Installs: normal project packages without asking (mention them);
  programs, plugins, connectors and anything paid still ask first.
- Settings to paste: one box per field, YOUR_VALUE_HERE where a secret goes.
- `builder` (Sonnet): text edits only; code changes stay on the main model.
- Kept as is: a phone notification after every finished job and when
  something goes live; "Push" as a button that merges with the head SHA
  pinned; one clarifying question for an ambiguous request.

## File map

Every file's role, with line counts, is in `docs/ARCHITECTURE.md` ("Full
file map"), moved there 2026-11-10 to keep this file lean. Inside
`index.html`, sections are marked with banner comments
(`/* ---------- Team Chat ---------- */`). Use them to navigate — do not read
the whole file when you only need one section.

## Where to make a change

**`AGENTS.md` at the repo root is the shared contract, and it wins over this
file where they overlap.** ChatGPT/Codex reads it automatically; this file is
Claude's longer version. Change `AGENTS.md` first when a rule changes here,
or the two tools drift apart again.

**Fetch `main` before writing and again before pushing.** ChatGPT pushed
directly to `main` under Jose's name until 2026-11-10 (now a branch and a
pull request, `AGENTS.md`), and `main` still moves between sessions with
no notice. That has already caused work to be reviewed against a stale copy
for an entire session.

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
| Pin and icon artwork | `pin-icons.js` |
| Styles for every other screen | `app.css` |
| User Guide answers | `guide/topics.js` |
| User Guide front page and search | `features/guide-front.js` |
| Doctor and provider sheets: the place picker, the doctor's add and edit sheet | `features/doctor-sheets.js` |
| Glossary CSV export and import | `features/csv.js` |
| Duplicate doctors (finding and merging them) | `features/duplicate-doctors.js` |
| The terminology backfill (old doctor terminology) | `features/backfill.js` |
| Ask the Hub, Dr. Smiley's conversation, actions and memory | `features/ask-hub.js` |
| CoreCHI practice questions | `practice/questions.js` |
| False Friends list | `falsefriends/list.js` |
| False Friends screen (Study, Drill) | `features/false-friends.js` |
| Sound-Alikes list | `soundalikes/list.js` |
| Sound-Alikes screen (Study, Drill) | `features/sound-alikes.js` |
| Your knowledge brain, the Hub's side (its data, the small brain on Term Review) | `features/knowledge-brain.js` |
| Translate tool code | `features/translate.js` |
| 3D Body's Hub side (the frame bridge) | `features/3d-body.js` |
| Looking a term up | `features/term-lookup.js` |
| Voice and mic check | `features/voice-check.js` |
| Dr. Smiley's performances | `features/smiley-performances.js` |
| Dr. Smiley's engine: art, animation, how lively, task states | `features/smiley-engine.js` |
| Your HUMC campus (the scene and the building pick) | `features/campus.js` |
| Idea credits (whose idea a screen was) | `features/credits.js`; styles in `app.css` |
| Tool banners (Translate, Term Review, Ask, Doctor Directory) and the pin's fly from Home | `features/tool-banners.js`; styles in `app.css` ("Tool banners") |
| The opening (Badge in) and More's Opening card | `features/opening.js`; styles in `app.css` ("Opening") |
| Your account, email sign-in (More's card; the server is `api/sign-in.js`) | `features/account.js`; styles in `app.css` ("Your account") |
| What follows your account between phones (the sync and its joins) | `features/account-sync.js` |
| Adjusting your photo before it's saved (the name sheet) | `features/photo-adjust.js`; styles in `app.css` ("Adjust your photo") |
| Everything else | `index.html` |

**The overlay files only cover Home.** They contain nothing for the glossary,
terms, chat, Doctor Prep, study, quizzes, profile, settings or the guide —
those screens' styles are in `app.css` and their code inside `index.html`,
so that is where their changes have to go. Say so plainly rather than inventing a place to put them.

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
endpoints stood in for (`tests/support/`). GitHub runs them on every push
(`.github/workflows/tests.yml`), so ChatGPT's pushes to `main` get checked
too. `.vercelignore` keeps `tests/` and `.github/` out of the deployed site.

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

## Design system

**`DESIGN.md` at the repo root is the reference for every value** (colors with
their roles, type scale, letter spacing by size, weights, shadows, motion,
do's and don'ts), written 2026-11-03 so ChatGPT and Jose's other tools work
from the same page. This section keeps the history behind the rules; when
a value changes, change `DESIGN.md` too.

Jose's bar is "high end", "dynamic", "alive", and he will notice if a new
feature does not match. Inherit the existing system rather than inventing:
CSS custom properties, dark navy sidebar on desktop, floating capsule tab bar
with pill indicator on mobile, liquid-glass backdrop blur, soft color-mesh
background, layered card shadows, touch-press lift.

**Icons are duotone:** a large flat color block spilling past the outline on
one side — not a tint tracing the shape. Domain color and light/dark adapt
through `--ic-fill` / `--ic-line`.

### Measured tokens

*Generated by /taste from the live site. These are the numbers behind the
description above — use them rather than eyeballing a match.*

```
--bg #F4F6FA          --paper #FFFFFF        --bg-hi #FAFBFD
--ink #151C2C         --ink-soft #5A6478     --ink-faint #98A1B3
--accent #0F5FA6      --accent-2 #2E8BD0     --accent-soft #E8F1FA
--navy #252E6D        --cyan #01B8E6         --danger #C2485C
--line #E2E7F0        --line-soft #EEF1F7    --danger-soft #FBECEF
--glass-bg rgba(255,255,255,0.72)   --glass-blur saturate(180%) blur(20px)
--r-sm 10px   --r-md 14px   --r-lg 20px   --ease cubic-bezier(.2,.8,.2,1)
```

**The finish.** Every raised surface gets exactly this, not a custom shadow.
38 elements share the string:

```css
box-shadow:
  0 1px 0 0 inset rgba(255,255,255,0.82),
  0 1px 2px        rgba(20,43,67,0.06),
  0 8px 20px -12px rgba(22,55,90,0.22);
```

**Type.** Inter (variable) for all interface text — headings included; the
banner titles and section heads used to be serif. Scale, as tokens in the
"Visual refinement" block of `app.css`: caption 12, footnote 13, subhead
15, headline 17, title3 20, title2 22, title1 28 (`--fs-*`), and since
2026-11-03 Apple's other three, caption2 11, callout 16, large title 34;
every stylesheet size is one of the ten (36px and up excepted). Spacing
6/9/13/17/26 (`--sp-*`). Icons: rows and tab bar 24, list rows 28, tiles and
cards 32, banner 44 (`--ic-*`). Tracking tightens as size grows; prefer the
weights 550 and 650 (2026-11-03, the type tidy: Inter uses only 400, 500
for body text, 550 and 650, and letter spacing comes from the `--tr-*`
token for the size; `tests/suites/type-tokens.cjs` holds it). IBM Plex Serif is reserved for quoted human speech (Ask
answers, review lines). The Home hello banner is the one exception, Jose's
pick ("style 8"): the name in Parisienne, the quote in Lora italic, the author
in small Inter capitals behind a short rule, over two soft local shadings
(never a card). Block "Hello banner lettering" at the end of
`home-polish.css`; `keepQuoteEnd` (no lone last word) and `fitWave` (a name
too wide for its line shrinks; Dr. Smiley never moves) in `home-polish.js`.
Don't use those two faces anywhere else. The first hello after the app
opens has the name written by a small navy ball of light (`namePen` in
`home-polish.js`, Jose's pick "look A"): the pen path is worked out on the
phone from the letters themselves (`penPathOf`: canvas on the page, then `penTrace` in
a worker: thinning, a left-to-right walk, accent and i-dots last), kept per name in `ih_penPath`; the real name
waits invisible (`.is-penning`, at most 6 s before the writing starts, and a wall-clock cap on the writing itself) under an SVG copy that is
revealed behind the ball. Reduced motion, Still, a hidden page or any failure:
the name is simply there.

Rules that hold across the whole app:

- **Speed never costs the look** (Jose, 2026-10-15; `AGENTS.md`). Make a
  visual cheaper, never smaller, shorter or stopped. Ask him first if a gain
  needs a visible change.

- Accent is an SVG fill, never a button or link color. `#0F5FA6` appears as
  a background on exactly 1 element.
- A rounded child inside a rounded parent always takes the smaller radius:
  `.qa-tile` 17px to `.qa-tile-icon` 12px, `.qa-card` 19px to `.qa-icon` 12px.
  There is currently no equal parent/child pair in the codebase.
- Shadows and borders tint navy, never `rgba(0,0,0,x)`. No pure gray exists
  in the palette; every neutral is blue-shifted.
- Card rails are 4 columns at 13px gap, content left-aligned. Centering is
  only for the four `.qa-tile` buttons.
- Keep `:focus-visible` and the `prefers-reduced-motion` guard on anything new.
- **Easing** (S5, 2026-10-20): a plain tap settles on `--spring0`, Apple's
  bounce-0 spring (`linear()`, `--ease` where unsupported; press .368s,
  screen .588s, sheet .662s). Overshoot only where it is the point: F2's
  `--spring-settle` on the Practice buttons, Dr. Smiley's acting. No new
  overshooting `cubic-bezier`; `tests/suites/springs.cjs` lists the kept ones.

**Known gap.** The look is tokenized (69 `:root` vars); the rhythm mostly
is not. (Type is done since 2026-11-03: sizes, spacing between letters and
weights all come from tokens. The numbers below are spacing's, and type's
as they were.) The type and spacing tokens above exist (`--fs-*`: 7, `--sp-*`: 5)
but little uses them. Measured in `index.html`'s CSS (now `app.css`) on 2026-10-20:
font-size is set with a token 65 times and with a plain px value about 900
times, over 36 distinct sizes (12/12.5/13 and 14/14.5/15 all still there,
distinctions the eye cannot resolve); padding, margin and gap use a token
99 times against 1,737 px values, 12 of them crowding into 6-17px: 9px (251
uses), 13px (195), 6px (191), 8px (77), 14px (74), 10px and 17px (69 each),
then 12/11/16/7/15. The scale **6 / 9 / 13 / 17 / 26** covers 42% of the
px spacing uses as they stand. When adjusting spacing or type on a
component, move it onto the tokens rather than extending the tail.

## Subagents: Opus thinks, cheaper models fetch (Jose, 2026-10-14)

The main conversation (Opus 5.5) plans, decides, writes the real code and
reviews. Repetitive work goes to the agents in `.claude/agents/`:

| Agent | Model | Use for |
|---|---|---|
| `scout` | Haiku 5.5 | Finding code and usages, reading a long file or log for the few lines that matter |
| `test-runner` | Haiku 5.5 | Running suites and syntax checks, reporting only failures |
| `builder` | Sonnet 5.5 | Exactly specified text edits only: guide copy, renames, expected counts. Never code logic (Jose, 2026-11-10) |

Delegate when the job would pour a lot of text into the main conversation
(a full test run, sweeping `index.html` for every use of a name). Don't
delegate a one-line `grep` or a single small read: a subagent starts cold
and re-reads context, so for small jobs it costs more than doing it
directly. Check what a helper reports before relying on it; decisions,
design and anything touching data or rules stay with the main model.

## Working agreement

- **Reporting to Jose: status updates extremely concise, fragments fine;
  explanations in full plain sentences** (Jose, 2026-11-10; was "sacrifice
  grammar" for everything). And (Jose, 2026-10-20): **plain words, as to someone new to this** (no git or CI jargon: "a change waiting for your OK", not "a PR with green checks"; say what a word means the first time); **say "working on it" when something is still running**, and **always say "done" when it is finished**, every time, so he never has to ask "still working?".
- **A question with options gets buttons** (Jose, 2026-10-18): ask it
  with `AskUserQuestion`, one button per option (recommended first), not
  as a numbered list in text. Where that tool is missing (a scheduled
  run), list the options plainly.
- **Always say your recommendation** (Jose, 2026-10-19; `AGENTS.md`):
  with options, a next step or a trade-off, name your pick and why, in
  plain words, unasked. If the buttons are refused, list the options in
  plain language with the pick marked.
- **How Jose works with AI tools** (Jose, 2026-10-29; `AGENTS.md`, its
  section of that name): spec with "not in this version" before a new
  feature's code; research similar tools first; challenge his ideas. And the `AGENTS.md` list
  **Not building** (no patient information, ever; not a replacement for the
  hospital's systems; no app-store app).
- **Ambiguous request: one clarifying question first. Evidence before
  confidence** (Jose, 2026-10-17; `AGENTS.md`): nothing stated as true
  without a measurement, test, primary source or the code behind it; say
  what is unproven.
- **Every finished job: a preview, then a phone notification** (Jose,
  2026-10-17; `AGENTS.md`). Screenshots of what changed (before/after,
  phone size first) sent as files with `SendUserFile` (status
  `proactive`), then `PushNotification` with one line saying what's ready
  and what he needs to do. Only when there is something to review or
  decide, never for routine progress.
- **Always a phone notification when it's time to push** (Jose,
  2026-10-24; `AGENTS.md`; he wants this in every project): whenever a
  change is ready for his "push" (GitHub's checks passed), send
  `PushNotification` saying which change and that it needs "push", even
  if he seems to be in the chat. **"Push" is always clickable** (Jose,
  2026-11-03; `AGENTS.md`): ask with `AskUserQuestion`, "Push
  (Recommended)" then "Not yet"; on "Push", merge the pull request
  yourself (`merge_pull_request`, the head SHA pinned), then verify the
  deploy as in Deploying. Never only a link to GitHub's merge button.
- **Always a phone notification when something goes live** (Jose,
  2026-11-03; `AGENTS.md`): once Vercel reports the deploy of the bump
  commit completed (see Deploying), send `PushNotification` naming the
  change and its `BUILD_ID`, even if he seems to be in the chat.
- **Environment settings come ready to paste** (Jose, 2026-11-04;
  `AGENTS.md`): whenever the cloud environment needs something saved
  (a Network access domain, a network secret, an environment variable, a
  setup-script line), give the exact text in its own code block, one per
  field, under the field's name and where it goes. Exactly what to paste
  (no `https://`, no `www` unless the address has it, no quotes); several
  domains one per line in one box. Never only describe it. A secret's
  value (an API key) is the exception: say where to get it and which
  field, never ask for it in the chat; where a block shows it, write
  YOUR_VALUE_HERE (2026-11-10). Example, for Network access then
  Allowed domains:
  ```
  tripo-data.rg1.data.tripo3d.com
  developers.tripo3d.com
  ```
- **Ask, then install what helps** (Jose, 2026-11-04; `AGENTS.md`): normal
  project packages (in `tests/package.json` and the like) install without
  asking, mentioned in the report (2026-11-10). When another program,
  plug-in, connector or anything paid would make the work better,
  ask with `AskUserQuestion`: "Install (Recommended)" (what it is, size,
  what it buys) then "Not now"; on Install, install it and use it. Never
  install those unasked, never quietly work around a missing tool. Installs last
  only for this chat's machine; to keep one, give the setup-script line to
  paste (rule above). Example: Blender's site is blocked here, but it
  installs from PyPI as `bpy` (Blender as a Python module, ~400 MB):
  ```
  pip install bpy
  ```
- Jose works from a phone much of the time. Keep instructions concrete and
  one step at a time; screenshots beat abstract description.
- Every change someone can see ships with its User Guide update (see the
  User Guide paragraph above). Jose asked for this on every change.
- Commit with a real message saying what changed — the first 200 commits were all "Add files via upload"
  and none of them can be read back.
- When a bug survives a fix, ask for a concrete reproduction path
  ("Radiation → Back → Home"). That specificity is what has surfaced root
  causes; general fixes have repeatedly missed.

## Open items

- **The Hub is locked** (Jose, 2026-11-07, 41 phones in): practice mode
  is off, so the rules are enforced and anything that isn't a joined phone
  (or a signed-in account in the team) is refused, with no error on screen.
  A new collection without its rule line simply fails. Checked first: every
  collection the app uses has a rule, every AI call sends the sign-in, the
  events watcher logged in with its key ("login = service account",
  14:42 UTC), the Storage rules published, everyone had joined. Undo:
  Team access, Turn practice mode back on.
- **The events watcher (`api/check-events.js`) has its own login, once the
  key is set.** `api/_service-login.js` signs a JWT with the service account
  in `FIREBASE_SERVICE_ACCOUNT` (Vercel setting, the whole JSON key; role
  Cloud Datastore User), trades it for a one-hour token and sends that with
  every Firestore call, which the lock doesn't apply to. Without the key it
  goes in unsigned, as before (practice mode only); each run's report says
  which ("login"), and a refused key stops the run with the reason. A run
  reported "service account" on 2026-11-07, before the lock. Putting a shared secret
  inside the documents it writes was rejected as a credential leak.
- `index.html` is one 1.4 MB file. The CSS is out (`app.css`, 2026-10-21);
  the data and the JS by feature are next (`docs/split-index.md`).

# General rules (all of Jose's website projects)

These are the same in every project. Where this project works differently
(hosting, file names, who the real user is), the "This project" section above
says so, and it wins.

## Planning and working with me

**Challenge me.** Question my ideas. Don't sugarcoat problems. If a plan is bad, say so and why, then give me a better option. Point out the biggest risk I'm not seeing. Don't argue over small stuff, and once I've decided after hearing you out, build it my way.

**Spec.** Every project has a SPEC.md in the repo root with:
- What it does and who it's for. If the real user isn't me, say who it is and what they need.
- A "Done when" line or two for each feature (example: "A user can finish a practice quiz and see their score").
- A "Not in v1" list of things we're deliberately not building yet.
- A "Later" list for ideas we're saving.

New project with no SPEC.md: help me write it before any code.
Existing project with no SPEC.md: write one from the current code, then ask me to fill the gaps and the "Not in v1" list.
Keep SPEC.md updated when decisions change. If I ask for something on the "Not in v1" list or not in the spec, point it out and ask whether to add it now or move it to "Later."

**Phases.** SPEC.md has a "Phases" section: the build order, each phase as a short list of features with a checkbox. Each phase should fit in one or two sessions. When a phase is done and verified, check it off.

**Cleanup check.** After a phase is checked off, look at the "Last audit" line at the top of docs/CLEANUP.md. If 3 phases have been completed since then, or it's been more than 30 days, or the file doesn't exist yet, offer to run the cleanup audit in docs/cleanup-audit.md, with buttons: "Run it now" (recommended), "Next session," or "Skip this time." If docs/cleanup-audit.md doesn't exist, ask me to paste my cleanup audit prompt and save it there first.

**Architecture doc.** Keep docs/ARCHITECTURE.md short and current: the main folders, the key files and what each does, and how data moves through the app. Read it at the start of a session instead of exploring the code. Update it whenever the structure changes.

**Big vs small.** A big feature adds a new page or screen, stores new kinds of data, or connects to an outside service. Everything else is a small change.

**Research before big features.** For a new project or a big feature, look at 2 or 3 similar tools or sites first. Tell me in a few lines how they do it and where mine can be better. New ideas from research go into "Later" unless I approve them for now. Skip this for small changes.

**Explain it back.** Before coding a new project or big feature, use plan mode. Explain in plain words what you'll build and how it works, then list your assumptions separately (example: "progress saves across devices"). Wait for my OK. If I correct you, update SPEC.md.
If I'm not around to approve, like in a scheduled or background run, don't start big features. Do small changes only and leave me the plan to review.
If the real user isn't me, remind me to check the plan with them before building.

**Show me it works.** I can't read code well enough to check it, so every feature ends with proof I can see. Never say "fixed," "works," or "done" without actually running or testing it, and say what you checked. If you couldn't check it, say "not verified" and why.
- Small changes: a screenshot or a short "try this" list of steps.
- Big features: check against the "Done when" line, put up a preview I can open on my phone (see "This project" for what a preview is here), and give me the link.

**Review before the pull request.** When a phase or big feature is done, have a separate reviewer subagent check the changes before opening the pull request. It looks for bugs, broken behavior, and anything that doesn't match SPEC.md, without seeing how the code was written. Fix what it finds, then tell me in two or three lines what it caught.

**Status updates.** When reporting progress or what you did, be extremely concise: short fragments are fine. This is for updates only; explanations stay in plain, full sentences.

**Help me learn.** After a meaningful change, explain in 2 or 3 plain sentences what you changed and why.

**Ask before anything risky.** Explain it and get my OK before you:
- Delete data or files I may need.
- Change how logins or accounts work.
- Push to the main branch.
- Deploy to the live site.
- Do anything that costs money.

## Usage

**Keep the session light.** Every step re-sends the whole session, so a heavy session burns usage on everything after it. Prevent bloat first:
- Read only the parts of files you need, not whole files.
- Don't paste full logs or test output. Show me only the lines that matter.
- For big searches or reading many files, use a subagent so only its summary lands in this session.

**Helpers.** Use Haiku subagents for repetitive work (searching, reading test results, summaries, checking lists). Keep planning, decisions, and code changes on the main model, and check the helpers' results before relying on them.

**When to start a new session.** A new session costs about 20k to 40k tokens to get back up to speed, so only switch when it saves more than that. Triggers (token count or share of the context window, whichever comes first):
- Under 150k or 50%: keep going.
- 150k to 300k or 50% to 75%: finish the current step, then hand off.
- Over 300k or 75%: hand off now, even mid-task.
- Next task is unrelated and the session is over 100k: hand off.
- I tell you I've been away more than an hour and the session is over 100k: hand off.

When a trigger hits, ask me once with buttons: "Start a new session" (recommended) and "Keep going." If I say keep going, don't ask again until the next trigger.
Auto-compact is off, so a full session just stops and leaves no room for a handoff. If I say keep going past 75%, warn me once, and write HANDOFF.md anyway so it's ready.

**Handoffs.** Write HANDOFF.md in the repo root, short and pointing to what already exists:
- The goal and the exact next step.
- What's done (point to commits) and what's left.
- Decisions made this session that aren't in SPEC.md yet. Add them to SPEC.md too.
- Files I'll need to look at first.

Overwrite it each time. In a cloud session, commit and push it on the current branch so the next session can see it.
At the start of a session, if HANDOFF.md exists, read it first and confirm the next step with me.
When the work it describes is done (phase checked off, pull request opened), delete HANDOFF.md so the next session doesn't follow stale instructions.

**Effort.** Don't use ultracode or max effort unless I ask.

**Keep CLAUDE.md lean.** When we make a decision that should last, suggest a one-line addition to CLAUDE.md. Remove lines that no longer apply. Keep it short, since it loads every session.

## Environment and installs

**Saving settings.** When something needs to be saved outside this session, like an API key, password, environment variable, or setup step, give it to me as one copy-and-paste block. Tell me in one line exactly where to paste it. Use the format that place expects. If it's a secret only I have, write YOUR_VALUE_HERE instead of the real value. Never put secrets in code files or commit them to the repo.

**Installing tools.** Ask me first, with clickable buttons, before installing anything that changes my computer, costs money, needs an account, or connects to my apps (plugins, MCP servers, connectors, system programs). Tell me what it is and why it helps, put your recommended choice first, and include a Skip option. If I say yes, install it yourself and check that it works. Don't ask about things already installed. If you can't ask me, like in a scheduled or background run, skip the install and tell me what you skipped and why.

**Project packages.** Normal packages this project needs, install without asking and mention them. Always add them to the project's package list (package.json, requirements.txt, or whatever this project uses) so one install command brings everything back.

**Making installs stick.** Cloud sessions erase installs when they end. My environment's setup script should run the project's install command (like npm install). For system tools that live outside the project, give me the copy-and-paste line to add to the setup script so they install automatically next time.

## Git and GitHub

**Branches.** Never commit directly to main. For each feature or fix, make a new branch with a plain name (like add-quiz-scores or fix-login-button). Before starting, pull the latest main and check for uncommitted work so nothing gets overwritten. (A cloud session that was handed a branch name uses that branch.)

**Commits.** Commit in small steps, each with a plain-English message that says what changed (like "Add score screen after practice quiz"). Never commit secrets, API keys, or .env files. Make sure they're in .gitignore.

**Pushing.** Pushing a feature branch is fine without asking (previews need it, where the project has them).
Getting work into main always needs my OK:
1. Open a pull request with a short plain summary, the "Done when" check from SPEC.md, and the preview link (or the screenshots, where the project has no previews).
2. Send me a phone notification saying which change it is and that it needs my "push." If you can't send a notification, put that at the very top of your message instead.
3. Wait for my OK before merging.

**Never without asking:**
- Force push.
- Delete branches that have work not yet in main.
- Rewrite or reset history (git reset --hard, rebase on main, and similar).
- Change repo settings, like making a repo public.

If I ask you to do one of these, explain what it will do and what can't be undone first.

**Big files.** GitHub rejects files over 100 MB. If an asset is that big, warn me before committing and suggest compressing it or using Git LFS.

**Undo.** When you merge something, tell me in one line how to undo it if it breaks the live site.

## Assets

Before any asset work (3D models, textures, icons, fonts, images, sounds, templates), read docs/assets.md and follow it. If docs/assets.md doesn't exist yet, stop and ask me to paste my asset rules, then create it before starting.

## Design

Before building or changing any page or UI, read docs/design-rules.md and DESIGN.md and follow them. If docs/design-rules.md doesn't exist yet, stop and ask me to paste my design rules, then create it before starting.
