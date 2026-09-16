# AGENTS.md — read this before you change anything

Instructions for **any** AI tool working on this repo: ChatGPT / Codex,
Claude, or anything else. Claude also reads `CLAUDE.md`, which has the long
version. This file is the short shared contract. If the two ever disagree,
this file wins.

## The one thing that keeps going wrong

**More than one tool writes to this repo, and both push straight to `main`.**
Recent history, by who pushed it:

```
Claude (git)   Clear the grey haze under the hero
ChatGPT (git)  Restore curved photo fade behind home search
ChatGPT (git)  Apply approved glass hello banner
```

Neither tool is told when the other pushes. Two real failures came from that:

1. Work was reviewed against a stale copy, because `main` had moved eleven
   commits and the tool never re-fetched.
2. The coloured press glow silently died. A `.is-pressed` rule in
   `index.html` was outranked by an `#content.is-home` rule in
   `home-polish.css`. No error — the feature just stopped working, and it
   took measuring six cards' computed shadows to find out why.

So:

- **Fetch `main` before you write anything, and again before you push.**
  If it moved, read what changed before continuing. Do not assume the copy
  you were given is current.
- **Say what you changed, in the commit message.** A real sentence. The next
  tool has no other way to know.
- **Never hand back a whole rewritten file to be uploaded.** Give the edited
  file in place, or the specific block to replace. A whole-file upload
  silently deletes everything the generating tool did not know about.
- **Never resolve a conflict with `git checkout --ours`.** It once wiped the
  `pin-icons` and `home-polish` wiring out of `index.html` in one command.
  Resolve hunk by hunk.

## Where a change goes

| Change | File |
|---|---|
| Home look — greeting, search, rails, cards, tiles | `home-polish.css` |
| Mobile top bar and tab bar | `home-polish.css` (`max-width:900px` block) |
| Domain folder / section overlay styling | `home-polish.css` |
| Home behaviour — hello wave, rail dots, overlay | `home-polish.js` |
| Pin and icon artwork | `pin-icons.js` |
| Everything else | `index.html` |

`home-polish.*` and `pin-icons.js` **only cover the Home screen.** They hold
nothing for the glossary, terms, chat, Doctor Prep, study, quizzes, profile,
settings or the guide — those exist only inside `index.html`. Say so rather
than inventing a place to put them.

**Match specificity, do not escalate it.** `home-polish.css` is written with
ID selectors (`#content.is-home .x`) and loads last, so it beats the inline
CSS. Anything new added there at that strength will quietly disable
`:active`, `.is-pressed` and `:focus-visible` states defined in
`index.html`. Use the weakest selector that works, then check press, focus
and hover still fire — measure them, do not assume.

## Every deploy that touches `index.html`

Vercel auto-deploys on push to `main`. No build step. Three things move
together or returning users get a stale app:

1. `BUILD_ID` in `index.html` (~line 9183, format `bMMDD.HHMM`) — bump it.
2. `CACHE_VERSION` in `sw.js` (~line 29) — bump it.
3. Any changed `api/*.js` ships in the same push.

Then confirm the new `BUILD_ID` is actually live at
https://interp-six.vercel.app before reporting success.

## Before pushing `index.html`

It is one ~13,500-line file with all CSS and JS inline, used mostly on
phones in a hospital. Do not push it unverified.

1. Syntax-check the inline scripts.
2. Run them once against a browser-globals stub — catch runtime errors.
3. Screenshot at **phone width first**, desktop second.
4. **Measure numerically** — computed styles, bounding boxes,
   `elementFromPoint`. Colour overrides and overlapping tap targets have
   both shipped looking fine in a screenshot.

## Who this is for

Jose Vazquez, staff medical interpreter at Hackensack University Medical
Center, and his interpreter team. Spanish/English, installable PWA, used
one-handed between hospital assignments. He directs the product and reviews
from a phone: one step at a time, screenshots over description.
