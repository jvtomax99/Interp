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

**Doctor cards (step 2).** In the Doctor Directory, tapping a card carries
its photo (or specialty pin) and the name into the top card of the
doctor's page (`.dp-hero`). The page's round back arrow, and the top bar's
Back while the page is the top layer, send them home to the card. The
page is an overlay: it opens with `openDoctorDirDetail` and closes by
losing `.show`, so `morphOpenDoctor` and `morphCloseDoctor` wrap exactly
those, and only from a tap (the card's own `onclick`, the arrow, `goBack`).
The page's own slide-up and its backdrop's fade are held back by
`.dp-flown` on the overlay while it opened by a trip: the cross-fade under
the pair is the entrance. The mark stays on until the page next opens from
closed, because a class that came off would restart the entrance it held
back. Home only to a card on screen; otherwise the page closes at once, as
it always did (no cross-fade).

A tap never waits on the flight. If the browser has not taken its snapshot
within `MORPH_WAIT` (300 ms), `morphNav` drops the flight and navigates at
once, as a plain open (no `.dp-flown`, so the page keeps its slide-up).
(`doc stall` in `tests/suites/screen-morph.cjs`). The net can only fire
while the page is free: Linux WebKit, the engine GitHub's iPhone checks
use, blocks the page about 0.9 s taking the snapshot, for domain tiles
and doctor cards alike, and the flight runs after it. Jose's iPhone shows
no such pause on the domain tiles, so `doctor-page.cjs` checks that a card
opens its page, not how fast the flight is there.

## What it does not do (this version)

- The Recent doctor chips above the directory: they open the page plainly.
  A few lines to add if wanted.
- A doctor's page opened any other way (after editing it, from a search,
  from Doctor Prep): plain, as before.
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
- **A tap during the trip is not lost.** While a transition is on screen
  the browser gives every tap to `<html>`, not to the button under the
  finger (measured: `elementFromPoint` returns `<html>`; `pointer-events`
  on the transition's layer changes nothing). A reviewer caught this: Back
  right after a tile was a dead tap for about half a second. `morphTap`
  hears that tap, ends the trip (`skipTransition`) and sends a click to
  what is really there; Back mid-flight now takes 142 ms in the cloud
  Chromium. Any navigation that arrives also ends a trip (`morphFlush`).
  A tap mid-trip on a text box presses it but does not open the keyboard.
- **A pair only from something on screen** (`morphParts`): a banner
  scrolled away, or a tile off screen after Back, sends no pin.
- **The pair follows the page.** The new screen rises 6px as it fades in
  (`contentFadeIn`) while the pin is in flight; the browser keeps the
  flying pin on the real one (measured: centres within 1px at the end).
- **Names are inline and wiped** when the trip ends; two elements with one
  name make the browser drop the whole transition ("Snapshot capture
  failed").

## Compared with

- Apple's zoom transition (iOS 18; WWDC24 session 10145,
  developer.apple.com/videos/play/wwdc2024/10145): the same idea, and it
  can be grabbed and dragged mid-way. Ours cannot be dragged; a tap during
  the trip ends it and is acted on.
- Material's "container transform": its pages would not load for the
  helper that read them, so nothing is claimed from it here.
- Where ours can be better: only the two things the eye is on move, at the
  app's one spring, so it stays quick; many apps grow the whole card.

- **Doctor's page: entrance held, not removed.** Turning the slide-up off
  with `html.morphing` restarted it when the trip ended (an animation that
  goes from `none` back to its name plays again), so the mark is on the
  overlay and lasts as long as it is open.

## Found while building step 2 (fixed 2026-11-14)

- On a computer, a redraw the app held back while the search box had the
  cursor ran as soon as a doctor's page opened (the focus moved), and it
  rebuilt the screen, which scrolled the list behind the page to the top.
  So the card was off screen to fly home to, and the page closed plainly.
  Fixed in `render()`: a redraw from `scheduleRender` of the screen already
  on show holds `#app` at its height while it is rebuilt, so the scroll
  never moves (putting it back afterwards would stop a glide in progress,
  the "glide" case), and does not autofocus the search box (it was pulling
  the cursor back behind the open page). The "desk" case in
  `tests/suites/screen-morph.cjs` checks it at desktop width.
- Phones had the same jump on any background redraw (data arriving while
  a list was scrolled: 3000 to 0 in Chromium's iPhone mode, before the
  fix); they did not have the held-back one. Not checked on a real iPhone.

## Not proven

- Smoothness on a real iPhone. Everything here was measured in the cloud
  machine's Chromium. iPhones need Safari 18.0 or newer (WebKit's release
  notes for 18.0); older ones keep the plain fade.
- Safari 18.3's notes list a fix to how the transition layer stacks; not
  checked what 18.0 to 18.2 show.
