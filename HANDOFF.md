# HANDOFF, 2026-11-25

## Paste this into a new chat

Read HANDOFF.md, then do the consistency pass: item 2 under Next in docs/PLAN.md. Start by showing me the corner scale on three screens at phone size, before applying it anywhere.

## The goal and the exact next step

Jose asked for an audit of everything that makes the Hub look thrown
together, then said "All" to the four things left. Two are done or
handed to him; two are queued in `docs/PLAN.md` under Next:

1. **Next, the pick: the consistency pass** (Next, item 2). First step:
   read `DESIGN.md` and `docs/design-rules.md`, propose a short `--r-*`
   corner scale from the counts in `docs/FACTS.md` ("Corner sizes"), and
   send Jose before and after screenshots of three screens at phone size
   (Home, a glossary domain, Doctor Prep). Apply it everywhere only after
   his OK. It is a visual change on most screens.
2. **Then: the plan for smaller files** (Next, item 3). A plan for him to
   OK, no code first.

## What is merged, what is open

- Merged and live: #282 the front door (build b1125.0024), #283 the long
  dashes (build b1125.0927).
- Open: #284, the AI is asked not to write long dashes. Waiting on
  GitHub's checks, then Jose's "push". If this file is on `main`, it was
  merged: confirm the bump commit and Vercel's status as `CLAUDE.md` says.

## Open questions for Jose

- **Make the repository private?** He was given the steps on 2026-11-25
  (Settings, General, Danger Zone, Change visibility). Only he can do it.
  Ask whether he did; nothing in the code depends on it.
- **Buy a name** to replace `interp-six.vercel.app`? The five places to
  change are listed under Later in `docs/PLAN.md`.
- **Read the reworded False Friends and Code of Ethics lines** on his
  phone. He pushed #283 without saying he had read them.
- Not confirmed from a cloud session: that a made-up address on the live
  site shows `404.html`.

## Decisions from this chat

- No long dash in on-screen wording, enforced by `site-front.cjs`. The
  allowed exceptions are in `docs/FACTS.md`, "Long dashes".
- A False Friend's `means` puts its short form before "; " or ": ".
- The link card's tagline, "The right word, between assignments.", was
  written by the AI, not Jose. He has seen it and not objected.

## Learned, not in the notes yet

- The full check run takes about 40 minutes on the cloud machine, not 8.
  Run it in the background with a 60 to 70 minute limit, or it is cut off.
- The tests' Playwright needs the link in `docs/FACTS.md` ("The cloud
  machine's Chromium...") made once per machine before any browser suite.
- GitHub's own run of the checks takes about 9 minutes and is the faster
  proof for a small change.

## Files to look at first

`docs/PLAN.md` (Next, items 2 and 3), `DESIGN.md`, `docs/design-rules.md`,
the "Visual refinement" block at the end of `app.css`, and
`tests/suites/type-tokens.cjs` as the model for a corner-scale check.
