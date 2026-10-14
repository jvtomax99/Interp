# The companion panel

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**The companion panel (`drPanel`).** Tapping Dr. Smiley in the dock (or his
`#tgSmiley` top-bar button on a computer) no longer leaves the page: a small
Ask the Hub panel grows out of his disc, above him on a phone and below him on
a computer. It is the same `ASK` state as the Ask screen (same turns, same
`ASK.draft`, `submitAsk`), shows the newest question and answer (long ones
scroll), and "Open in Ask" goes to the full screen. Its glass (`.drp-bg`) is a
separate layer whose edges are animated from his button's box; each new
open/close starts from wherever the last one was (`current()`), so quick taps
never jump. He never moves, except that with the keyboard up he and the panel
ride above it together (`--drp-kb`, `body.drp-kb`; `body.drp-open` keeps him
visible through `kb-open`). It closes on Escape, ✕, tapping him or outside, a
page change, a sheet, or him leaving (`drPanel.check()` from
`smileyRider.sync()`); the draft stays. The tab bar doesn't tuck while it's
open. Collapsed states on his button: `.is-busy` (a question out), `.has-new`,
`.has-error`. `renderAskMessages()` redraws it (`drPanelSync`).
