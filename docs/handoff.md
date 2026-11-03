# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-03,
the campus upgrade chat (sharper card, Kenney cars in 3D, free people and trees tested).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md`, `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md`
> ("Cars: Kenney's Car Kit", "Free people and trees, tested and dropped", "People"). Work on branch
> `claude/smoother-walk`. Tell me what's being worked on now and what was worked on before, in a few short lines,
> then write the plan for a smoother walk for the campus people and wait for my go. Plain words, say "working on it"
> and "done". "Push" is always a button.

## Now: a smoother walk for our campus people (3D view)

Jose's pick (2026-11-03), after free people packs lost to ours. Goal: keep our people's look (round, soft, hospital
roles), make the walk read as walking instead of a two-pose flicker.

Where it is:
- `stride(g, f)` in `docs/mockups/cchi-city/diorama.html` (~line 569): two poses only, legs at +-0.45 rad or straight.
- `people.js` line ~138 picks the pose: `f = p.v > 0.05 ? Math.floor(p.step/0.22) % 2 : 0`; pairs get `1 - f`.
- `person()` (~line 546): body, head, two legs as meshes, coloured per vertex; the arms are merged into the body, so
  an arm swing needs the arms as their own meshes (more draws: measure).
- The card's walkers are 2-frame sprites (`card_build.py`); leave the card alone in this change.

Ideas to plan from (not decided): a continuous phase (sine) for the legs instead of 0/1, speed-matched so feet don't
slide; a small bob and sway of the body; arms as two meshes swinging opposite the legs; reduced motion keeps today's.
Spec first with "not in this version" (`AGENTS.md`), measure draws and triangles before and after (`count.cjs` way in
README), `traffic_check.cjs` must stay all zero, campus-3d suite, before/after screenshots at phone size.

## Where things stand

- Live: sharper CoreCHI card (#177, b1103.1246); Kenney cars in 3D (#184, b1103.1529); notes "push is a button" (#181).
- Open changes: none. Check-ins: none.
- New rules this chat (in `AGENTS.md`/`CLAUDE.md`): "push" is always a clickable button, and Claude merges on Push;
  a phone notification when something goes live (from main, #180).
- Learned: the card capture pins the clock to noon NY (`card_page.cjs`), else windows render lit. Blender here: `pip
  install bpy==5.0.1` in a Python 3.11 venv. The tests' pinned Playwright needs `executablePath:
  '/opt/pw-browsers/chromium'` in cloud sessions (a `-r` preload that patches `chromium.launch`).
