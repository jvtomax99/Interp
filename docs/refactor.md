# Refactor

Jose starts this with the item numbers to fix, like "Refactor: CLEANUP.md items 1, 2, and 4."

Refactor: [path/to/file_or_folder, or CLEANUP.md item numbers]
Only run this between phases, with no unfinished work. One file, small folder, or a few related CLEANUP.md items per session.

Goal: make the code easier to read and smaller without changing what it does.

## Rules
- Behavior stays exactly the same. Don't change function names, inputs, outputs, or anything other files or the user interface depend on.
- Keep changes small. No new classes, interfaces, or files. Small helper functions in the same file are fine if they remove duplication.
- Refactor and dead-code removal only. No bug fixes or new features. If you spot a bug, add it to the "Later" list in SPEC.md.
- Never touch database data or collections.
- Work on its own branch.

## Steps
1. Read the files and what depends on them (start from docs/ARCHITECTURE.md).
2. For code changes: check for tests. If there aren't enough, write tests that capture how the code works right now (bugs included), run them, and commit them first. These tests don't change during the refactor. If one needs to, stop and tell me why.
3. In plan mode, list the changes in plain words, each with a risk level. I approve with buttons: "Low and medium only" (recommended) or "All of them." High-risk changes need my separate OK.
4. Make the changes in small commits, one deletion or change per commit. If a change breaks something, revert that commit and try a smaller step instead of patching it.
5. Proof:
   - Code changes: tests before and after.
   - Deletions: the app builds, every page loads, a search shows nothing still references what was removed.
   - Anything with a screen: before and after screenshots that look the same (for 3D or animated scenes, freeze the camera and timing).
6. Mark the finished items done in docs/CLEANUP.md.
