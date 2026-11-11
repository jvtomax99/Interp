# Rules map: where every rule will live (2026-11-11)

A working list for shortening `CLAUDE.md` and `AGENTS.md`. Nothing has been
edited yet. Deleted once the shortening is merged.

**Sizes now (measured):** `CLAUDE.md` 34.5 KB, `AGENTS.md` 30.6 KB,
`docs/PLAN.md` 13.7 KB (4.4 KB of it is "How a session runs").

**The idea, in four lines:**
- `AGENTS.md` holds every rule that any tool must follow, once, in short form.
- `CLAUDE.md` holds only what is Claude's alone (helpers, tool names, cloud notes).
- `docs/PLAN.md` holds the whole handoff procedure, once (today it is in three files).
- Long detail and the "why" stories go to the note that owns them; the rule stays behind as one line.

"Both" below means the rule is written in both files today. "Short" means
the wording is cut but the meaning kept. Rules marked **(moves)** leave the
two files for a note; each keeps a one-line pointer in `AGENTS.md`.

## A. How work is run and handed off

| # | Rule | Now in | Will live in |
|---|---|---|---|
| A1 | `AGENTS.md` wins over `CLAUDE.md`; change a shared rule there first; never edit it without Jose's OK | Both | `AGENTS.md` (top), one line in `CLAUDE.md` |
| A2 | One pull request = one phase from `docs/PLAN.md` (plan, do, test, update the plan, open a pull request) | Both, PLAN | `AGENTS.md`, one line; steps stay in `PLAN.md` |
| A3 | New-session triggers (150k or 50%: finish the step, hand off; 300k or 75%: now; over 100k with an unrelated task or after an hour away); a new session costs 20k to 40k; tools with no token count estimate | Both, PLAN | `PLAN.md` only **(moves)** |
| A4 | At a trigger: write `HANDOFF.md`, ask once with buttons ("Start a new session" first, "Keep going" second) over a short summary; a new chat only when he picks it; on "Keep going" no asking until the next trigger; past 75% warn once and write it anyway (a full session just stops) | Both, PLAN | `PLAN.md` only **(moves)** |
| A5 | What `HANDOFF.md` holds; overwrite it; commit and push it in a cloud session; delete it once its work is done; `docs/handoff.md` is older notes, left alone | Both, PLAN | `PLAN.md` only **(moves)** |
| A6 | Starting a new chat: a fresh two-part summary (now, before); the new chat opens with the same two parts, its title names its focus, it reads `HANDOFF.md` first and confirms the next step | Both, PLAN | `PLAN.md` only **(moves)** |
| A7 | When a chat is done, say "Archive this chat" | Both, PLAN | `PLAN.md` only **(moves)** |
| A8 | Session start: read `AGENTS.md`, `HANDOFF.md` if there is one, `docs/PLAN.md`, and only the short map of `docs/ARCHITECTURE.md` | Both, PLAN | `AGENTS.md`, one line |
| A9 | "Checked off" means the phase is in `docs/PLAN-done.md`; decisions and measurements go in `docs/FACTS.md`; search it before measuring or retrying; neither is read whole | CLAUDE, PLAN | `PLAN.md` only (already there) |
| A10 | Cleanup check after a phase (3 phases or 30 days since "Last audit" in `docs/CLEANUP.md`: offer the audit with buttons) | CLAUDE | `PLAN.md`, a step in "How a session runs" **(moves)** |
| A11 | `SPEC.md` says what, `docs/PLAN.md` the order; what `SPEC.md` contains; keep it current; a request not in it or on "Not in v1": say so and ask "now, or Later?"; update it when Jose corrects you | Both (parts) | `AGENTS.md`, short |
| A12 | Keep `docs/ARCHITECTURE.md` short and current; update it when the structure changes | CLAUDE | `AGENTS.md`, one line |
| A13 | In `index.html`, navigate by the banner comments; never read the whole file for one section | CLAUDE | `AGENTS.md`, one line |

## B. Branches, commits, merging

