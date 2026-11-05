# Interpreter Hub — Design Reference
> A calm hospital-blue glass app for one-handed use between assignments: soft color-mesh ground, white cards that lift when pressed, navy and cyan from the Hackensack Meridian logo, Inter everywhere.

**Theme:** light and dark (`html[data-theme="dark"]`)

Read this before any visual change, whatever tool you are. It is the
reference for values; `AGENTS.md` holds the rules for where a change goes
(Home's look in `home-polish.css`, everything else in `app.css`), and
`CLAUDE.md` the history behind each rule. The values here are measured
from the code; when one changes, change it here in the same commit.

The Hub is an installable web app used mostly on phones, in a hospital,
often with one hand. Surfaces are cool and crisp, built on the Hackensack
Meridian blues: a soft color-mesh background, white cards with a bright top
edge and a navy-tinted shadow, and real backdrop blur only on the fixed
chrome (header, tab bar, search, sheets). Jose's bar is "high end",
"dynamic", "alive": new screens inherit this system, they never invent a
second one.

## Colors

Tokens on `:root` at the top of `app.css`; the dark theme redefines the
same names.

| Name | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#F4F6FA` | `#0E1420` | Page ground under the color mesh |
| `--bg-hi` | `#FAFBFD` | `#141B29` | Raised ground, wells |
| `--paper` | `#FFFFFF` | `#1A2233` | Cards, sheets, inputs |
| `--ink` | `#151C2C` | `#EBEFF7` | Headings and body text; never pure black |
| `--ink-soft` | `#5A6478` | `#AEB7C9` | Secondary text, counts, meta |
| `--ink-faint` | `#6B7489` | `#8C97AD` | Hints, placeholders, the quietest labels. 4.7:1 on paper, 5.4:1 on dark paper (was #98A1B3 / #707C93, 2.6:1 and 3.8:1: under WCAG's 4.5:1 for text; darkened 2026-11-04, the feel audit's phase 5, Jose's pick) |
| `--line` | `#E2E7F0` | `#2B354A` | Borders and rules |
| `--line-soft` | `#EEF1F7` | `#232C3E` | Inner dividers |
| `--accent` | `#0F5FA6` | `#4C9FE0` | An SVG fill (icons, marks). Not a button or link color: as a background it appears on exactly one element |
| `--accent-2` | `#2E8BD0` | `#6BB4EA` | Focus rings, small highlights |
| `--accent-soft` | `#E8F1FA` | `#1B3350` | Tinted wells behind accent marks |
| `--navy` | `#252E6D` | `#7C93E8` | The brand navy: sidebar, Dr. Smiley's card, the strong button |
| `--cyan` | `#01B8E6` | `#4FD8F5` | The logo's cyan: small live marks |
| `--danger` | `#C2485C` | `#E17B8C` | Errors, risk, delete |
| `--danger-soft` | `#FBECEF` | `#3A2029` | Behind danger text |
| `--good` | `#2B7354` | `#6FC79C` | Correct, done, saved | (was #2F7D5B, 4.4:1 on its soft tint; 5.0 since 2026-11-04)
| `--good-soft` | `#E7F5EE` | `#16302A` | Behind good text |

Domain colors (one per glossary domain) feed the icons through `--ic-fill`
and `--ic-line`. Every neutral is blue-shifted; there is no pure gray.

## Typography

### Inter: the interface
All interface text, headings included. Loaded from Google Fonts as the
variable font, weights 100 to 700 only (`index.html`, the fonts `<link>`):
anything asked above 700 renders as 700.
- **Weights:** 400, 500 (body text, set on `body`), 550 (medium), 650 (strong). No others; `tests/suites/type-tokens.cjs` fails on any other.
- **Bold inside text:** `b`, `strong` and bare `h1`-`h6`, `th` are 650 (an element rule in `app.css`), not the browser's 700, or 900 from "bolder" inside a 650 parent.
- **Letter spacing goes with the size.** One token per band of sizes, never a value picked per element:

| Token | Value | Sizes |
|---|---|---|
| `--tr-sm` | `0` | 11 to 13px |
| `--tr-body` | `-.015em` | 14 to 16px |
| `--tr-head` | `-.02em` | 17 to 18px |
| `--tr-title` | `-.025em` | 19 to 23px |
| `--tr-big` | `-.03em` | 24px and up |
| `--tr-caps` | `.06em` | ALL-CAPS labels, any size |

The values are what the Hub already used most at each size (measured
2026-11-03). Inter's own guide (its v3 "dynamic metrics" formula, `tracking
= -0.0223 + 0.185 × e^(-0.1745 × size)` em) asks for about .01em less
tightening at every size; the Hub has always set a little tighter, and
keeps it.

### IBM Plex Serif: quoted human speech only
Ask the Hub answers, review lines. Nowhere else.

### IBM Plex Mono: codes and machine labels
Team codes, small machine labels. Its own letter spacing; outside the token rule.

### The Home hello banner: the one exception
Jose's pick, "style 8": the name in Parisienne, the quote in Lora italic,
the author in small Inter capitals behind a short rule. Block "Hello banner
lettering" at the end of `home-polish.css`. These two faces appear nowhere
else, and the banner's own weights and spacing are outside the token rule.

### The opening's badge: the other exception
The opening (`features/opening.js`, block "Opening (Badge in)" in
`app.css`) draws Jose's real staff badge: its lettering keeps the badge's
own sizes (8 to 23px), Georgia italic for the title and the HMH lettering,
and the lockup "*Interpreter* Hub" in Cormorant Garamond (italic 500,
upright 600). Its `.op-*` rules are outside the token rule like the hello
banner; Cormorant appears nowhere else. The words around it ("Tap your
badge to begin", "Welcome in") are Inter on the tokens.

### Type scale

**Every size is one of these ten steps** (Apple's iPhone type scale, which the Hub's look is built on); `tests/suites/type-tokens.cjs` fails on any other, except display sizes of 36px and up (the Home hello name, big numerals). Nothing is under 11px, Apple's smallest. Tokens `--fs-*` in the "Visual refinement" block of `app.css`. "Weights seen": the most common, measured on 17 screens, phone and desktop (2026-11-03); 17px and up is always 650.

| Role | Token | Size | Weights seen | Spacing |
|---|---|---|---|---|
| caption 2 | `--fs-cap2` | 11px | 550, 650 | `--tr-sm` |
| caption | `--fs-cap` | 12px | 650, 500 | `--tr-sm` |
| footnote | `--fs-foot` | 13px | 650, 500 | `--tr-sm` |
| subhead | `--fs-sub` | 15px | 650, 500 | `--tr-body` |
| callout | `--fs-call` | 16px | 650, 500 | `--tr-body` |
| headline | `--fs-head` | 17px | 650 | `--tr-head` |
| title 3 | `--fs-t3` | 20px | 650 | `--tr-title` |
| title 2 | `--fs-t2` | 22px | 650 | `--tr-title` |
| title 1 | `--fs-t1` | 28px | 650 | `--tr-big` |
| large title | `--fs-large` | 34px | (not on those screens) | `--tr-big` |

**Inputs are never under 16px** (iOS zooms the page in on anything smaller).

## Spacing and layout

- **Spacing scale:** `--sp-1` 6px, `--sp-2` 9px, `--sp-3` 13px, `--sp-4` 17px, `--sp-5` 26px.
- **Icons:** rows and tab bar 24px (`--ic-row`), list rows 28 (`--ic-list`), tiles and cards 32 (`--ic-tile`), banner 44 (`--ic-hero`).
- **Card rails:** 4 columns, 13px gap, content left-aligned. Centering only for the four `.qa-tile` buttons.
- **Sidebar and tab bar switch at 900px.** Desktop: dark navy sidebar. Phone: a floating capsule tab bar with a pill indicator.
- **Tap targets:** 44 × 44px at least. A gap you can see is not a gap a finger respects; check with `document.elementFromPoint`.

### Border radius

- `--r-sm` 10px, `--r-md` 14px, `--r-lg` 20px.
- **A rounded child inside a rounded parent takes the smaller radius:** `.qa-tile` 17px holds `.qa-tile-icon` 12px; `.qa-card` 19px holds `.qa-icon` 12px. No equal parent and child pair exists.

## Elevation

**The finish.** Every raised surface gets exactly this, not a custom shadow:

```css
box-shadow:
  0 1px 0 0 inset rgba(255,255,255,0.82),
  0 1px 2px        rgba(20,43,67,0.06),
  0 8px 20px -12px rgba(22,55,90,0.22);
```

- `--sh-1`, `--sh-2`, `--sh-3`: layered navy-tinted shadows for lifted, floating and modal surfaces.
- Shadows and borders tint navy in the light theme, never `rgba(0,0,0,x)`. The dark theme's `--sh-*` are black (`rgba(0,0,0,x)`); why is not recorded.

## Surfaces

- **Glass:** `--glass-bg` `rgba(255,255,255,0.72)`, `--glass-blur` `saturate(180%) blur(20px)`. Real blur only on the fixed chrome: header, tab bar, search, sheets. Scrolling cards fake it with translucency and a bright top edge (`--glass-edge`), because blurring dozens of moving cards costs more than it shows.
- **Color mesh:** the soft background behind everything.
- **Paper:** cards and sheets.

## Icons and imagery

- **Icons are duotone:** a large flat color block spilling past the outline on one side, not a tint tracing the shape. Domain color and light or dark through `--ic-fill` and `--ic-line`.
- **Pins:** pre-cut 192px images, `pins/<key>.webp` (`pin-icons.js` says which pin each domain and tool gets).
- **Dr. Smiley:** drawn art and his own animation engine; rules in `docs/features/dr-smiley.md`.
- **Photography:** the Home banner photo of the HUMC campus, framed per mode (the block "Hello banner photo" at the end of `home-polish.css`).

## Motion

- **A plain tap settles on `--spring0`,** Apple's spring with no bounce (`linear()`, falling back to `--ease`): press .368s, screen .588s, sheet .662s.
- **Overshoot only where it is the point:** the Practice buttons' `--spring-settle`, Dr. Smiley's acting. No new overshooting `cubic-bezier`; `tests/suites/springs.cjs` holds the kept list.
- **Touch press feedback:** `:hover` never fires on a phone. Presses use `:active` plus a JS `.is-pressed` class held about 260ms (the `LIFTS` list in `index.html`).
- **Every animation has a `prefers-reduced-motion` guard;** every control keeps `:focus-visible`.
- **An entrance never fills forwards** (`animation-fill-mode: both` or `forwards`) on anything with a press or hover rule: the held last frame beats every normal rule, so the press glow dies with no error (the term and doctor cards, 2026-11-04). Use `backwards`; the last frame is the rest state anyway. The feel guard (`tests/suites/feel.cjs`) checks the cards.
- **Speed never costs the look:** make a visual cheaper, never smaller, shorter or stopped.

## Do's and Don'ts

### Do
- Use the tokens: `--fs-*` for size, `--tr-*` for letter spacing, `--sp-*` for spacing, `--r-*` for radius.
- Give every raised surface the finish shadow above.
- Use the lowest selector specificity that works, then check that press, focus and hover still fire (measure them).
- Check a new screen at phone width first (393px), then desktop.
- Update the User Guide (`guide/topics.js`) with every change someone can see.

### Don't
- Don't pick a letter spacing per element; take the token for the size.
- Don't use weights 600, 700 or 800. Use 650 for strong and 550 for medium.
- Don't use the accent blue as a button or link color.
- Don't use pure black or pure gray anywhere.
- Don't put Parisienne or Lora outside the Home hello banner, or the serif outside quoted speech.
- Don't set an input under 16px.
- Don't use `body:has(...)` for screen state (it restyled Home on every scroll); overlays set classes on `body`.
- Don't add a second design language. Cloudflare-, Vercel- or Stripe-style files are good for their format, not their look.

## Known gaps

- **Sizes set from script:** 8 inline `font-size` values in `index.html`, `features/csv.js` and `features/translate.js` are still plain pixels; the stylesheets are all on the scale (2026-11-03).
- **Spacing:** padding, margin and gap use a token about 99 times against about 1,737 pixel values. When you touch a component, move it onto the scale rather than adding to the tail.
- **Leftover serif-era headings** set at weight 400 (`.section-head h2`, `.modal h3`, `.doc-card-name`); a later sans rule overrides most of them. Whether any should be 650 is Jose's call.
