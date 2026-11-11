# CLAUDE.md: HUMC Interpreter Hub

`AGENTS.md` (repo root) holds the rules, and it wins over this file. The
line below loads it into every session, so there is no need to open it:

@AGENTS.md

This file adds only what is Claude's alone. When a shared rule changes,
change it in `AGENTS.md` (never without Jose's OK), not here.

At session start, as `AGENTS.md` says, read: `HANDOFF.md` if there is one, `docs/PLAN.md`
(the working list, how a session runs, when to hand off to a new chat),
and the short map at the top of `docs/ARCHITECTURE.md`.

## Which tool does what

- **Buttons:** `AskUserQuestion`, one button per option, the pick first
  and marked "(Recommended)".
- **Preview files:** `SendUserFile` with status `proactive`.
- **Phone notification:** `PushNotification`.
- **His "push":** buttons "Push (Recommended)" then "Not yet". On "Push",
  merge the pull request yourself with `merge_pull_request`, the head SHA
  pinned.
- **Is it live?** From a cloud session the site itself is blocked. Read
  Vercel's status on the bump commit instead:
  `curl -sS https://api.github.com/repos/jvtomax99/Interp/commits/<sha>/status`
  (context "Vercel", "Deployment has completed").
- **A big feature's plan:** use plan mode and wait for his OK.

## Helpers: the main model thinks, cheaper models fetch

The main conversation plans, decides, writes the real code and reviews.
Repetitive work goes to the agents in `.claude/agents/`:

| Agent | Model | Use for |
|---|---|---|
| `scout` | Haiku 5.5 | Finding code and usages, reading a long file or log for the few lines that matter |
| `test-runner` | Haiku 5.5 | Running suites and syntax checks, reporting only failures |
| `builder` | Sonnet 5.5 | Exactly specified text edits only: guide copy, renames, expected counts. Never code logic |

Delegate when a job would pour a lot of text into the main conversation (a
full test run, sweeping `index.html` for every use of a name). Don't
delegate a one-line `grep` or a single small read: a helper starts cold,
so a small job costs more that way. Check what a helper reports before
relying on it; decisions, design and anything touching data or rules stay
with the main model.

**Review before the pull request.** After a phase or big feature, and
before opening its pull request, a separate reviewer helper checks the
changes for bugs, broken behaviour and mismatches with `SPEC.md`, without
seeing how the code was written. Fix what it finds; tell Jose in 2 or 3
lines what it caught.

## Keeping a session light

- Read only the parts of files you need. Show Jose only the lines of logs
  and test output that matter. Big searches and many-file reads go to a
  helper so only its summary comes back.
- No ultracode or max effort unless he asks.
- **Keep this file lean.** Suggest a one-line addition for a lasting
  decision; remove lines that no longer apply. It loads every session.

## Cloud sessions and tools

- A cloud session is handed a `claude/...` branch: use it.
- **Taste skill:** saved in `.claude/skills/taste/` (Senlin's, MIT;
  `SOURCE.md` there says where from). It asks for the Playwright MCP
  server; in a cloud session use the Playwright already installed instead
  (run its `references/extract.js` with `page.evaluate`).
- **Refactor prompt:** `docs/refactor.md`, run when Jose asks for
  "Refactor: CLEANUP.md items ...".
- **Blender's site is blocked**, but it installs from PyPI as `bpy` (about
  400 MB, `pip install bpy`). Ask first, as `AGENTS.md` says for installs.
