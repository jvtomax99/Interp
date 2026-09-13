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
| `index.html` | ~11,200 | The entire app. CSS ~3,130 lines, JS ~7,600 lines, all inline |
| `sw.js` | 122 | Service worker. Network-first for HTML, cache-first for icons |
| `manifest.webmanifest` | — | PWA manifest |
| `vercel.json` | 8 | Cron: `/api/check-events` daily at 13:00 UTC |
| `api/translate.js` | 128 | Translate tool — Claude API |
| `api/doctor-research.js` | 295 | Doctor Prep — Claude API + web search |
| `api/check-events.js` | 224 | Cron job watching CE/training events |
| `hero.jpg`, `hmh-*.png`, `icon-*.png` | — | Image assets |

Inside `index.html`, sections are marked with banner comments
(`/* ---------- Team Chat ---------- */`). Use them to navigate — do not read
the whole file when you only need one section.

## Deploying

Vercel auto-deploys on push to the default branch. There is no build step.

**Three things must stay in sync on every deploy that changes `index.html`:**

1. **`BUILD_ID`** (`index.html`, ~line 9183, format `bMMDD.HHMM`) — bump it.
   This is the only reliable way to confirm what is actually live.
2. **`CACHE_VERSION`** (`sw.js` line 29, currently `interpreter-hub-v4`) —
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
terminology-meta/       categories + migration flags
terminology-hub/        legacy
team-chat/              chat-typing/  term-attachments/  term-reviews/
healthcare-providers/   doctor-directory/  doctor-research-cache/
ce-events/  announcements/  practice-questions/  quiz-history/
activity-log/  deleted-items/
```

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
- **Back navigation:** subgroup taps always call `setCategory()` so they land
  on the history stack. Scroll-only (`scrollIntoView`) is reserved for
  "General terms" when already on that parent. The breadcrumb "Up to [Parent]"
  pill is explicit up-navigation; the Back button does pure history retracing.
  This broke three times — do not "simplify" it.
- **Cache-first startup:** the app paints from the `localStorage` glossary
  cache. The first load after a deploy is always slow. That is expected; it is
  not a regression.
- `localStorage` key `ih_myName` holds the user's display name.

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

**Type.** IBM Plex Sans for all interface text. h1 39/700 at -0.035em,
h3 19/650 at -0.025em, body 14/500, label 13/550, meta 12/500. Tracking
tightens as size grows. Prefer the variable-axis weights 550 and 650 over
600 and 700. IBM Plex Serif is reserved for quoted human speech (2 uses);
`--mono` is declared and unused.

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

- **Firestore security rules are wide open** (`allow read, write: if true`)
  across all collections, and this repo is public. Anyone who finds the
  project ID can read and write everything, including team chat. Fix the
  rules before pushing adoption — that is the real fix; making the repo
  private alone is not, since the project ID is visible in the shipped JS.
- Rules still missing for `doctor-directory` and `doctor-research-cache`.
- No access control / auth in the app yet.
- `index.html` is one 628 KB file. Splitting CSS and JS out is the main
  structural cleanup available.
