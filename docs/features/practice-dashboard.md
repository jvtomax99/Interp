# CoreCHI Practice dashboard

`renderPractice()` in `index.html`. Top to bottom: readiness card (ring,
streak, today's goal, due), the dashboard row, the ways in, This week,
Badges, Your domains, Custom session.

**Dashboard row** (`.dash-row`, two columns from 600 px):
- `renderScoreTrend()`: your last 12 finished sessions from `quiz-history`
  (`myQuizHistory()`, matched by name), oldest left. Big number = last
  session, chip = difference from the average of the earlier ones, foot =
  sessions / all-time / best (what the old "My progress" card showed). SVG
  300x96, labels in their own right gutter (`TREND_GUT`). Tap a point
  (`trendPick`, 30 px hit circles) to read it; tap again for the latest.
- `renderFocusTile(examReadiness().worst)`: the domain whose gap costs the
  most exam weight, with Practise it -> `startStudy('domain', id)`.

The old "My progress" card is gone: its numbers are in the trend tile, its
per-domain accuracy is now "N% right in sessions" on each Your domains row
(`domainAccuracy()`).

**Motion** (`playPracticeMotion`, called from `renderContent`): blocks
arrive staggered (`.dash-in`, `--i`), numbers count up (`.js-count`,
`data-to`; the markup holds the final value), bars grow (`animateBars`,
Web Animations), the score line draws itself and its points pop as the
line reaches them, one ripple off the newest point. Each moving block has
`data-motion` + `data-sig`. The screen re-renders for unrelated reasons
(quiz history arriving, chat), so a block whose sig is unchanged resumes
its motion (`--motion-skip`, `MOTION_BORN`) instead of restarting, and is
`.is-still` once 1.5 s old. Reduced motion: everything final, no animation.

**The Pixar finish** (block "Practice: the Pixar finish" in `index.html`,
Jose 2026-10-19: "3D world, inspired by Disney and Pixar"; he picked light
and material over real 3D). Clay tiles (`--clay-*` tokens, own dark
values): warm key light top-left, sheen, a lip above and a shade below,
contact + far shadow; this screen deliberately steps past the app-wide
finish shadow. Readiness ring is a glossy donut (`.ready-ring::before`,
masked to the band; radii assume 104 px ring / 70 px hole, change them
together). Candy buttons (`.mastery-go`, in `LIFTS`) squash on press.
Score dots are glossy beads (`#trendBall`). Arrivals land with a squash
(`dashIn`). The lean: an IIFE after `animateCounts` sets `--rx/--ry/--mx/--my`
on the pressed tile (touch) or hovered tile (mouse), only on the practice
screen; release springs back via `--spring`. Nothing runs at rest; reduced
motion turns the lean and squashes off.

**Your HUMC campus** (`renderCampus`, `CAMPUS`, `CAMPUS_MAP`; Jose,
2026-10-19: "look like a game", then "like Hackensack University Medical
Center", from his four campus photos). Replaced the navy readiness card.
Each domain is a campus building (Ethics main hospital, Encounter Helena
Theurer Pavilion, Terminology Cancer Center, US Systems the pavilion on the
circle, Culture Children's); floors built = coverage (learned + shaky/2),
from its fewest floors to all (`campusLevel`), the rest scaffolding + crane.
Art is pre-rendered 3D in `city/` (ground, every building at every floor
count, its shadow, two cars): stacked back to front in `CAMPUS` order, each
placed by pixel boxes from the 960x960 render (`CAMPUS_MAP`, from the
render script's city.json). To change the art: `docs/mockups/cchi-city/`
(`build.html` + `buildassets.cjs`, then paste the compact manifest).
Labels (`.cp-tag`) and buildings (`.cp-bld`) start that domain; Play
starts the next mode. Dr. Smiley in the card is an `ask-face`, so the dock's
Dr. Smiley steps aside (one at a time). Cars and the fountain run only
while the card is on screen (`watchCampus`, `.is-away`); `.is-still` spares
them; reduced motion: no cars, no sparkle.
