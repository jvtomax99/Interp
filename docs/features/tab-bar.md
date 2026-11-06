# The tab bar, slim when you scroll (2026-11-06)

Status: built on branch `claude/tab-bar-slim`, waiting for Jose's push.
Code: `wireDock`, `dockTuck`, `dockOpen`, `dockMorph` in `index.html`
(section "Split dock (phones)"); looks in `home-polish.css` ("Split dock",
"Slim while you scroll"); checks in `tests/suites/dock-tuck.cjs`.

## The problem (measured, iPhone size, before)

- It tucked by itself 4 s after any touch, even while you read the top of
  Home (`IDLE_TUCK`).
- Any 8 px of scrolling down, once 160 px down the page, tucked it: a thumb
  nudge did.
- Tucked, it was a 142 px capsule holding only the current tab: every tab
  took two taps (the first only opened the bar).
- At the bottom of a page the bounce flipped it 5 times in 0.8 s.

## What it does (version 1, Jose's pick B)

Who: interpreters on a phone, one hand, between assignments.

1. Scrolling down shrinks the bar instead of collapsing it: 46 px tall
   instead of 58, icons only, all five tabs still there and one tap each.
   The glass, the sliding lens and Dr. Smiley stay; he shrinks with it.
2. No timer: the bar only changes when you scroll.
3. It takes a real scroll: 60 px down in one go to slim it, 30 px up to
   bring the names back.
4. Full at the top of a page and at its bottom (the last 24 px), and the
   bounce past either end is ignored, so it never flickers there.
5. Steady around a tap: for 0.8 s after a new screen opens or you touch the
   bar, scrolling doesn't change it.
6. Team Chat: the same rules on the thread's own scrolling.
7. Reduced motion: it changes at once.

## Not in version 1

- No bar that slides with your finger (Chrome's way): two states read
  calmer one-handed.
- No hiding the bar completely.
- No setting to turn the slimming off.
- The desktop sidebar is unchanged.

## How others do it

iOS 26 tab bars (Music, Safari; `tabBarMinimizeBehavior(.onScrollDown)`)
shrink on a deliberate scroll down and come back on a scroll up, with no
timer; minimized, they keep only the current tab. Safari brings its bar back
at the bottom of a page. Chrome slides its toolbar with the scroll. Where the
Hub does better: slim keeps every tab, so going anywhere is still one tap.

## Measured after (iPhone size, test copy)

5 s untouched at the top of Home: stays full. A 40 px nudge: no change. A
real scroll: slim, 46 x 298 px, each tab 58 x 40 px and takes its own tap.
20 px back up: no change; 40 px: full. One tap on Translate while slim
opens it. At the bottom, six 15-20 px bounces: 0 changes. Team Chat: the
message box moves down with the bar. The move: 26 animations, all
transform or opacity.
