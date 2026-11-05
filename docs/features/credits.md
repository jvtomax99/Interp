# Idea credits

Whose idea a screen was. Jose, 2026-11-05: "Sylvia came up with the idea of
Sound-Alikes, so I'd like to give her credit." Code: `features/credits.js`;
styles: the "Idea credits" block at the end of `app.css`; rules:
`hub-credits` in `firestore.rules`; check: `tests/suites/credits.cjs`.

## What it does

- A credited screen shows a small purple tag under its title ("Sylvia's
  idea", "Written by Ana", "Spanish checked by Ana", "Tested by Luis").
- Tapping the tag, or double-tapping the title, opens the card: an initial,
  "The idea behind Sound-Alikes", the name, what they did, their own words
  (optional, in IBM Plex Serif because it is quoted speech), "Credited by
  Jose · Nov 5, 2026", Close. A single tap on the title does nothing.
- An owner (`isHubOwner()`: this phone joined with the owner code) who
  double-taps a title with no credit gets **Give credit**: name, their
  words, what the credit is for (the idea, wrote the content, checked the
  Spanish, tested it), Save. On a credited screen the owner's card has
  **Edit**, and the sheet has **Remove**.
- A teammate double-tapping an uncredited title gets nothing.

Picked from four mockups (Jose, 2026-11-05: "A: line + card"). The others
were a banner that fades, a Dr. Smiley spotlight with confetti, and the
card with the spotlight the first time. Double-tap alone was rejected as
the only way in: a credit nobody finds isn't much of a credit.

## How it works

- **Which screen.** The title is the first heading in `#content`, when it
  sits in the screen's own head: `#content > .section-head h2` or the
  Doctors list's `.hub-head h1`. That covers Sound-Alikes, False Friends,
  CoreCHI Practice, Term Review, Translate, the Memory trainer, Provider
  Pictures, Training & Events, Code of Ethics, Recent Updates, Doctors.
  Not Home, Team Chat, Ask the Hub, the glossary domains or the 3D Body
  (their heads are built differently; not in this version).
- **The key is the title.** "Sound-Alikes" -> `sound-alikes`
  (`creditKeyOf`: accents folded, anything else to `-`, at most 40
  characters). So a group's drill ("Sound the same") shows no tag, while
  the all-sets drill, titled "Sound-Alikes", does. Renaming a screen
  orphans its credit; give it again under the new title.
- **Drawing the tag.** `creditDecorate()` marks the title (`.credit-title`,
  `data-credit-key`) and puts the tag right after the head. It runs from a
  watch on `#content`'s children (every screen redraw), on `#app`'s
  children (the frame is rebuilt now and then with a new `#content`, and
  the watch moves to it), and whenever the credits change. `creditWatch()`
  is called from `index.html`'s startup, not on DOMContentLoaded, which
  waits for every deferred script and in the test browser never came.
- **The double-tap.** Touch and pen: two `pointerup`s on the title within
  350 ms and 30 px. A mouse: `dblclick`. The title gets
  `touch-action:manipulation` and no text selection, so the browser
  neither zooms nor selects a word. The click that follows the second
  touch lands on the card's backdrop the instant it appears; backdrop
  clicks in the first 450 ms are ignored, or the card closed itself.
- **Data.** `hub-credits/{key}` = `{ section, name, role, words, by, at }`
  (`role` one of `idea`, `content`, `spanish`, `testing`; `words` up to
  300 characters; `by` is `whoAmI()`; `at` is ms). One document per
  screen, not a shared blob. Everyone listens (`startCredits`, in the
  `hubAuthReady` list); the phone keeps a copy in `ih_credits` so the tag
  is there on the first paint.
- **Saving.** Optimistic: the tag changes at once, the write goes in the
  background, and a refusal puts the old state back with a toast ("The
  credit was not saved: the database refused it.").
- **Rules.** The team reads (`team()`); only `isOwner()` creates, updates
  or deletes, with the fields and sizes above checked (`validCredit`).
  Until Jose publishes the rules file, Firestore refuses the collection:
  no tags appear and an owner's save is taken back. Not yet run in the
  Firebase emulator.

## Not in this version

A thanks button or count; photos; more than one person per screen;
credits on single terms or on Home, Chat, Ask, the glossary domains;
telling the person they were credited; a page listing every credit.

## User Guide

Answer `credits` ("Whose idea was this screen?", Working with your team)
and the first New lately card.
