# Tool banners

Built 2026-11-06 (Jose: "Plan it for real", then "Build it", after the
phone mockups). Code: `features/tool-banners.js`; styles: the "Tool
banners" block at the end of `app.css`; check: `tests/suites/tool-banners.cjs`.

## What it does

Four tool screens get the same colour banner the glossary domains have
(`domainBannerHtml`): a big title, the screen's own 3D pin, one line of
live facts, the soft gradient. A compact version, about 100px tall, so
the screen's main button stays near the top.

| Screen | Pin | Colour | The line under the title |
|---|---|---|---|
| Translate | `translate` | teal `#0E7490` | Glossary first, then the AI |
| Term Review (start screen only) | `review` | violet `#5B4DB3` | 435 due |
| Ask the Hub | `wave` | navy `#252E6D` | no line: **What I remember** and **New** (a new conversation) sit there |
| Doctor Directory | `doctor-directory` | green `#0F766E` | 64 doctors, with **+ Add** beside it |

Colours go through `bannerTone()`, so white text keeps 4.5:1.

When you tap a way into one of these four on Home (a quick tile, a rail
card), the pin you tapped flies into the banner's pin spot (about 0.7 s,
on the app's spring) while the screen draws.

Who it's for: everyone on the team. The tool screens (plain white forms
today) should look like they belong to Home and All domains.

## Not in this version

- Other screens (Doctor Prep, Practice, False Friends, Sound-Alikes,
  Events, Updates). One at a time later, if these four work.
- Term Review in a session or on its Session done screen: they keep the
  small title, because during a session every pixel goes to the card.
- The banner shrinking as you scroll.
- A fly from the tab bar, search results, the computer's sidebar, or
  back to Home on Back.
- Meshy 3D pins that spin.
- Renaming anything: the titles stay exactly as they are ("Doctor
  Directory", not "Doctors"), because Idea credits and the User Guide
  use them.

## How similar apps do it, and where ours can be better

- **iOS large titles** (Settings, Mail, Health): a big title at the top
  that tucks into the bar as you scroll. It's text only. Ours adds the
  pin, so the screen is recognised before you read it. Their tuck on
  scroll is the better part, and it waits for a later version.
- **App Store, Today tab**: the card you tap grows into the story, so you
  see where you came from. Ours borrows that link between Home and the
  screen, made small: only the pin moves, not the whole card. That's
  cheaper on a hospital phone and harder to break.
- **Android's container transform** (Material motion): the same idea,
  built into the system. A web app gets none of it for free. Ours runs
  on any phone with plain web animation, needs no View Transitions
  support, and stays put under reduced motion and Dr. Smiley's Still.

## The cost

- Height, measured in the mockup at phone size (390px wide): the first
  control under the banner moves down 66px on Translate (its Translate
  button) and Term Review (Start), 12px on Ask (its header is already
  big), 81px on Doctor Directory. The banner is 99px tall, 130px on
  Doctor Directory, where the long title wraps beside **+ Add**. Built,
  **+ Add** sits on the line with the count: one-line title, 111px (the
  button is 44px to tap). That's the trade for the look.
- One extra picture per screen, already cached: the pins are in `pins/`.

## How it's built

What changed from the plan while building (2026-11-06):

- **Ask.** With the title in a banner, its old header row (What I
  remember, New conversation, his small face) was a second row of its own.
  Those two links moved onto the banner ("New conversation" reads **New**,
  aria-label "New conversation", so both fit one line at 360px), and his
  face takes the pin's place once a conversation starts (the hello shows
  its own big face, so the banner shows the pin until then). The banner is
  118px, in both states. The empty screen shows the same suggestions as
  before: 4 of 4 on a 390 × 780 phone, 3 of 4 at 360 × 740, measured on
  main and on this change.
- **Doctor Directory.** Its banner is drawn by `render()` above the search,
  outside `#content` like a domain's banner, because typing in the search
  redraws `#content`. `renderDoctorDirectory` sets the count with
  `toolBannerMeta`. `DOCTOR_ADD_BTN` became `doctorAddBtnHtml()`: `render()`
  can run before the line that declared it. 111px with the 44px **+ Add**.
- Heights measured on a 390px phone: Translate, Term Review 98px.

The pieces, as planned:

- New `features/tool-banners.js`: `toolBannerHtml(key, facts, action)`
  (draws the banner, reusing the `.domain-banner` styles plus a
  `.is-tool` size) and the fly. The fly records where a Home pin was
  tapped (a capture listener, so Home's own code stays untouched), and if
  a tool banner draws within 600 ms, a copy of that pin flies to it and
  is removed. Reduced motion, Still, a hidden page or a missing pin: no
  fly, the banner is simply there.
- Styles: a "Tool banners" block in `app.css` (these screens aren't Home).
- The four screens swap their small title for the banner:
  `features/translate.js`, `index.html` (Term Review's start screen, the
  three Doctor Directory headers), `features/ask-hub.js` (the banner
  replaces the whole `ask-head`; its owner-only "Lessons to review" screen
  keeps its own head).
- `features/credits.js`: `creditTitle()` also finds the title inside a
  tool banner, so "Sylvia's idea"-style tags keep working.

## Checks

A new suite, `tests/suites/tool-banners.cjs`, phone and computer, light
and dark: each banner is drawn, its title is the credit title, nothing
spills sideways at 360px, Doctor Directory's **+ Add** still opens the
sheet and is at least 44px, Back from each screen is unchanged, the fly
runs only from Home and leaves no copy behind, and nothing moves under
reduced motion. Then the whole run (`node run.cjs`).

## User Guide

A "New lately" card, and every answer that describes these titles
checked and rewritten where it's wrong.

## Other ideas from the same ask (later, not planned)

Jose, 2026-11-06, asked how ThreeUI (github.com/MengTo/threeui, MIT) and
the Meshy API could make the app look better. Mockups were shown in the
chat only; none is built.

- A thinking trace: a light running around the answer card while
  Translate, Look up, Doctor Prep or Ask works (after ThreeUI's Thinking
  Button, canvas only).
- A 3D card stack with swipe for False Friends, Sound-Alikes and Term
  Review study (after ThreeUI's Koi Studies, CSS only).
- A practice certificate after a passed mock exam, saying clearly that
  it's not a CCHI credential (after ThreeUI's Engraved Certificate).
- Meshy: 3D hospital equipment for a "What's it called?" drill, rendered
  once to still frames; props for the 3D campus; spinning pins on the
  banners. Never anatomy: generated organs look plausible and come out wrong.
- Skipped: always-on dark backgrounds, the mouse-only Animated Top Dock,
  anything with other companies' logos (ThreeUI's Water, Lightning and
  Fire, Brand Orbs).
