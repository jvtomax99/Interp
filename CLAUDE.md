# CLAUDE.md — HUMC Interpreter Hub

Read this before changing anything. It is the source of truth for how this
project is built and shipped.

**How work is run:** one pull request = one phase from `docs/PLAN.md` (plan,
do, test, update the plan, open a pull request). A chat runs phase after
phase in a row; when it gets extremely heavy, it writes `docs/handoff.md`
and hands it to Jose to start a new chat (Jose, 2026-10-20, replacing "never
ask"). It offers to start that chat itself, with the handoff and a summary
of this chat pasted in (Jose, 2026-10-23), offered as clickable buttons
(`AskUserQuestion`), "I start it for you" first as the pick, never only
as text to paste (Jose, 2026-10-25). **After every finished job** (each
time a reply says "done"), the reply ends with the same clickable buttons,
"Start a new chat for me" first and "Keep going here" second, over a short
summary of what is being worked on (Jose, 2026-10-25); a new chat is made
only when he picks it, with the handoff written first. Whenever a chat starts a new
chat for Jose, it gives him a fresh summary in plain words, in two parts:
**what is being worked on now** (and its goal) and **what was worked on
before** (the last chat's changes and where each stands). It says it in
the reply that gives the new chat's link, and the new chat opens with the
same two parts (Jose, 2026-10-24). Keep both short: a few lines each,
simple words, no big blocks of text (Jose, 2026-10-24). The new chat's title names its focus
in plain words, the work it is for ("Campus code to its own file"), never
a generic "New session" or "Handoff" (Jose, 2026-10-24). A new chat reads the docs and the
handoff, not the old chat. Details: `docs/PLAN.md`.
When a chat is done, say "Archive this chat" (Jose, 2026-10-18; when,
in `docs/PLAN.md`).

## What this is

A Spanish/English medical-interpreting tool for the interpreter team at
Hackensack University Medical Center (HUMC / Hackensack Meridian Health).
Installable PWA, used mostly on phones, in a hospital, often one-handed
between assignments.

- **Live:** https://interp-six.vercel.app
- **Repo:** `jvtomax99/Interp`
- **Owner:** Jose Vazquez — staff medical interpreter, beginner web developer.
  He directs the product; Claude writes, tests and debugs all the code.

## File map

| File | Lines | What |
|---|---|---|
| `index.html` | 22,252 | The whole app's markup and JS (1.3 MB), all inline |
| `app.css` | 7,325 | The app's stylesheet (467 KB), linked from `<head>`; was the inline `<style>` until 2026-10-21 (`docs/split-index.md`, phase 1) |
| `home-polish.css` | 1,456 | Overlay layer. Linked right after `app.css`, so it wins |
| `home-polish.js` | 1,972 | Home behaviour: hello wave, rail dots, section overlay, Dr. Smiley |
| `pin-icons.js` | 987 | Pin/icon wiring: which pin each domain and tool gets |
| `pins/*.webp` | 41 files | One pre-cut 192 px pin each, named by key (`pins/oncology.webp`) |
| `pin-icons-sheet.webp` | — | The 8 × 8 sprite sheet behind `.pin-sprite` (1024², 381 KB) |
| `drsmiley/*.webp` | 7 files | Dr. Smiley: `base` (his calm head and shoulders, forehead without brows), `face` (a strip of 30 frames of his eyes and mouth, cut from Jose's drawn expression sheets and fitted onto that same face; the last four, surprised, sad, worried and doubt, from `docs/art/dr-smiley-faces/`), `brow-l`/`brow-r` (his brows, moving on their own: `DR_BROWS`), `hat-cap`/`hat-mirror`/`hat-grad` (rank outfits). See `drSmileyArt()`, the animation engine (`DrAnim`, `drAnim()`, and the older names `drFacePlay()`/`drFaceIdle()`/`drFaceTalk()` now built on it) and `smileyAccessory()` in `index.html`. On Home, `home-polish.js` draws his lanyard as live cords over him |
| `city/*.webp` | 102 files | Your HUMC campus on CoreCHI Practice: the main entrance at golden hour as three depth layers (`sky`, `far`, `near`, slid for parallax) + each building's lit windows in tenths (pre-rendered 3D; `renderCampus` in `features/campus.js`, `docs/mockups/cchi-city/`) |
| `media/` | — | The 45-second video (`hub-promo.mp4`, 720p; the 3D remake from `promo/hub-blend/` since 2026-10-23) and its still; shown in the User Guide (`promo`) and by Home's Watch button. Never cached by `sw.js` |
| `promo/` | — | Remotion (videos written as React code): `npm install`, then `npm run studio` to preview or `npm run render`. Own `package.json`, kept out of the deploy (`.vercelignore`). Only a starter title card so far; the current `media/hub-promo.mp4` was not made here. `promo/README.md` |
| `promo/hub-blend/` | — | Source of the 3D promo remake (HyperFrames + Three.js); plan in its `BRIEF.md`. Not deployed (`.vercelignore`); only a rendered MP4 goes into `media/` |
| `guide/topics.js` | 503 | The User Guide's answers, `GUIDE_SECTIONS` and `GUIDE_TOPICS` (plain data; was in `index.html` until 2026-10-21). Loaded by a `<script src>` just before `index.html`'s script; precached, network-first |
| `practice/questions.js` | 348 | The CoreCHI practice bank, `CCHI_DOMAINS` and `SEED_QUESTIONS` (100 questions; plain data, was in `index.html` until 2026-10-21). Loaded like `guide/topics.js` |
| `falsefriends/list.js` | 846 | The False Friends list, `FALSE_FRIENDS` (101 entries; plain data, was in `index.html` until 2026-10-22). Loaded like `guide/topics.js` |
| `features/translate.js` | 276 | The Translate tool's code, moved verbatim out of `index.html` (2026-10-22, phase 3 of the split). Declarations only; loaded just before `index.html`'s script |
| `features/3d-body.js` | 191 | The 3D Body's Hub side: `anatomySync`, the `ATLAS` frame bridge (`atlasOnMessage`, `atlasAction`), the cards. Moved verbatim (2026-10-22); `docs/features/3d-body.md` |
| `features/term-lookup.js` | 263 | Looking a term up: `openTermLookup`, the trusted-source search (`/api/term-lookup`) and its memory + Firestore caches. Moved verbatim (2026-10-23) |
| `features/voice-check.js` | 251 | The Voice and mic check at the bottom of More (`voiceCheckOpen`, and `audioMode`, which the memory trainer calls too). Moved verbatim (2026-10-23) |
| `features/smiley-performances.js` | 288 | Dr. Smiley's five performances (`DR_PERF`, `drPerfBuild`, `drPerfSeed`), his squash (`drSquashKeys`), mood (`drSetMood`) and the effects off his head (`drFaceFx`). Moved verbatim (2026-10-24) except one line that stays in `index.html`: the one putting them into `DR_FACE_SEQ` |
| `features/campus.js` | 157 | Your HUMC campus on CoreCHI Practice: `CAMPUS_MAP`, `CAMPUS`, `renderCampus`, the building pick (`campusPick`, `campusGo`) and its Escape key. Moved verbatim (2026-10-24). Its motion (`campusLife`, `campusDepth`) stays in `index.html`, section "Practice dashboard motion" |
| `features/false-friends.js` | 227 | The False Friends screen: `renderFalseFriends`, Study and Drill (`buildFFDrill`, `answerFF`), search and the risk filter (`FF_RISKS`). Moved verbatim (2026-10-24); the list is `falsefriends/list.js`. The Practice code that followed it in the same section (`renderPractice`, `startStudy`, the exam timer) stays in `index.html`, now under its own banner |
| `features/knowledge-brain.js` | 223 | Your knowledge brain, the Hub's side: `knowledgeBrainData` (what `brain/you.html` draws), your record and the daily count (`kbLogNote`, `ih_knowledgeLog`), the small live brain atop Term Review (`kbMiniHtml`, `kbMiniStart`, `kbMiniFrame`). Moved verbatim (2026-10-24); `docs/features/knowledge-brain.md` |
| `features/guide-front.js` | 232 | The User Guide's front page: `renderUserGuide`, the home of answers (`guideHomeHtml`, New lately), its sections, search (`setupGuideSearch`, `guideMarkWords`) and the install steps (`GUIDE_INSTALL_STEPS`). Moved verbatim (2026-10-24); the answers are `guide/topics.js`, the sheets and Show me stay in `index.html` |
| `features/doctor-sheets.js` | 317 | The doctor and provider sheets' "Where" (the place picker: `openPlacePicker`, `pickPlace`, adding a place) and the doctor directory's add and edit sheet (`openAddDoctorDirModal`, `openEditDoctorDirModal`, the photo, `saveDoctorDirEntry`, delete). Moved verbatim (2026-10-25); `docs/features/places.md`. Places' data and `savePlace` stay in `index.html` ("Places (shared)") |
| `features/csv.js` | 166 | The glossary's CSV export and import (More's Export / Import): `exportTermsCsv`, `parseCsv`, the staged import (`handleCsvImportSelected`, `showImportPreview`, `confirmCsvImport`). Moved verbatim (2026-10-25) |
| `features/duplicate-doctors.js` | 161 | Duplicate doctors: the likely pairs (`nameParts`, `looksLikeSamePerson`, `duplicateDoctorGroups`), the merge (`mergeDoctorRecords`, `mergeDuplicateDoctors`) and its card in the doctor list's tidy sheet (`duplicateBannerHtml`). Moved verbatim (2026-10-25) |
| `features/backfill.js` | 154 | The terminology backfill: doctors whose research is still the old flat list (`doctorsNeedingTiers`) re-researched one at a time (`runTierBackfill`, `cancelTierBackfill`, `tierBackfill`) and its card in the doctor list's tidy sheet (`backfillBannerHtml`). Moved verbatim (2026-10-25) |
| `features/ask-hub.js` | 2,040 | Ask the Hub with Dr. Smiley's side of it: retrieval and the answer (`askRetrieve`, `submitAsk`, `askTurnHtml`, `askLayout`), following a conversation (`ASK.convo`), context and actions (`askContext`, `ASK_ACTION_TYPES`, `ASK_RUN`), what he remembers (`drMemGet`, `ih_smileyMemory`), the memory screen (`openMemory`), your practice and the next step, corrections, feedback, sources and the owner's team notes review (`renderAskReview`). Moved verbatim (2026-10-25), 7 sections at once; a few lines stay in `index.html` where the group began (`ASK_STOP`, the waiting questions brought back, the `online`/`resize` listeners, `window.openAskHub`): they run at load and need `index.html`'s names. `docs/features/ask-the-hub.md` |
| `memory/lines.json` | — | The memory trainer's 60 practice lines in meaning chunks (`renderMemTrainer`; `docs/features/memory-trainer.md`). Precached by `sw.js` |
| `sw.js` | 220 | Service worker. Shows pushes from the server (`push`, the icon badge). Network-first for HTML and for the app code beside it (`app.css`, `home-polish.js`/`.css`, `pin-icons.js`; the saved copy offline or after 3 s, so a deploy's page and Home code arrive together), stale-while-revalidate for the rest |
| `manifest.webmanifest` | — | PWA manifest |
| `vercel.json` | — | Cron: `/api/check-events` daily at 13:00 UTC; the walled-off headers for `atlas/`; no deployments for `claude/` branches (storage) |
| `atlas/` | 34 MB | 3D Body: a built copy of Human Atlas (MIT; anatomy data BodyParts3D, CC BY 4.0). Outside code, run in a sandboxed frame by `anatomySync()` in `index.html`. Origin, licences, the wall and how to rebuild: `atlas/README.md`. `atlas/hub-catalogue.json`: the bilingual card text (30 structures, sourced) |
| `brain/` | — | Two separate brains, sharing vendored Three.js r128. `index.html`: HUMC Brain, the app's code drawn as a 3D brain (data `data.json` from `tests/tools/brain-data.cjs`), opened by a double-tap on Dr. Smiley's head. `you.html`: your knowledge brain, glossary terms lit by your own Term Review record (data from `knowledgeBrainData` in `features/knowledge-brain.js` by message), opened from the small live brain atop Term Review or the CoreCHI Practice tile. Both through `openHumcBrain` in `home-polish.js`. `docs/features/humc-brain.md`, `knowledge-brain.md` |
| `api/translate.js` | 145 | Translate tool — Claude API |
| `api/doctor-research.js` | 403 | Doctor Prep — Claude API + web search |
| `api/check-events.js` | 276 | Cron job watching CE/training events (CHIA feed; CCHI, NCIHC pages; CCC off, its site answers 403) |
| `api/term-lookup.js` | 307 | Term reference lookup — Claude API + web search |
| `api/term-check.js` | 185 | Checks a glossary entry before it is saved — Haiku 5.5 first (`_routine.js`), then its backup model |
| `api/_hub-access.js` | — | Members-only check shared by the AI endpoints (not an endpoint itself) |
| `api/_service-login.js` | — | The events watcher's own Firestore login: a service account key from Vercel's settings, no SDK (not an endpoint itself) |
| `tests/` | — | The checks: suites, harness, stand-ins; run on GitHub on every push (`.github/workflows/tests.yml`). Kept out of the deploy by `.vercelignore` |
| `api/_routine.js` | — | The one Claude helper: every request to the Messages API (`callClaude`: the retries, the refusal check, `parseAnswer`, `clip`), and Haiku 5.5 first then the backup model for Translate and the term check (`callRoutine`). Not an endpoint itself |
| `api/ask.js` | 508 | Ask the Hub — answers from the entries the app sends, plus approved team notes |
| `api/push.js` | — | Notifications that reach a closed phone (Web Push): Team Chat, owners' sends, a test; the key phones sign up with. `_push-team.js` (who gets what, gone phones) and `_webpush.js` (encryption + VAPID signing, Node crypto) beside it. `docs/features/notifications.md` |
| `firestore.rules`, `storage.rules` | 213 / 33 | Firebase rules, applied by hand in the console |
| `hero.jpg`, `hmh-*.png`, `icon-*.png` | — | Image assets |
| `medical-pins.png.PNG`, `specialty-pins.png.PNG`, `pin-icons-source-hd-upload.png` | — | Jose's original sheets. Not loaded by the app any more and not deployed (`.vercelignore`); the files above were cut from them |

Line counts are `wc -l` on 2026-10-20. They drift with every PR; the names
and roles don't. Re-measure before quoting one.

Inside `index.html`, sections are marked with banner comments
(`/* ---------- Team Chat ---------- */`). Use them to navigate — do not read
the whole file when you only need one section.

## Where to make a change

**`AGENTS.md` at the repo root is the shared contract, and it wins over this
file where they overlap.** ChatGPT/Codex reads it automatically; this file is
Claude's longer version. Change `AGENTS.md` first when a rule changes here,
or the two tools drift apart again.

**Fetch `main` before writing and again before pushing.** ChatGPT pushes
directly to `main` under Jose's name, so `main` moves between sessions with
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
| Your knowledge brain, the Hub's side (its data, the small brain on Term Review) | `features/knowledge-brain.js` |
| Translate tool code | `features/translate.js` |
| 3D Body's Hub side (the frame bridge) | `features/3d-body.js` |
| Looking a term up | `features/term-lookup.js` |
| Voice and mic check | `features/voice-check.js` |
| Dr. Smiley's performances | `features/smiley-performances.js` |
| Your HUMC campus (the scene and the building pick) | `features/campus.js` |
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

Vercel auto-deploys on push to the default branch. There is no build step.

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
push-subs/{id}  push-sent/{msgId}  push-log/{id}                     <-- Notifications (notifications.md)
```

**Feature notes live in `docs/features/`.** Read the one for the feature you
touch before changing it; update it in the same commit when the behaviour changes.

- Ask the Hub, retrieval, `context`, his actions (`ACTION_TYPES`; new action types go in both lists): `ask-the-hub.md`
- What he remembers on the phone (`ih_smileyMemory`) and follow-ups (`ASK.convo`): `ask-memory-followups.md`
- The companion panel from the dock (`drPanel`): `companion-panel.md`
- How an answer is drawn (`askTurnHtml`, `askLayout`): `ask-answer-layout.md`
- Term Review sessions (`reviewBuild`, `reviewCheck`, `saveTermReview`): `term-review.md`
- The Daily Drill, Home's warm-up (`openWarmupSheet`, `ih_warmup`): `daily-drill.md`
- Integration rules from the journey audit (each has a check in the journey test): `journey-rules.md`
- 3D Body cards and the frame bridge (`ATLAS`, `atlasOnMessage`): `3d-body.md`
- The User Guide screen (`GUIDE_TOPICS`, `guideShowMe`): `user-guide.md`
- Team access, team code, practice mode (`hub-invites`, `hub-members`, `team()`): `team-access.md`
- Regions, North and South: chat channels, directory by region, `ih_region`, `HMH_LOCATIONS` regions: `regions.md`
- The doctor's page (`renderDoctorDirDetail`, `SPECIALTY_PINS`, tabs, glass bar): `doctor-page.md`
- Places and their shared icons, the doctor sheet's "Where" (`PLACES`, `savePlace`, `openPlacePicker`, `terminology-meta/places`): `places.md`
- Dr. Smiley's movement: controller, entrance, size, performances, task states (`DrAnim`, `DR_PERF`, `drTask`): `dr-smiley.md`
- Notifications that reach a closed phone, the Notifications screen, owners' Send to the team (`pushTurnOn`, `pushSync`, `api/push.js`, `sw.js` push): `notifications.md`
- The smoothness meter at the bottom of More (`frameMeterStart`, `ih_frameMeter`): `frame-meter.md`
- The memory trainer (consecutive practice) and its Voice and mic check in More (`voiceCheckOpen`): `memory-trainer.md`
- CoreCHI Practice dashboard: score trend, Focus next, its motion (`renderScoreTrend`, `playPracticeMotion`): `practice-dashboard.md`
- HUMC Brain, the double-tap on Dr. Smiley's head, its data and what's real in it (`openHumcBrain`, `brain/`): `humc-brain.md`
- Your knowledge brain, its small live copy atop Term Review (`kbMiniHtml`), the CoreCHI Practice tile, your record and the daily count (`knowledgeBrainData`, `ih_knowledgeLog`, `brain/you.html`): `knowledge-brain.md`

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
  as headings, then its own General terms; All domains lists every domain the
  same way. A search or a Slang filter opens whichever sections have matches.
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
15, headline 17, title3 20, title2 22, title1 28 (`--fs-*`). Spacing
6/9/13/17/26 (`--sp-*`). Icons: rows and tab bar 24, list rows 28, tiles and
cards 32, banner 44 (`--ic-*`). Tracking tightens as size grows; prefer the
weights 550 and 650. IBM Plex Serif is reserved for quoted human speech (Ask
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
is not. The type and spacing tokens above exist (`--fs-*`: 7, `--sp-*`: 5)
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
| `builder` | Sonnet 5.5 | Exactly specified mechanical edits: guide copy, renames, expected counts |

Delegate when the job would pour a lot of text into the main conversation
(a full test run, sweeping `index.html` for every use of a name). Don't
delegate a one-line `grep` or a single small read: a subagent starts cold
and re-reads context, so for small jobs it costs more than doing it
directly. Check what a helper reports before relying on it; decisions,
design and anything touching data or rules stay with the main model.

## Working agreement

- **Reporting to Jose: extremely concise. Sacrifice grammar for concision.**
  (His standing rule.) And (Jose, 2026-10-20): **plain words, as to someone new to this** (no git or CI jargon: "a change waiting for your OK", not "a PR with green checks"; say what a word means the first time); **say "working on it" when something is still running**, and **always say "done" when it is finished**, every time, so he never has to ask "still working?".
- **A question with options gets buttons** (Jose, 2026-10-18): ask it
  with `AskUserQuestion`, one button per option (recommended first), not
  as a numbered list in text. Where that tool is missing (a scheduled
  run), list the options plainly.
- **Always say your recommendation** (Jose, 2026-10-19; `AGENTS.md`):
  with options, a next step or a trade-off, name your pick and why, in
  plain words, unasked. If the buttons are refused, list the options in
  plain language with the pick marked.
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
  if he seems to be in the chat.
- Jose works from a phone much of the time. Keep instructions concrete and
  one step at a time; screenshots beat abstract description.
- Every change someone can see ships with its User Guide update (see the
  User Guide paragraph above). Jose asked for this on every change.
- Scope each session to one feature or one bug. Commit with a real message
  saying what changed — the first 200 commits were all "Add files via upload"
  and none of them can be read back.
- When a bug survives a fix, ask for a concrete reproduction path
  ("Radiation → Back → Home"). That specificity is what has surfaced root
  causes; general fixes have repeatedly missed.

## Open items

- **Team access is built but only enforced once Jose locks it.** Until
  practice mode is off, the rules behave as they used to (open).
- **The events watcher (`api/check-events.js`) has its own login, once the
  key is set.** `api/_service-login.js` signs a JWT with the service account
  in `FIREBASE_SERVICE_ACCOUNT` (Vercel setting, the whole JSON key; role
  Cloud Datastore User), trades it for a one-hour token and sends that with
  every Firestore call, which the lock doesn't apply to. Without the key it
  goes in unsigned, as before (practice mode only); each run's report says
  which ("login"), and a refused key stops the run with the reason. Lock the
  Hub only after a run reports "service account". Putting a shared secret
  inside the documents it writes was rejected as a credential leak.
- `index.html` is one 1.4 MB file. The CSS is out (`app.css`, 2026-10-21);
  the data and the JS by feature are next (`docs/split-index.md`).
