# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-20, 20:05 UTC, from the chat that did the
auto-bump, F3, S4 and the campus card.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> say in 2-3 lines what you'll do next and wait for my go. First thing:
> PR #106 (campus card) — check its tests, and merge it if I say "Merge".

## Where things stand

**Merged today, all live** (each confirmed by Vercel's status on the bump commit):
- #79 Team tips, doctor list, compact doctor page; #85 name pen cap; #86 provider Where.
- #93 the version bump Action: `BUILD_ID`/`CACHE_VERSION` now move by themselves after each push to `main` (never edit them by hand; a PR leaves them alone).
- #102 F3: the campus at golden hour, three depth layers slid by scroll and drag.
- #105 S4: off-screen term cards skip layout; a domain opens ~23-37% faster. Live build `b1020.1943`.

**Open, mine:**
- **#106 campus card to golden hour** (violet sky, no stars, a warm glow top left). WebKit tests passed; the main suite was still running at 20:05 UTC. Merge-ready once green. Jose has screenshots. A check-in was armed for 20:40 UTC (`trig_01YNWdY1N9cNogjzV9aRuWcQ`); the old chat cancels it at handover. After merging: wait for the "Bump version" commit (can take ~10 min behind the test runs) and Vercel's "Deployment has completed" on it.
- This branch, `claude/handoff-rule`: the handoff rule in `AGENTS.md`, `CLAUDE.md` and `PLAN.md`, plus this file. Docs only (no bump).

**Open, other chats** (don't take these): Home styles in layers (4 PRs), S5 springs, the index.html split plan, One Claude helper (2 PRs), Journey suite wait fix, type tokens rename.

## Next, with my picks

1. **Chip and Exam sim contrast** (found in #106, not changed): the campus card's chips read 4.1-4.4:1 and Exam sim 2.9:1, under the 4.5:1 minimum for small text. A visible change, so Jose decides. My pick: brighten their text and backgrounds slightly, with before/after screenshots.
2. **S1b Home taps** (59-90 ms, target < 20 ms): after the S5 springs and Home styles PRs merge, since they touch the same taps.
3. **Fewer cards up front** (S4 follow-up): a domain draws 40 cards, not 120, the rest right after the first paint. Faster again, but the list might visibly grow: show Jose a preview first.
4. **D1c** needs Jose: his `doctors.json` export and an iPhone test (Spanish voice on ES).

## Not proven (say so if asked)

- The campus drag/scroll depth and S4's speed-up on a real iPhone (all measured in headless Chromium at 4x slowdown).

## Learned in this chat (also in the docs)

- The live site and Vercel's API are blocked from a cloud session; GitHub's status API through curl works: `https://api.github.com/repos/jvtomax99/Interp/commits/<sha>/status`, context "Vercel".
- `tests/tools/tap-trace.cjs` now has `PROFILE=1` (script time by function), `CSS='...'` (an A/B experiment) and `BIG=150` (real-size domains).
- Term cards use `content-visibility`: any jump into the card list adds `cv-all` to `#content` first (`CLAUDE.md`, gotchas).
- `frame-meter.cjs` was flaky on `main` too; fixed in #105 by finding its stall by label.
- The campus re-render (`docs/mockups/cchi-city/`, `NOLIT=<old entrance.json> node buildentr.cjs out`) takes under a minute; `node_modules/three@0.160.0` beside it is needed and not committed.