| # | Rule | Now in | Will live in |
|---|---|---|---|
| B1 | Never commit straight to `main`; own branch, plain name, small commits, plain messages that say what changed | Both | `AGENTS.md` |
| B2 | Fetch `main` before writing and again before pushing; if it moved, read what changed | Both | `AGENTS.md`; the stale-copy story, one clause |
| B3 | Into `main`: a pull request with a short summary, the "Done when" check and screenshots; then Jose's "push"; nothing merges without him | Both | `AGENTS.md` |
| B4 | Never without asking (and first explain what it does and what can't be undone): force push, deleting a branch with unmerged work, rewriting history, changing repo settings | Both (the "explain first" part only in CLAUDE) | `AGENTS.md` |
| B5 | Never commit secrets, keys or `.env` files | Both | `AGENTS.md` |
| B6 | After a merge, one line on how to undo it | Both | `AGENTS.md` |
| B7 | Never hand back a whole rewritten file to upload | AGENTS | `AGENTS.md` |
| B8 | Never resolve a conflict with `git checkout --ours`; hunk by hunk; then confirm the four files are still loaded in `index.html` (the "confirm" part only in CLAUDE) | Both | `AGENTS.md`, with its story (it stops a repeat) |
| B9 | Warn before committing a file over 100 MB | CLAUDE | `AGENTS.md`, one line |
| B10 | The repo is public: paid raw assets can't be committed (`docs/assets.md`); making it private is Jose's call | CLAUDE | `AGENTS.md`, one line |
| B11 | Ask first before: deleting data or files, changing logins or accounts, pushing to `main`, deploying, anything that costs money; never delete anything he hasn't approved | CLAUDE, PLAN | `AGENTS.md` |
| B12 | A cloud session uses the `claude/...` branch it is handed | CLAUDE | `CLAUDE.md` |
| B13 | The record of two tools pushing over each other (the three-commit history block) | AGENTS | `docs/FACTS.md` **(moves)**; the rules it led to stay |

## C. Where a change goes

| # | Rule | Now in | Will live in |
|---|---|---|---|
| C1 | Other tools edit `home-polish.css`, `home-polish.js`, `pin-icons.js`: put changes there wherever they can hold them | CLAUDE | `AGENTS.md` |
| C2 | The short table (Home look, top bar and tab bar, overlay, Home behaviour, pins, `app.css`, guide, the lists, `atlas/`, notifications, the brains, "everything else") | Both | `AGENTS.md`, one table |
| C3 | The 22 feature files, each with its function names | Both (names only in AGENTS) | `AGENTS.md` keeps one row ("a feature with its own file: `features/<name>.js`, styles in `app.css`") and the 22 names; the function names **(move)** to the full file map in `docs/ARCHITECTURE.md`, which already lists them (checked for three) |
| C4 | A new feature file joins the three lists in `docs/split-index.md`, the feature list, and `docs/ARCHITECTURE.md` | CLAUDE | `AGENTS.md`, one line |
| C5 | `app.css` is the stylesheet; never a `<style>` block in `index.html`; `home-polish.css` stays linked after it | AGENTS | `AGENTS.md`, short |
| C6 | Feature files load before `index.html`'s script: top-level declarations only; a listener added at load guards with `typeof`; `tests/suites/load-order.cjs` checks it. (The stale "Features are moving out" wording is fixed: the split is finished.) | AGENTS | `AGENTS.md`, short |
| C7 | The overlay files only cover Home; say so rather than inventing a place | Both | `AGENTS.md`, once |
| C8 | Match specificity, do not escalate it; then measure that press, focus and hover still fire | Both | `AGENTS.md`, once, with the press-glow story (it stops a repeat) |
| C9 | No root package list; `tests/` and `promo/` each have their own `npm install` | CLAUDE | `AGENTS.md`, one line |
| C10 | Read the feature note in `docs/features/` for what you touch; update it in the same commit | Both | `AGENTS.md`, once |

## D. Deploying and checking

| # | Rule | Now in | Will live in |
|---|---|---|---|
| D1 | Merging into `main` is going live; Vercel deploys only a "Bump version" commit; no build step; a skipped commit shows as canceled and that is normal; if the bump fails, re-run the workflow | Both | `AGENTS.md`, once; the 10 GB story to `docs/FACTS.md` |
| D2 | Never edit `BUILD_ID`, `BUILD_TIME` or `CACHE_VERSION` by hand; a GitHub Action moves them; what each is for | Both | `AGENTS.md`, once |
| D3 | No bump for pushes that change only `docs/`, `tests/`, `.github/`, `.claude/`, `*.md` or the Firebase rules; a changed `api/*.js` ships in the same push | Both | `AGENTS.md`, once |
| D4 | After merging, confirm the bump commit's `BUILD_ID` is live before reporting success; don't ask Jose to check what you can check | Both | `AGENTS.md`, once |
| D5 | From a cloud session the site is blocked: read Vercel's status on the commit through GitHub (the `curl` line) | CLAUDE | `CLAUDE.md` |
| D6 | No preview links (branches don't deploy); the preview is phone-first screenshots, the checks, and a "try this" list | Both (short in AGENTS) | `AGENTS.md`, once |
| D7 | The checks are in `tests/` (`node run.cjs`, about 8 minutes); GitHub runs them on every pull request and push to `main`; "App checks result" is the line to read; a notes-only change skips them | Both | `AGENTS.md`, once; the six shares and `.vercelignore` detail stays in `tests/README.md` |
| D8 | Add or update a check with any change to what a suite covers; never weaken one to get green; a new suite needs its line in `run.cjs` | Both (parts) | `AGENTS.md` |
| D9 | The four checks before pushing `index.html` (syntax, run once against a stub, phone screenshot first, measure with numbers) | Both | `AGENTS.md`, once |
| D10 | `tests/suites/deploy-rule.mjs` holds the deploy rule and the bump's title together | CLAUDE | `AGENTS.md`, a clause in D1 |

## E. Data and team access

| # | Rule | Now in | Will live in |
|---|---|---|---|
| E1 | The list of Firestore collections | CLAUDE | `docs/ARCHITECTURE.md` **(moves)**; its "How data moves" already points here |
| E2 | Terms are one document each; never a shared blob again | CLAUDE | `AGENTS.md`, one line |
| E3 | Migrations: idempotent, gated on a flag in `terminology-meta/migrations` (`{merge:true}`, never on `categories`), awaited in `loadData()`; delete one once its flag is `true` live | CLAUDE | `AGENTS.md`, short |
| E4 | The Hub is locked (since 2026-11-07): anything not a joined phone or team account is refused with no error; a new collection without its rule line fails | Both | `AGENTS.md`, once; what was checked before locking and the undo go to `docs/features/team-access.md` |
| E5 | A new Firestore collection needs an `if team()` line in `firestore.rules`, and Jose pastes the rules in the console | AGENTS | `AGENTS.md` |
| E6 | A new database call at startup goes inside `hubAuthReady.then(...)` | AGENTS | `AGENTS.md` |
| E7 | The Firebase SDK loads in the background; `db`, `storage`, `hubAuth` are `null` until `firebaseReady`; never a plain `<script src>` for it | Both | `AGENTS.md`, once |
| E8 | `atlas/` is walled off: no `allow-same-origin`, only checked `postMessage`, a message never navigates, runs code, writes data or supplies text; source changes through the patch; a Spanish name only with a source | AGENTS | `AGENTS.md`, short (a safety rule; it stays whole in meaning); detail already in `atlas/README.md` and `docs/features/3d-body.md` (to confirm when editing) |
| E9 | Each AI job gets the cheapest model that does it well; change a model in one place; raise effort before a bigger model | AGENTS | `AGENTS.md`, short |
| E10 | A write goes through `queuedWrite()`, never a bare `.set()` | AGENTS | `AGENTS.md`, short |
| E11 | An account is optional; Dr. Smiley's remembered preferences stay on the phone: never synced, never mixed into `hub-lessons`, never a free-text field; team points are never one person's progress | AGENTS | `AGENTS.md`, the four "nevers" in two lines; the rest **(moves)** to `docs/features/email-sign-in.md` and `ask-memory-followups.md` |
| E12 | A conversation is not a preference: it lives in `ASK.convo`, never in storage or Firestore; only an explicit tap saves a preference; a correction is "not checked", never a source; an unclear follow-up asks one question; never resolve to an entry the phone didn't send; a stopped request changes nothing | AGENTS | `AGENTS.md`, two lines; detail **(moves)** to `docs/features/ask-memory-followups.md` (already covers `ASK.convo`) |
| E13 | Term Review is the one practice record; judged only against the glossary; a maybe-valid answer goes to self-review; a result counts only once stored; no claims of mastery | AGENTS | `AGENTS.md`, two lines; detail in `docs/features/term-review.md` |
| E14 | The Daily Drill uses only written, checked material; never generate a line; never store what someone typed | AGENTS | `AGENTS.md`, one line; detail in `docs/features/daily-drill.md` |
| E15 | The events watcher has its own login (`FIREBASE_SERVICE_ACCOUNT` in Vercel); the key is never in the repo, the database, a chat or a log | Both | `AGENTS.md`, once; how the login works and the rejected idea go to `docs/FACTS.md` |
| E16 | A new `api/*.js` endpoint that spends money starts with `allowTeam`, and the app sends `hubAuthHeaders()` | AGENTS | `AGENTS.md` |

## F. Things that broke before (gotchas)

All of these apply to every tool, so they go to `AGENTS.md`, one or two
lines each. Most are only in `CLAUDE.md` today.

| # | Rule | Now in | Will live in |
|---|---|---|---|
| F1 | `:hover` never fires on touch: press feedback is `:active` plus `.is-pressed` (about 260 ms); a new touch control joins the `LIFTS` list; a domain family card is marked as a whole | Both (parts) | `AGENTS.md` |
| F2 | Never under 16px on an input (iOS zooms) | CLAUDE | `AGENTS.md` |
| F3 | Visual separation is not tap separation: check `elementFromPoint` | CLAUDE | `AGENTS.md` |
| F4 | Back navigation: going to a subgroup calls `setCategory()`; a heading tap only opens in place; "Up to [Parent]" is up, Back is history; do not simplify it | Both (parts) | `AGENTS.md` |
| F5 | Subgroups start collapsed; All domains at rest is colour tiles; a search or Slang filter opens matching sections; `domainRenderOrder()` | Both (parts) | `AGENTS.md`, short |
| F6 | Cache-first startup: the first load after a deploy is slow, and that is expected | CLAUDE | `AGENTS.md` |
| F7 | Pins are pre-cut files (`pins/<key>.webp`); to change one, replace its file | CLAUDE | `AGENTS.md`, a clause in the table (C2) |
| F8 | Term cards skip layout off screen: anything that jumps into the list adds `cv-all` to `#content` first | CLAUDE | `AGENTS.md` |
| F9 | An entrance animation never fills forwards on anything with a press or hover rule: use `backwards` | CLAUDE | `AGENTS.md`, with its story (it stops a repeat) |
| F10 | No `:has()` for app state on `body` or big containers; set a class instead (`overlayFlags`) | Both | `AGENTS.md`, once |
| F11 | A rule on a body state class ends on a class, never a bare tag | AGENTS | `AGENTS.md`, short |
| F12 | `ih_myName` holds the display name | CLAUDE | `AGENTS.md`, a clause |
| F13 | Sidebar and tab bar both switch at 900px | AGENTS | `AGENTS.md` |
| F14 | When a bug survives a fix, ask for a concrete reproduction path | CLAUDE | `AGENTS.md` |

## G. Design and Dr. Smiley

| # | Rule | Now in | Will live in |
|---|---|---|---|
| G1 | Read `DESIGN.md` and `docs/design-rules.md` before any visual change; change `DESIGN.md` in the same commit; take values from it or the code, never from memory; if `design-rules.md` is missing, stop and ask | Both | `AGENTS.md`, once |
| G2 | Jose's bar is "high end", "dynamic", "alive"; inherit the system, never invent a second one | CLAUDE | `AGENTS.md`, one line |
| G3 | Speed never costs the look: cheaper, never smaller, shorter or stopped; ask first with numbers and a screenshot if a gain needs a visible change | Both | `AGENTS.md`, once |
| G4 | Use the tokens (`--fs-*`, `--sp-*`, `--tr-*`, `--ic-*`), not one-off values; where the scale lives | Both | `AGENTS.md`, once |
| G5 | Inter is the interface face; serif only for quoted speech; the Home hello is the one exception (Parisienne, Lora italic) and doesn't spread; the name pen is off with Still and reduced motion | AGENTS | `AGENTS.md`, short |
| G6 | The Home banner photo is set per mode; Jose's brief (tree, sign readable in its own band, pool); change the band and the photo position together | CLAUDE | `DESIGN.md` **(moves)**, which already has "how the Home hello is built"; one-line pointer in `AGENTS.md` |
| G7 | Dr. Smiley is never moved by a paused animation seeked by hand; write the value each frame (`placeFace`) | AGENTS | `docs/features/dr-smiley.md` **(moves)**; it already has this |
| G8 | His size is one number per place (`--ds-k`, `--hw-size`); never the offsets inside him; his pivot; one fixed place in the greeting; never resized for a name (`fitWave`) | AGENTS | `docs/features/dr-smiley.md` **(moves)**; it already has this |
| G9 | His gestures use only drawn frames, a tilt and a lift; never slide him sideways; the one squash (cheer and greet, Lively, 4% at most) is not added elsewhere or made bigger without showing Jose; new gestures go in `DR_PERF` | AGENTS | `docs/features/dr-smiley.md` **(moves)**; it already has this |
| G10 | Read `docs/features/dr-smiley.md` before touching his face, size or motion | CLAUDE | `AGENTS.md`, two lines that keep the three hard "nevers" of G7 to G9 by name |
| G11 | Assets: read `docs/assets.md` first and follow it; if missing, stop and ask | CLAUDE | `AGENTS.md`, one line |

## H. The User Guide

| # | Rule | Now in | Will live in |
|---|---|---|---|
| H1 | Every visible change updates the User Guide in the same commit: a new answer in `GUIDE_TOPICS`, wrong answers rewritten, `GUIDE_STEPS` and `GUIDE_COACH` kept in step, a "New lately" card for a new feature (oldest drops off), `GUIDE_SECTIONS` only for a new area; changes to `home-polish.*` or `pin-icons.js` count too | Both | `AGENTS.md`, once |
| H2 | Say in the report what changed in the guide; say in the commit message when nothing needed to | Both (parts) | `AGENTS.md` |

## I. Working with Jose

| # | Rule | Now in | Will live in |
|---|---|---|---|
| I1 | Who this is for: Jose and the interpreter team at HUMC (41 phones), phones, one-handed; the live address and repo; he directs, the AI writes and tests; for a big feature remind him to check with the team | Both | `AGENTS.md`, once |
| I2 | Plain words, no git or CI jargon; "working on it" while running, "done" every time | Both | `AGENTS.md`, once |
| I3 | He works from a phone: one step at a time, screenshots over description | Both | `AGENTS.md`, once |
| I4 | Reports: status very short; explanations in full plain sentences; after a meaningful change, 2 or 3 sentences on what and why | Both | `AGENTS.md`, once |
| I5 | A question with options gets buttons, the pick first; always say your recommendation and why; where there are no buttons, list them plainly | Both | `AGENTS.md`, once |
| I6 | Ambiguous request: one clarifying question first. Evidence before confidence | Both | `AGENTS.md`, once |
| I7 | Challenge him: say when an idea is weak and what's better, name the biggest risk, skip small stuff, then build it his way | Both | `AGENTS.md`, once |
| I8 | New feature: the spec first (what, who, "not in this version"; its "Done when" line in `SPEC.md`); look at 2 or 3 similar tools from primary sources; new ideas go to "Later" unless approved | Both | `AGENTS.md`, once |
| I9 | Big feature (a new screen, a new kind of stored data, a new outside service): the plan in plain words with assumptions listed, and his OK before code; in a scheduled run, small changes only | CLAUDE | `AGENTS.md`; "use plan mode" stays in `CLAUDE.md` |
| I10 | Not building: no patient information, not a replacement for hospital systems, no app-store app; flag before any work | Both | `AGENTS.md`, once |
| I11 | Show it works: never "fixed", "works" or "done" without running it; say what was checked or "not verified" | CLAUDE | `AGENTS.md` |
| I12 | Every finished job: a preview (before/after screenshots, phone first), then a phone notification; only when there is something to review or decide | Both | `AGENTS.md`, once |
| I13 | "Push" is a phone notification and a button ("Push" first, "Not yet" second); on "Push" the agent merges it itself and confirms it is live; never only a link | Both | `AGENTS.md`, once |
| I14 | A phone notification when something goes live, with the change and its `BUILD_ID` | Both | `AGENTS.md`, once |
| I15 | Settings come ready to paste: one code block per field, under its name and where it goes; exactly the text; a secret is never asked for in chat (`YOUR_VALUE_HERE`) | Both | `AGENTS.md`, once |
| I16 | Installs: project packages without asking, mentioned and added to the package list; anything else asks with buttons ("Install" with what, size and what it buys; "Not now"); never work around a missing tool silently; to keep one, the setup-script line; in a scheduled run, skip and say so | Both | `AGENTS.md`, once |

## J. Claude only (stays in `CLAUDE.md`)

| # | Rule | Now in | Will live in |
|---|---|---|---|
| J1 | Helpers: the main model plans, decides, writes real code and reviews; `scout` and `test-runner` (Haiku), `builder` (Sonnet, exact text edits only); don't delegate a one-line search; check what a helper reports | CLAUDE (twice) | `CLAUDE.md`, once |
| J2 | Review before the pull request: a separate reviewer helper that hasn't seen how the code was written; tell Jose in 2 or 3 lines what it caught | CLAUDE | `CLAUDE.md` |
| J3 | Which tool does what: buttons are `AskUserQuestion`, preview files `SendUserFile` (proactive), the phone `PushNotification`, the merge `merge_pull_request` with the head SHA pinned | CLAUDE | `CLAUDE.md`, one short list |
| J4 | Keep the session light: read only the parts needed; show only the lines of output that matter; big searches go to a helper | CLAUDE | `CLAUDE.md` |
| J5 | No ultracode or max effort unless asked | CLAUDE | `CLAUDE.md` |
| J6 | Keep `CLAUDE.md` lean: suggest a one-line addition for a lasting decision, remove what no longer applies | CLAUDE | `CLAUDE.md` |
| J7 | Taste skill: saved in `.claude/skills/taste/`; in a cloud session use the installed Playwright | CLAUDE | `CLAUDE.md` |
| J8 | Refactor prompt: `docs/refactor.md`, run on "Refactor: CLEANUP.md items ..." | CLAUDE | `CLAUDE.md` |
| J9 | Blender installs from PyPI as `bpy` (about 400 MB) because its site is blocked | CLAUDE | `CLAUDE.md`, one line |
| J10 | `index.html` is 1.0 MB and about 18,400 lines; its split is finished | Both | `AGENTS.md`, one clause; out of `CLAUDE.md` |

## What leaves the two files altogether

- **Dates and names on rules** ("Jose, 2026-10-24"): dropped from the rule
  lines. Each stays findable in git history and, where the date matters,
  in `docs/FACTS.md`.
- **"Why" stories**, except the three that stop a repeat mistake (the press
  glow, `--ours`, the entrance animation): to `docs/FACTS.md`.
- **Nothing else.** No rule is being removed. If a line above reads as a
  rule you want gone or changed, that is a separate decision.

## Expected sizes (a guess until the edit is done)

`AGENTS.md` about 17 KB, `CLAUDE.md` about 5 KB, `docs/PLAN.md` about the
same as now. Together about 22 KB of rules against 65 KB today.
