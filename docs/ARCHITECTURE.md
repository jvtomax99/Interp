# Architecture: HUMC Interpreter Hub

Short map, written 2026-11-10. For every file's full role, see the File map
in `CLAUDE.md`; feature detail is in `docs/features/`. Read this first
instead of exploring the code.

## Shape

A static web app (PWA) with no build step, served by Vercel, plus a few
serverless functions in `api/`. Data lives in Firebase (Firestore and
Storage, project `language-specialist`). AI answers come from the Claude
API, called only from `api/`, never from the phone.

## Main folders and key files

| Path | Role |
|---|---|
| `index.html` | The app's markup and most of its JS (18,407 lines on 2026-11-10), split into sections by banner comments |
| `app.css` | Styles for every screen but Home |
| `home-polish.css`, `home-polish.js` | Home's look and behaviour, loaded after `app.css` so they win |
| `pin-icons.js`, `pins/` | Which pin each domain and tool gets; one pre-cut `.webp` per pin |
| `features/` | 22 feature files moved out of `index.html` (Ask the Hub, Translate, campus, account, opening and more) |
| `guide/`, `practice/`, `falsefriends/`, `soundalikes/`, `memory/` | Plain data: User Guide answers, CoreCHI questions, word lists, memory lines |
| `api/` | 14 files: the endpoints (`translate`, `term-lookup`, `term-check`, `doctor-research`, `ask`, `push`, `sign-in`, `check-events`) and shared helpers (names starting with `_`) |
| `sw.js` | Service worker: offline copy, update rules, push notifications |
| `atlas/`, `brain/`, `campus3d/` | Separate pages run in frames: 3D Body, the two brains, the 3D campus |
| `city/`, `drsmiley/`, `opening/`, `figures/`, `media/` | Pictures, clips and the promo video |
| `tests/` | The checks (`node run.cjs` inside `tests/`), run on GitHub on every push |
| `docs/` | `PLAN.md` (phases), `features/` (one note per feature), mockups, art |
| `firestore.rules`, `storage.rules` | Firebase rules, published by hand in the console |
| `vercel.json` | Deploy rule, the daily cron, the walled-off headers for `atlas/` |

## Load order

`index.html` links `app.css` then `home-polish.css`, loads `home-polish.js`
in `<head>`, then the data files and the 22 `features/*.js` files with plain
`<script src>` tags, then its own inline script, then `pin-icons.js` just
before `</body>`. The Firebase SDK (compat 10.12.2 from gstatic) loads in
the background (`firebaseReady`); `db`, `storage` and `hubAuth` are `null`
until it arrives.

## How data moves

1. **First paint from the phone.** The app draws from `localStorage` caches
   (`ih_glossary_cache_v1` for terms, `ih_doctorDirectory` for doctors) before
   Firebase is ready. Settings and personal state are `ih_*` keys.
2. **Firestore, the shared truth.** One document per term in `terms/`.
   Other collections: team chat, doctors, reviews, practice, events, team
   access, accounts, push subscriptions. Full list: "Data model" in
   `CLAUDE.md`. The Hub is locked: only joined phones or signed-in team
   accounts pass the rules.
3. **AI through `api/`.** The phone sends its team sign-in to an endpoint;
   `_hub-access.js` checks membership; `_routine.js` calls the Claude
   Messages API (with web search for doctor research and term lookup).
   Results come back as JSON; some are cached in Firestore.
4. **Server jobs.** `check-events.js` runs daily at 13:00 UTC (Vercel cron)
   and writes CE events with its own service account login.
   `sign-in.js` emails a 6-digit code through Gmail and returns a Firebase
   sign-in ticket. `push.js` sends Web Push to closed phones.
5. **Account sync.** A signed-in user's practice, streak, badges and
   settings are kept in `account-sync/{uid}` and joined between phones.
6. **Service worker.** Network-first for the page and the app code, with
   1 s for the page (`PAGE_WAIT`) before the saved copy opens; a newer
   version reloads only when the app is in the background.
   Stale-while-revalidate for everything else. `CACHE_VERSION` names the
   saved copy.

## Deploy

