# CLAUDE.md — HUMC Interpreter Hub

Read this before changing anything. It is the source of truth for how this
project is built and shipped.

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
| `index.html` | 20,894 | The whole app (1.1 MB). All CSS and JS inline |
| `home-polish.css` | 894 | Overlay layer. Loads right after `</style>`, so it wins |
| `home-polish.js` | 1,220 | Home behaviour: hello wave, rail dots, section overlay, Dr. Smiley |
| `pin-icons.js` | 968 | Pin/icon wiring: which pin each domain and tool gets |
| `pins/*.webp` | 41 files | One pre-cut 192 px pin each, named by key (`pins/oncology.webp`) |
| `pin-icons-sheet.webp` | — | The 8 × 8 sprite sheet behind `.pin-sprite` (1024², 381 KB) |
| `drsmiley/*.webp` | 5 files | Dr. Smiley: `base` (his calm head and shoulders), `face` (a strip of 18 frames of his eyes and mouth, cut from Jose's drawn expression sheets and fitted onto that same face), `hat-cap`/`hat-mirror`/`hat-grad` (rank outfits). See `drSmileyArt()`, the animation engine (`DrAnim`, `drAnim()`, and the older names `drFacePlay()`/`drFaceIdle()`/`drFaceTalk()` now built on it) and `smileyAccessory()` in `index.html`. On Home, `home-polish.js` draws his lanyard as live cords over him |
| `sw.js` | 175 | Service worker. Network-first for HTML, stale-while-revalidate for the rest |
| `manifest.webmanifest` | — | PWA manifest |
| `vercel.json` | — | Cron: `/api/check-events` daily at 13:00 UTC; the walled-off headers for `atlas/` |
| `atlas/` | 34 MB | 3D Body: a built copy of Human Atlas (MIT; anatomy data BodyParts3D, CC BY 4.0). Outside code, run in a sandboxed frame by `anatomySync()` in `index.html`. Origin, licences, the wall and how to rebuild: `atlas/README.md` |
| `api/translate.js` | 168 | Translate tool — Claude API |
| `api/doctor-research.js` | 379 | Doctor Prep — Claude API + web search |
| `api/check-events.js` | 224 | Cron job watching CE/training events |
| `api/term-lookup.js` | 293 | Term reference lookup — Claude API + web search |
| `api/_hub-access.js` | — | Members-only check shared by the AI endpoints (not an endpoint itself) |
| `api/ask.js` | — | Ask the Hub — answers from the entries the app sends, plus approved team notes |
| `firestore.rules`, `storage.rules` | 78 / 19 | Firebase rules, applied by hand in the console |
| `hero.jpg`, `hmh-*.png`, `icon-*.png` | — | Image assets |
| `medical-pins.png.PNG`, `specialty-pins.png.PNG`, `pin-icons-source-hd-upload.png` | — | Jose's original sheets. Not loaded by the app any more; the files above were cut from them |

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
| Everything else | `index.html` |

**The overlay files only cover Home.** They contain nothing for the glossary,
terms, chat, Doctor Prep, study, quizzes, profile, settings or the guide —
those screens exist only inside `index.html`, so that is where their changes
have to go. Say so plainly rather than inventing a place to put them.

**Match specificity, do not escalate it.** `home-polish.css` is written with ID
selectors (`#content.is-home .x`). Anything added there at the same or higher
specificity will quietly beat interaction states (`:active`, `.is-pressed`,
`:focus-visible`) defined in `index.html`. When adding a rule, use the lowest
specificity that works, and check that press, focus and hover still fire
afterwards — measure them, do not assume.

**Never resolve a merge with `git checkout --ours`.** It once discarded the
`pin-icons` and `home-polish` wiring out of `index.html` in a single command.
Resolve conflicts hunk by hunk, then confirm all three files are still loaded
(`index.html` lines ~5685, ~5686, ~20892) before pushing.

## Deploying

Vercel auto-deploys on push to the default branch. There is no build step.

**Three things must stay in sync on every deploy that changes `index.html`:**

1. **`BUILD_ID`** (`index.html`, ~line 16080, format `bMMDD.HHMM`) — bump it.
   This is the only reliable way to confirm what is actually live.
2. **`CACHE_VERSION`** (`sw.js` line 29) —
   bump it whenever `index.html` changes meaningfully, or returning users
   keep the stale cached app.
3. If an `api/*.js` file changed, it ships in the same push.

After pushing, verify: load the live URL headless and confirm the new
`BUILD_ID` is present. Do not ask Jose to check something you can check.

## Verifying before you push

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
terminology-meta/       categories + migration flags; smiley = team points (Dr. Smiley's rank)
terminology-hub/        legacy
team-chat/              chat-typing/  term-attachments/  term-reviews/
healthcare-providers/   doctor-directory/  doctor-research-cache/
ce-events/  announcements/  practice-questions/  quiz-history/
activity-log/  deleted-items/  watcher-state/  team-members/  term-link-cache/
hub-access/{owner,settings}  hub-invites/{CODE}  hub-members/{uid}   <-- Team access
hub-lessons/{id}                                                     <-- Ask the Hub team notes
```

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

**Team access (one team code).** Everyone types the same team code
(`hub-invites/{CODE}`, kind `team`); the owner shares it and can change it on
the Team access screen, optionally signing every other phone out. The owner
has a separate owner code (kind `owner`) for their own phones. Entering a code
signs the phone in anonymously and creates `hub-members/{uid}`, with `who` =
the name set on that phone (self-reported). Every rule is `if team()` = joined phone OR practice
mode. Practice mode (`hub-access/settings.practice`) is the owner's switch;
while it's on nothing is enforced. The first owner is claimed once via
`?setup=owner`. The AI endpoints check the same thing through
`api/_hub-access.js`, and the app sends `hubAuthHeaders()`. Startup database
calls wait for `hubAuthReady`. Rules are tested against the Firebase emulator
(firebase-tools + `@firebase/rules-unit-testing`; run the emulators with the
proxy variables unset or cross-service Storage lookups silently fail).

**Migrations:** new domains/terms are added by idempotent migration functions
gated on a unique boolean flag in `terminology-meta/categories`, each awaited
in the `loadData()` init chain. Follow that pattern — never write a migration
that runs twice.

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
- `localStorage` key `ih_myName` holds the user's display name.
- **Dr. Smiley moves only through his controller.** One `DrAnim` per
  character (`drAnim(svg, {head})`) owns his face frame, gaze, lean and
  effects, with priorities (`DR_P`: IDLE < GAZE < REACT < DIRECT). Ask it to
  `play()` / `talk()`; don't set frames or animate his pin yourself (the Home
  greeting's frame-by-frame `drFaceSet` is the one exception, while his idle
  is stopped). Interruptions walk through in-between frames (`DR_FACE_BACK`);
  a sequence whose consecutive frames aren't neighbours gets them filled in.
  Reduced motion, a hidden page and a detached svg are handled there.
- **His personality comes from task states, not timers.** `drTask(kind)`
  (available, attentive, processing, answering, celebrating, uncertain;
  offline, appointment and resting follow the phone) is one state for the
  whole app; each controller runs that state's hold (thinking while Ask works,
  reading an answer with you) at `DR_P.TASK`, so idle can't interrupt it.
  React by meaning: `smileyReact(kind)` for team news, `smileyStudy()` for a
  study result, `askReact()` for an Ask outcome (`askOutcome`: verified only
  when a source checks out locally, never `fromHub` alone; the card's
  provenance label is untouched). No mouth movement for silent text: `talk()`
  is for real audio only. Lively / Focused / Still is `setSmileyMode`
  (`ih_smileyMode`); the phone's reduced motion always means Still.

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
"Visual refinement" block of `index.html`: caption 12, footnote 13, subhead
15, headline 17, title3 20, title2 22, title1 28 (`--fs-*`). Spacing
6/9/13/17/26 (`--sp-*`). Icons: rows and tab bar 24, list rows 28, tiles and
cards 32, banner 44 (`--ic-*`). Tracking tightens as size grows; prefer the
weights 550 and 650. IBM Plex Serif is reserved for quoted human speech (the
greeting quote, Ask answers, review lines).

Rules that hold across the whole app:

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

**Known gap.** The look is tokenized (34 `:root` vars); the rhythm is not.
There are no spacing or font-size variables, and 12 hard-coded spacing values
crowd into 6-17px: 9px (113 uses), 17px (66), 11px (57), 10px (38), 6px (22),
then a tail of 7/8/13/14/15/16. Type has 11 sizes with no ratio, and
12/12.5/13 and 14/14.5/15 are distinctions the eye cannot resolve. Collapsing
to five values covers 86% of current uses: **6 / 9 / 13 / 17 / 26**. When
adjusting spacing on a component, move it onto that scale rather than
extending the tail.

## Working agreement

- Jose works from a phone much of the time. Keep instructions concrete and
  one step at a time; screenshots beat abstract description.
- Scope each session to one feature or one bug. Commit with a real message
  saying what changed — the first 200 commits were all "Add files via upload"
  and none of them can be read back.
- When a bug survives a fix, ask for a concrete reproduction path
  ("Radiation → Back → Home"). That specificity is what has surfaced root
  causes; general fixes have repeatedly missed.

## Open items

- **Team access is built but only enforced once Jose locks it.** Until
  practice mode is off, the rules behave as they used to (open).
- **The events watcher (`api/check-events.js`) has no sign-in.** It works in
  practice mode only; once locked it can't save new events until it gets its
  own credentials (a Firebase service account in Vercel is the usual fix).
  Putting a shared secret inside the documents it writes was rejected as a
  credential leak.
- `index.html` is one 1.1 MB file. Splitting CSS and JS out is the main
  structural cleanup available.
