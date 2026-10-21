# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-21, 12:20 UTC, from the chat that built the
HUMC Brain (#113, live as b1021.1147).

## Paste this into the new chat

> Read AGENTS.md, CLAUDE.md, docs/PLAN.md and docs/handoff.md on branch
> claude/knowledge-brain of jvtomax99/Interp. Next job: turn the HUMC Brain
> into "your knowledge brain" (handoff has the plan). Start by checking what
> per-term knowledge data the app already keeps, then tell me in 2-3 lines
> what you'll build and ask me the open questions with buttons.

## Where things stand

- **#113 HUMC Brain: merged, live (b1021.1147).** Double-tap Dr. Smiley's
  head in the Home hello opens `brain/index.html` full screen for everyone.
  It shows the census of `index.html` (118 sections, 1,090 links) as a 3D
  brain plus a 7-figure workup. `docs/features/humc-brain.md` has it all.
- No open PRs from this chat. No check-ins armed.
- This branch (`claude/knowledge-brain`) holds only this handoff and the
  PLAN entry; the new chat builds on it and opens one PR.

## Next: your knowledge brain (Jose's pick, 2026-10-21)

Jose asked what the brain is *for*; the honest answer was "a code map for
whoever writes the code, an easter egg for everyone else". Of three ways to
give it a job (knowledge brain, team brain, code health brain) he picked:

**Your knowledge brain.** Same 3D brain, but about the interpreter, not the
code:
- Regions = the glossary's domains (oncology, cardiology, GI, peds...),
  laid out over the lobes; subgroups cluster inside their parent's region.
- Dots = terms. Brightness = how well *this phone's person* knows the term,
  from what the app already records. Dark = never practiced or often missed.
- Tap a dark region → practice exactly those terms (Daily Drill or Term
  Review scoped to them). Tap a dot → the term card.
- Over weeks the brain lights up: motivation for CoreCHI.
- The figures below become about knowledge too (weakest domains, coverage,
  progress over time) instead of code.

**First step, before any building: find the data.** Unproven so far how
much per-term detail exists. Look at (banner sections in `index.html`):
"Practice record: what you personally know, question by question",
"Term Review: Dr. Smiley's practice sessions" (`saveTermReview`,
`term-reviews/`), "Quiz" and `quiz-history/`, "Daily Drill" (`ih_warmup`),
"Memory trainer". Report which give per-term right/wrong with dates, and
whether they're on the phone (localStorage) or in Firestore per person.

## Open questions for Jose (ask with buttons, recommendation first)

1. Keep the code view as a second tab ("How the Hub is built") or replace
   it? Pick: keep it as a tab; it's done and costs nothing.
2. Still opened by double-tapping his head, or also a visible entrance
   (CoreCHI Practice dashboard)? Pick: both; a useful tool shouldn't be
   hidden.
3. Personal data stays on the phone / the person's own records only. Never
   show one person's gaps to others. (State it; don't ask.)

## Learned this chat, not yet elsewhere

- From a cloud session, `gh pr create` fails (GraphQL blocked): open PRs
  with `gh api repos/jvtomax99/Interp/pulls --input pr.json`, merge with
  `gh api -X PUT .../pulls/N/merge -f merge_method=merge -f sha=<full sha>`.
- On the shallow clone, `--force-with-lease` needs the explicit old sha
  (`--force-with-lease=refs/heads/B:<sha>`), or it says "stale info".
- The harness serves only `/` for our origin; a suite opening another page
  of ours routes it itself (`tests/suites/humc-brain.cjs`).
- `main` moved mid-chat (the `app.css` split, phase 1); rebase before the
  PR, regenerate `brain/data.json` after (`cd tests && node tools/brain-data.cjs`).