1. A change merges into `main`.
2. GitHub Action `bump-version.yml` runs `.github/bump-version.cjs` and
   pushes "Bump version to bMMDD.HHMM", moving `BUILD_ID` (`index.html`)
   and `CACHE_VERSION` (`sw.js`). Pushes that change only docs, tests,
   `.github/`, `.claude/`, promo, `*.md` or the Firebase rules get no bump.
3. Vercel deploys only that bump commit (`ignoreCommand`); `claude/**`
   branches never deploy. `BUILD_ID` is how to tell what is live.

## Full file map

Moved here from CLAUDE.md on 2026-11-10. `index.html` measured 18,407 lines that day; the other counts are older. Re-measure before quoting one.

| File | Lines | What |
|---|---|---|
| `index.html` | 22,252 | The whole app's markup and JS (1.3 MB), all inline |
| `app.css` | 7,325 | The app's stylesheet (467 KB), linked from `<head>`; was the inline `<style>` until 2026-10-21 (`docs/split-index.md`, phase 1) |
| `home-polish.css` | 1,456 | Overlay layer. Linked right after `app.css`, so it wins |
| `home-polish.js` | 1,972 | Home behaviour: hello wave, rail dots, section overlay, Dr. Smiley |
| `pin-icons.js` | 987 | Pin/icon wiring: which pin each domain and tool gets |
| `pins/*.webp` | 41 files | One pre-cut 192 px pin each, named by key (`pins/oncology.webp`) |
| `pin-icons-sheet.webp` | — | The 8 × 8 sprite sheet behind `.pin-sprite` (1024², 381 KB) |
| `drsmiley/*.webp` | 7 files | Dr. Smiley: `base` (his calm head and shoulders, forehead without brows), `face` (a strip of 30 frames of his eyes and mouth, cut from Jose's drawn expression sheets and fitted onto that same face; the last four, surprised, sad, worried and doubt, from `docs/art/dr-smiley-faces/`), `brow-l`/`brow-r` (his brows, moving on their own: `DR_BROWS`), `hat-cap`/`hat-mirror`/`hat-grad` (rank outfits). See `drSmileyArt()`, the animation engine (`DrAnim`, `drAnim()`, and the older names `drFacePlay()`/`drFaceIdle()`/`drFaceTalk()` now built on it) and `smileyAccessory()` in `features/smiley-engine.js` (moved out of `index.html` 2026-10-25). On Home, `home-polish.js` draws his lanyard as live cords over him |
| `city/*.webp` | ~130 files | Your HUMC campus on CoreCHI Practice: the real campus (every building from the OpenStreetMap export) as a toy model in daylight, rendered in Blender from the card's camera: `sky` backdrop, `far` the board's shadow, `near` the board with the five domain buildings in white clay, each one's paint and lit windows in tenths, every moving thing's frames (`renderCampus` in `features/campus.js`; made by `docs/mockups/cchi-city/real-map/card_*.{cjs,py}`, its README) |
| `campus3d/` | — | Your campus in 3D, full screen (the **3D** button on the CoreCHI Practice card; `openCampus3d` in `features/campus.js`): `index.html` is built by `python3 docs/mockups/cchi-city/real-map/build.py --app` (the real-map campus, the same scene as `city/` since 2026-10-29; it runs `live/gen.py --app` first; never edit it by hand), `three/` is three.js 0.160 (MIT, its `LICENSE` beside it). Loaded only when opened; your progress arrives by message |
| `media/` | — | The 1-minute video (`hub-promo.mp4`, 720p, 54.5 s; the 60 s cut from `promo/hub-blend/` played 10% faster, since 2026-10-26) and its still; shown in the User Guide (`promo`) and by Home's Watch button. Never cached by `sw.js` |
| `promo/` | — | Remotion (videos written as React code): `npm install`, then `npm run studio` to preview or `npm run render`. Own `package.json`, kept out of the deploy (`.vercelignore`). Only a starter title card so far; the current `media/hub-promo.mp4` was not made here. `promo/README.md` |
| `promo/hub-blend/` | — | Source of the 3D promo remake (HyperFrames + Three.js); plan in its `BRIEF.md`. Not deployed (`.vercelignore`); only a rendered MP4 goes into `media/` |
| `promo/whats-new/` | — | A 15-second "What's new" video (HyperFrames, the starter kit's Liquid Glass look): the User Guide's three New lately cards, for Team Chat. Not deployed; `promo/whats-new/README.md` |
| `guide/topics.js` | 503 | The User Guide's answers, `GUIDE_SECTIONS` and `GUIDE_TOPICS` (plain data; was in `index.html` until 2026-10-21). Loaded by a `<script src>` just before `index.html`'s script; precached, network-first |
| `practice/questions.js` | 348 | The CoreCHI practice bank, `CCHI_DOMAINS` and `SEED_QUESTIONS` (100 questions; plain data, was in `index.html` until 2026-10-21). Loaded like `guide/topics.js` |
| `falsefriends/list.js` | 846 | The False Friends list, `FALSE_FRIENDS` (101 entries; plain data, was in `index.html` until 2026-10-22). Loaded like `guide/topics.js` |
| `features/translate.js` | 276 | The Translate tool's code, moved verbatim out of `index.html` (2026-10-22, phase 3 of the split). Declarations only; loaded just before `index.html`'s script |
| `features/3d-body.js` | 191 | The 3D Body's Hub side: `anatomySync`, the `ATLAS` frame bridge (`atlasOnMessage`, `atlasAction`), the cards. Moved verbatim (2026-10-22); `docs/features/3d-body.md` |
| `features/term-lookup.js` | 263 | Looking a term up: `openTermLookup`, the trusted-source search (`/api/term-lookup`) and its memory + Firestore caches. Moved verbatim (2026-10-23) |
| `features/voice-check.js` | 251 | The Voice and mic check at the bottom of More (`voiceCheckOpen`, and `audioMode`, which the memory trainer calls too). Moved verbatim (2026-10-23) |
| `features/smiley-performances.js` | 288 | Dr. Smiley's five performances (`DR_PERF`, `drPerfBuild`, `drPerfSeed`), his squash (`drSquashKeys`), mood (`drSetMood`) and the effects off his head (`drFaceFx`). Moved verbatim (2026-10-24); the line putting them into `DR_FACE_SEQ` is in `features/smiley-engine.js`, which loads after it |
| `features/smiley-engine.js` | 1,135 | Dr. Smiley's engine: his art (`drSmileyArt`, `DR_FACE_SEQ`, `smileyAccessory`), the animation engine (`DrAnim`, `drAnim`, `drFacePlay`/`drFaceIdle`/`drFaceTalk`), how lively (`drMode`, `drStill`, `setSmileyMode`) and his task states (`drTask`, `drMind`, `drPerform`). Moved verbatim (2026-10-25), 4 sections; loads after `features/smiley-performances.js` (it reads `DR_PERF` at load). Three listeners stay in `index.html` (`drReduce`'s change, `offline`, `online`): they reach `index.html`'s names. `docs/features/dr-smiley.md` |
| `features/campus.js` | 157 | Your HUMC campus on CoreCHI Practice: `CAMPUS_MAP`, `CAMPUS`, `renderCampus`, the building pick (`campusPick`, `campusGo`) and its Escape key, tap a person for a word (`campusFolkGroups`, `campusFolkTap`, `campusFolkAnswer`; `docs/features/campus-tap-person.md`, 2026-11-05) and the streak's weather (`CAMPUS_SKY`; `docs/features/campus-weather.md`). Moved verbatim (2026-10-24). Its motion (`campusLife`, `campusDepth`) stays in `index.html`, section "Practice dashboard motion" |
| `features/false-friends.js` | 227 | The False Friends screen: `renderFalseFriends`, Study and Drill (`buildFFDrill`, `answerFF`), search and the risk filter (`FF_RISKS`). Moved verbatim (2026-10-24); the list is `falsefriends/list.js`. The Practice code that followed it in the same section (`renderPractice`, `startStudy`, the exam timer) stays in `index.html`, now under its own banner |
| `soundalikes/list.js` | 540 | The Sound-Alikes list, `SOUND_ALIKES` (45 sets: words that sound the same or close; plain data, 2026-10-29). Loaded like `falsefriends/list.js`. The Spanish is marked unchecked per set (`esChecked`) until Jose checks it |
| `features/sound-alikes.js` | 302 | The Sound-Alikes screen: Study (a speaker on every word and sentence), Drill (the phone says a sentence, you pick the rendering), `saSpeak` (es-US, a Latin American voice for seseo). `docs/features/sound-alikes.md` |
| `features/knowledge-brain.js` | 223 | Your knowledge brain, the Hub's side: `knowledgeBrainData` (what `brain/you.html` draws), your record and the daily count (`kbLogNote`, `ih_knowledgeLog`), the small live brain atop Term Review (`kbMiniHtml`, `kbMiniStart`, `kbMiniFrame`). Moved verbatim (2026-10-24); `docs/features/knowledge-brain.md` |
| `features/guide-front.js` | 232 | The User Guide's front page: `renderUserGuide`, the home of answers (`guideHomeHtml`, New lately), its sections, search (`setupGuideSearch`, `guideMarkWords`) and the install steps (`GUIDE_INSTALL_STEPS`). Moved verbatim (2026-10-24); the answers are `guide/topics.js`, the sheets and Show me stay in `index.html` |
| `features/doctor-sheets.js` | 317 | The doctor and provider sheets' "Where" (the place picker: `openPlacePicker`, `pickPlace`, adding a place) and the doctor directory's add and edit sheet (`openAddDoctorDirModal`, `openEditDoctorDirModal`, the photo, `saveDoctorDirEntry`, delete). Moved verbatim (2026-10-25); `docs/features/places.md`. Places' data and `savePlace` stay in `index.html` ("Places (shared)") |
| `features/csv.js` | 166 | The glossary's CSV export and import (More's Export / Import): `exportTermsCsv`, `parseCsv`, the staged import (`handleCsvImportSelected`, `showImportPreview`, `confirmCsvImport`). Moved verbatim (2026-10-25) |
| `features/duplicate-doctors.js` | 161 | Duplicate doctors: the likely pairs (`nameParts`, `looksLikeSamePerson`, `duplicateDoctorGroups`), the merge (`mergeDoctorRecords`, `mergeDuplicateDoctors`) and its card in the doctor list's tidy sheet (`duplicateBannerHtml`). Moved verbatim (2026-10-25) |
| `features/backfill.js` | 154 | The terminology backfill: doctors whose research is still the old flat list (`doctorsNeedingTiers`) re-researched one at a time (`runTierBackfill`, `cancelTierBackfill`, `tierBackfill`) and its card in the doctor list's tidy sheet (`backfillBannerHtml`). Moved verbatim (2026-10-25) |
| `features/ask-hub.js` | 2,040 | Ask the Hub with Dr. Smiley's side of it: retrieval and the answer (`askRetrieve`, `submitAsk`, `askTurnHtml`, `askLayout`), following a conversation (`ASK.convo`), context and actions (`askContext`, `ASK_ACTION_TYPES`, `ASK_RUN`), what he remembers (`drMemGet`, `ih_smileyMemory`), the memory screen (`openMemory`), your practice and the next step, corrections, feedback, sources and the owner's team notes review (`renderAskReview`). Moved verbatim (2026-10-25), 7 sections at once; a few lines stay in `index.html` where the group began (`ASK_STOP`, the waiting questions brought back, the `online`/`resize` listeners, `window.openAskHub`): they run at load and need `index.html`'s names. `docs/features/ask-the-hub.md` |
| `features/credits.js` | 300 | Idea credits: whose idea a screen or glossary domain was. The small purple tag under a credited screen's title (on a domain's banner, keyed by its id), the card it opens (tap, or double-tap the title), the owner's Give credit sheet, `hub-credits/{key}` keyed by the title (`creditDecorate`, `creditOpen`, `creditEdit`, `startCredits`, `creditWatch`). 2026-11-05; `docs/features/credits.md` |
| `features/tool-banners.js` | 117 | Tool banners: Translate, Term Review's start, Ask the Hub and Doctor Directory under the domains' colour banner with their pin (`TOOL_BANNERS`, `toolBannerHtml`; Doctor Directory's sits above its search, outside `#content`, its count set by `toolBannerMeta`), and the pin tapped on a Home tile or rail card flying into it (`tbFly`; none under reduced motion or Still). 2026-11-06; `docs/features/tool-banners.md` |
| `features/opening.js` | 291 | The opening, Badge in: every start on a phone, your badge over the pavilion, tap, scan, green, the ring opens into Home (`openingStart`, `opFrame`, `openingFinish`, `hubOpeningUp`, the `hub-opening-done` event Home's hello waits for) and More's Opening card (`openingMoreHtml`: on/off, Sound, My photo on the badge, Badge title, Replay; `ih_opening`, `ih_openingSound`, `ih_badgePhoto`, `ih_badgeTitle`). Pins on your lanyard, one per practice badge (`OP_PINS`, `opPinsHtml`, `ih_pinsSeen`; 2026-11-07). Decided and covered before the first paint by index.html's first script. 2026-11-05; `docs/features/opening.md` |
| `features/account.js` | 249 | Your account, email sign-in on the phone: More's "Your account" card (`accountMoreHtml`), the email then the 6-digit code (`accountSend`, `accountCheck`), signing in with the server's ticket (`signInWithCustomToken`, `accountAdopt`), the name following the account (`accountSaveName`, `accountBoot`), sign out back to a plain team phone (`accountSignOut`). The team-code screen's "Sign in with email" for an account already in the team (`accountLockToggle`, `accountLockSend`, `accountLockCheck`; `#accessEmail`). `ih_account`, `ih_accountPending`, `ih_accountNameAt`. 2026-11-06, phase E1; `docs/features/email-sign-in.md` |
| `features/account-sync.js` | 257 | What follows your account (phase E2): practice, streak, badges, memory trainer, Daily Drill, campus, knowledge count and settings (never Dr. Smiley's memory of you, `AGENTS.md`), kept in `account-sync/{uid}` and joined between phones (`accountSync`, `syncDecide`, `ACCT_SYNC_MERGE`, fingerprints in `ih_syncBase`). When the app opens, at sign-in, when you leave it, every 2 min while changed. 2026-11-06; `docs/features/email-sign-in.md` |
| `features/photo-adjust.js` | 190 | Adjust your photo: after you pick one in the name sheet, drag and zoom it in a square frame with Team Chat's ring, live previews round (chat) and tall (the badge), Save draws the 320 px square for `uploadAvatar` (`photoAdjust`, `paSave`, `paClamp`). 2026-11-06; `docs/features/photo-adjust.md` |
| `opening/` | — | The opening's pavilion in three lights by the clock (`openingLook`): `pavilion-1` midday, `pavilion-morning-1`, `pavilion-evening-1`, each an 8 s seamless loop (`.mp4` ~0.7 MB, `.webm`) and its still (`.webp`); rendered once from `docs/mockups/opening/`. `music-1.m4a` (0.34 MB), the opening's music, an original 28 s loop from `docs/mockups/opening/music/compose.py`. A new clip gets a new name (`sw.js` carries this one over between versions) |
| `figures/*.webp` | 3 files | The doctor, nurse and visitor beside the memory trainer's ring (practice scenes), cut out of Jose's drawing. `docs/features/practice-scenes.md` |
| `memory/lines.json` | — | The memory trainer's 60 practice lines in meaning chunks (`renderMemTrainer`; `docs/features/memory-trainer.md`). Precached by `sw.js` |
| `sw.js` | 220 | Service worker. Shows pushes from the server (`push`, the icon badge). Network-first for HTML and for the app code beside it (`app.css`, `home-polish.js`/`.css`, `pin-icons.js`; the saved copy offline or after 3 s, so a deploy's page and Home code arrive together). The app's page has 1 s to arrive whole (`PAGE_WAIT`, 2026-11-08: 3 s of white on hospital Wi-Fi), else the saved copy opens with its saved code (`fromSaved`), and a newer version reloads only once the app is in the background (`tests/tools/slow-open.cjs`). Stale-while-revalidate for the rest |
| `manifest.webmanifest` | — | PWA manifest |
| `DESIGN.md` | — | The design reference: colors with roles, type scale, letter spacing by size (`--tr-*`), weights, shadows, motion, do's and don'ts. Any tool reads it before a visual change |
| `vercel.json` | — | Cron: `/api/check-events` daily at 13:00 UTC; the walled-off headers for `atlas/`; only "Bump version" commits deploy (`ignoreCommand`, storage); no deployments for `claude/` branches (storage) |
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
| `api/sign-in.js` | — | Email sign-in: emails a 6-digit code (`send`), checks it and returns a Firebase sign-in ticket (`check`), moves the phone's place in the team (and the owner's line) to the account. Codes in `sign-in-codes/`, server only. `_mail.js` beside it sends through the Hub's Gmail (SMTP over Node's TLS, no package; `GMAIL_USER`, `GMAIL_APP_PASSWORD`); the ticket is `customToken` in `_service-login.js`. `docs/features/email-sign-in.md` |
| `api/push.js` | — | Notifications that reach a closed phone (Web Push): Team Chat, owners' sends, a test; the key phones sign up with. `_push-team.js` (who gets what, gone phones) and `_webpush.js` (encryption + VAPID signing, Node crypto) beside it. `docs/features/notifications.md` |
| `firestore.rules`, `storage.rules` | 213 / 33 | Firebase rules, applied by hand in the console |
| `hero.jpg`, `hmh-*.png`, `icon-*.png` | — | Image assets |
| `medical-pins.png.PNG`, `specialty-pins.png.PNG`, `pin-icons-source-hd-upload.png` | — | Jose's original sheets. Not loaded by the app any more and not deployed (`.vercelignore`); the files above were cut from them |

Line counts are `wc -l` on 2026-10-20. They drift with every PR; the names
and roles don't. Re-measure before quoting one.

Inside `index.html`, sections are marked with banner comments
(`/* ---------- Team Chat ---------- */`). Use them to navigate — do not read
the whole file when you only need one section.

## Feature notes

**One note per feature in `docs/features/`.** Read the one for the feature you
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
- Sound-Alikes, words that sound the same (`SOUND_ALIKES`, `renderSoundAlikes`, `saSpeak`): `sound-alikes.md`
- The memory trainer (consecutive practice) and its Voice and mic check in More (`voiceCheckOpen`): `memory-trainer.md`
- Practice scenes, the speakers beside the trainer's ring (`memSceneHtml`, `figures/`): `practice-scenes.md`
- CoreCHI Practice dashboard: score trend, Focus next, its motion (`renderScoreTrend`, `playPracticeMotion`): `practice-dashboard.md`
- HUMC Brain, the double-tap on Dr. Smiley's head, its data and what's real in it (`openHumcBrain`, `brain/`): `humc-brain.md`
- The campus celebration (a building finished), tap a person for a word (`campusFolkTap`, `ih_campusWord`) and the friendly weather for a streak (`CAMPUS_SKY`, `ih_campusSky`): `campus-celebration.md`, `campus-tap-person.md`, `campus-weather.md`
- Idea credits, whose idea a screen was: the tag, the card, the owner's sheet (`creditDecorate`, `hub-credits`): `credits.md`
- Tool banners on Translate, Term Review, Ask and Doctor Directory, and the pin's fly from Home (`toolBannerHtml`, `toolBannerMeta`, `tbFly`): `tool-banners.md`
- The opening, Badge in: when it plays, the loop, More's card (`openingStart`, `ih_opening`, `opening/`): `opening.md`
- Adjust your photo, the frame before it's saved (`photoAdjust`, `uploadAvatar`'s `ready`): `photo-adjust.md`
- Email sign-in, one account on every phone: the code, the ticket, the owner carried over, what syncs and what doesn't yet (`api/sign-in.js`, `features/account.js`, `accounts/`): `email-sign-in.md`
- Your knowledge brain, its small live copy atop Term Review (`kbMiniHtml`), the CoreCHI Practice tile, your record and the daily count (`knowledgeBrainData`, `ih_knowledgeLog`, `brain/you.html`): `knowledge-brain.md`
- The tab bar, slim when you scroll: when it changes (no timer, a real scroll, full at the top and bottom), the slim look, the move (`wireDock`, `dockSettle`, `dockMorph`): `tab-bar.md`
- The More sheet, grouped: Study, Doctors, Reference, You; the settings rows' own sheet; numbers that need you (`MORE_GROUPS`, `moreSubOpen`, `reviewedDueCount`, `eventsNewCount`, `ih_eventsSeenAt`): `more-sheet.md`
