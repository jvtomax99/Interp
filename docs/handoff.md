# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-21, 23:30 UTC, from the chat that built the
knowledge brain.

## Paste this into the new chat

> Read AGENTS.md, CLAUDE.md, docs/PLAN.md and docs/handoff.md on branch
> claude/brain-next of jvtomax99/Interp. Then ask me which knowledge-brain
> improvement to do next (the list is in the handoff), with buttons.

## Where things stand (all merged and live, b1021.2325)

- **#116 Your knowledge brain** (`brain/you.html`): glossary terms as dots
  lit by your own Term Review record; separate from Dr. Smiley's code brain
  (his head opens his only). `docs/features/knowledge-brain.md`.
- **#117 K2 privacy**: `term-reviews` readable/writable only under the
  phone's own `hub-members` name once locked (Jose's pick "by name").
  Jose published the rules in the console. Not yet confirmed by Jose on a
  phone: knowledge brain opens with no warning note, a Term Review answer
  saves. Ask him once if he hasn't said.
- **#119** small live brain at the top of Term Review (`kbMiniHtml`).
- **#120** after a session, its terms light up in the summary's small brain;
  "See it in your brain" opens the full one focused on them.
- No open PRs, no check-ins armed.

## Next: improvements Jose was offered (pick with him)

1. Done (#120).
2. One shared layout for the small and full brain (the small one draws
   domains as bands; positions don't match).
3. Day one: "Light your first 10 terms" for a new, all-dark brain.
4. Search a term in the brain.
5. Reliable dot taps on a phone (zoom then pick, or a list under the finger).
6. A List view (screen readers, no 3D).
7. Count other practice (memory trainer, quiz) only if they map to glossary
   terms; check first, quiz questions are exam topics, probably not.
8. Measure use first (owner-only open counts, nothing about who knows what).
   My recommendation: #8 before more polish; a glowing brain motivating
   practice is unproven.

## Learned this chat, not yet elsewhere

- Rules testing works here: firebase-tools + `@firebase/rules-unit-testing`
  in the scratchpad, `env -u HTTPS_PROXY -u HTTP_PROXY ... npx firebase
  emulators:exec --only firestore` (18 cases for term-reviews passed).
- The live `hub-access/settings` is readable without login (REST): the Hub is
  locked (`practice: false`).
- `tests/tools/brain-data.cjs` needs `acorn`: `cd tests && npm ci
  --ignore-scripts`, then delete `tests/node_modules` before running suites
  (a local playwright copy can shadow the global one).
- The head double-tap checks in `humc-brain.cjs` failed once under load
  (timing between taps), clean on rerun.
- On a merge, two "checks" runs appear per commit (push and pull_request);
  one is cancelled by the workflow's concurrency setting. Not a failure.
