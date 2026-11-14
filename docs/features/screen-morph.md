# Screen morph

Written 2026-11-14. Code: `index.html`, banner "Screen morph" (just above
`setCategory`); styles: `app.css`, section "Screen morph"; check:
`tests/suites/screen-morph.cjs`. Keep this in step with the code.

## What it does

On the All domains screen, tapping a domain tile lifts the tile's pin and
name off the tile and carries them, growing, into the banner of the domain
page that opens. The top bar's Back button sends them home to the tile. The
rest of the screen cross-fades underneath; the top bar, the tab bar and Dr.
Smiley hold still.

Who for: everyone, on the trip they make most (tiles to a domain and back).
It tells the eye where the page came from, which a fade does not.

## What it does not do (this version)

- Doctor cards. A doctor's page is an overlay with its own entrance, so its
  morph is a separate step (in `docs/PLAN.md`, Next).
- Home's rails and cards, sheets, the opening, the tab bar's own move, Dr.
  Smiley. Their motion is untouched.
- The phone's own back swipe. The phone already animates that, and a second
  animation on top fights it. Only the on-screen Back button morphs.
- A tile that is off screen after Back restores the scroll, a domain shown
  as a heading (searching, Slang) and subgroups: no pair, so the screen
  just cross-fades.
- No library. It is the browser's View Transitions
  (`document.startViewTransition`).

## How it is built

`morphNav(from, to, go)`: `from` is the pairs to name on the screen being
left, `to()` returns the pairs on the new screen, `go` is the unchanged
navigation call. The browser photographs the old screen, calls `go`, then
animates each same-named pair (`hub-pin`, `hub-name`) from its old box to
its new one. Timing is the look's own: the screen value, .588s on
`--spring0`; the cross-fade under it .38s on `--ease`.

Rules, each one a mistake made while building it:

- **`go` always runs, once.** No support, Reduce Motion, Dr. Smiley's
  Still, a hidden page, a failed snapshot: the navigation still happens,
  plainly.
- **`setCategory` is never wrapped.** The browser calls `go` one frame
  late, and many callers of `setCategory` read the new screen on their next
  line. Only a tap with nothing left to do afterwards comes through
  `morphNav` (the tile's `onclick`, `goBack`).
- **Order.** `setCategory` and `navigateBack` start with `morphFlush()`,
  which runs a navigation still waiting on its transition first. Without
  it, a tile tap followed at once by Back ended on Home with the wrong Back
  stack (measured, then fixed).
- **Name only the pair.** A named element is photographed alone and drawn
  above the page. Naming the banner covered the search row that overlaps
  it; naming the tab bar or the search row (glass) left them with nothing
  behind to blur, so they went dim. Bars stay still by being part of the
  page's own picture.
- **Names are inline and wiped** when the trip ends; two elements with one
  name make the browser drop the whole transition ("Snapshot capture
  failed").

## Compared with

- Apple's zoom transition (iOS 18; WWDC24 session 10145,
  developer.apple.com/videos/play/wwdc2024/10145): the same idea, and it
  can be grabbed and dragged mid-way. Ours cannot be dragged; a tap during
  the trip is ignored until the page settles (the browser's rule).
- Material's "container transform": its pages would not load for the
  helper that read them, so nothing is claimed from it here.
- Where ours can be better: only the two things the eye is on move, at the
  app's one spring, so it stays quick; many apps grow the whole card.

## Not proven

- Smoothness on a real iPhone. Everything here was measured in the cloud
  machine's Chromium. iPhones need Safari 18.0 or newer (WebKit's release
  notes for 18.0); older ones keep the plain fade.
- Safari 18.3's notes list a fix to how the transition layer stacks; not
  checked what 18.0 to 18.2 show.
