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
