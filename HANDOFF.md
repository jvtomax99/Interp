# Handoff (2026-11-11): shorten CLAUDE.md and AGENTS.md

**Paste this into the new chat:**

> Read `HANDOFF.md` first (on the branch `claude/shorten-rules`), then
> `AGENTS.md`, `docs/PLAN.md` and the short map in `docs/ARCHITECTURE.md`.
> Tell me in a few short lines what is being worked on now and what was
> worked on before, then confirm the next step with me before starting.
> Plain words, say "working on it" and "done". "Push" is always a button.

**Goal (Jose, 2026-11-11: "Start a new chat to shorten CLAUDE.md and
AGENTS.md"):** make the two rule files much shorter without losing a
rule. Every chat reads both in full before it starts: `CLAUDE.md` is
about 34 KB and `AGENTS.md` about 31 KB. Long rules cost money each chat
and bury the lines that matter.

**What is wrong with them now** (read in full on 2026-11-11):
- They say the same things twice, at length: how work is run and handed
  off, the deploy and version rules, the "where a change goes" table, the
  four checks before pushing `index.html`, the User Guide rule, push and
  phone-notification rules, settings to paste, installs, "match
  specificity", "never `git checkout --ours`".
- `CLAUDE.md`'s "General rules" block at the end repeats much of Jose's
  claude.ai preferences. Whether to cut that overlap is his call, open
  since 2026-11-10: ask him once, with buttons.
- `AGENTS.md` still says "Features are moving out of `index.html`"; the
  split finished 2026-10-25.

**How to do it (proposed; confirm with Jose first):**
1. `AGENTS.md` stays the one place for rules every tool shares (it wins
   where the two overlap, and ChatGPT reads only it). `CLAUDE.md` keeps
   only what is Claude's alone (subagents, session triggers, the taste
   skill, cloud-session notes) and points to `AGENTS.md` for the rest.
2. Before cutting, list every rule in both files, one line each, with
   where it will live afterwards. Show Jose that list, not the diff.
3. Shorten wording, keep meaning: the dated attributions ("Jose,
   2026-10-24") and the "why" stories can move to `docs/FACTS.md` where a
   rule stands without them. Keep a story only where it stops a repeat
   mistake (the press glow, `--ours`, the entrance animation).
4. After the edit, a separate reviewer checks rule by rule that nothing
   was dropped or changed. Last time (#264) that review found 13 dropped
   or changed clauses, so do not skip it.
5. Say the sizes before and after, measured.

**Rules for this job:**
- Jose's ask covers editing `AGENTS.md`, which normally needs his OK. Still
  show him the rule list (step 2) before the pull request.
- Notes only: a change to nothing but `*.md` skips the app's checks and
  deploys nothing. One pull request, his "push" by button.
- I broke a rule on 2026-11-11 with it written in both files (tried to
  overwrite a pushed branch; it was blocked). Length did not help. Aim for
  rules short enough to be read every time.

**Done in the last chat (all merged; app live on build b1111.0136):**
- #266: the first cleanup audit (`docs/CLEANUP.md`) and its low-risk
  items removed. No visible change, no speed or security change.
- #269: the WebKit check that failed now and then. GitHub's test browser
  freezes on the Home hello; Jose's iPhone did not in 30 opens. The check
  now names a browser freeze and opens once more.
- #267, #270: notes.

**Waiting on Jose** (`docs/PLAN.md`): look for `CRON_SECRET` in Vercel
(Settings, Environment Variables; without it anyone can start the events
watcher); a lasting fix for the tests' browser on the cloud machine
(`docs/FACTS.md`, last entry: the tests need one line run by hand first).

**Files to look at first:** `CLAUDE.md`, `AGENTS.md`, `docs/PLAN.md`
("How a session runs" repeats part of both), `docs/PLAN-done.md` (the
2026-11-10 entry on the notes trim, #264).
