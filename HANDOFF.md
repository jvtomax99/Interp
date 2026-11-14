# HANDOFF (2026-11-14)

**Paste into a new chat:**

> Read `HANDOFF.md`, then start Screen morph step 2 (doctor cards) as
> described there. Confirm the plan with me before writing code.

## Goal and next step

Screen morph, step 2: the same flight for **doctor cards**. Tap a doctor
card in the Doctor Directory and its photo and name fly into the doctor's
page; Back returns them. Jose's "Build it" (2026-11-14) covered tiles and
doctor cards; step 1 (tiles) is live.

Next step (the pick): first ask Jose how step 1 feels on his iPhone
(smooth or not, and whether the flying name crossing the search box for a
tenth of a second bothers him). Then plan step 2 and get his OK.

What step 2 has to solve (from `docs/PLAN.md`, Next): a doctor's page is
an overlay (`openDoctorDirDetail`, `#doctorDirDetailOverlay.show`) with its
own entrance animation, and Back closes it by removing `.show` in
`navigateBack`, not through `setCategory`. So `morphNav` needs the card's
photo and name paired with the page's, and the overlay's entrance held
back during the flight. Read `docs/features/screen-morph.md` first: its
rules (only the pair is named, never glass; `go` always runs once; taps
mid-flight go through `morphTap`) all came from bugs.

## Where things stand

- Merged and live: #273, Screen morph step 1, build b1114.1040 (Vercel
  confirmed "Deployment has completed").
- Open pull requests from this chat: none. Check-ins: none.
- This branch (`claude/modest-clarke-qt5cmd`) was restarted from `main`;
  it holds only this file and the #273 number on the `PLAN-done.md` line.

## Open questions for Jose

- How step 1 feels on his iPhone (not verified on a real phone; dark mode
  was never captured either).
- The repo scan's other picks, not started: typo-proof glossary search
  (uFuzzy), smarter Term Review timing (ts-fsrs), accessibility checks
  (axe-core), and a speech test for auto-mark (Whisper in the page). Detail
  in `docs/FACTS.md`, "Screen morph and the repo scan".

## Learned this chat (already in `docs/FACTS.md`)

- View Transitions: a named element is photographed alone, above the page
  and without its backdrop blur; two elements with one name drop the whole
  transition; the browser runs the update a frame late; during a
  transition every tap goes to `<html>`.
- The tests' Playwright looks for headless shell build 1194; the machine
  has 1243. The symlink in `docs/FACTS.md` (search "1194") is needed in
  each new chat before any browser suite runs.

## Files to look at first

`docs/features/screen-morph.md`, `index.html` banner "Screen morph" (just
above `setCategory`), `tests/suites/screen-morph.cjs`, `index.html`
`openDoctorDirDetail` and `navigateBack`.
