# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-28, the real-map campus chat (claude.ai,
moved into this repo as `claude/campus-real-map`), updated by the chat that
rebuilt the front on the map.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next 2, the campus),
> `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, in a few short lines each, say in 2-3 lines what you'll do next,
> and wait for my go. Plain words, say "working on it" and "done".

## Now

**The campus on the real map, front and back: a preview, not in the app.**
`docs/mockups/cchi-city/real-map/`: every building from Jose's OpenStreetMap
export at the same scale, a board twice as wide and deep. 2026-10-28 (second
chat): he said it was "still not accurate to the actual location"; measured,
the hand-built front was off (Link Pavilion a third of its real size, Jurist
15 m off, a lot where the map has houses), so the front's three buildings now
come from the map too and the diorama's ground (drive, canopy, café, movers)
was refitted round them (README, "The fit").
Then, from his photos (his window at Theurer, Street View along 2nd St and
Atlantic, Google 3D): the corner of Atlantic and 2nd, Helena Theurer
Pavilion (big curved glass tower at the street, the bridge, the HMH tower
on Imus's side), the little park beside it, the older orange-brick tower,
Audrey Hepburn House, the silver plant with roof fans (README, Decisions).
Method that worked: render the preview from the same spot as each photo
(`window.__view`, `__built` all 1, fov ~70 for Street View) and compare side
by side. 60 fps on his iPhone. Next: more photo areas he sends. Build: `python3 build.py
<out.html>` there (it runs `../live/gen.py` first). Preview Artifact (private):
https://claude.ai/artifact/7uyf7q3572hqDM9wFo7NAM. The README has the
decisions and the open items. Waiting on Jose:

- his OK on the look, and how it runs on his iPhone (about 480k triangles);
- the skybridges in his photos (which buildings they join);
- the ambulance to the real ED (Creamer, Atlantic St) instead of Link's bay;
- the domain weights on the cards (9/25/9/45/12 vs the blueprint
  22/22/22/15/19).

Then, its own pull request: wire it into the app (`campus3d/` via `gen.py
--app`, and the card's pictures via `builddiorama.cjs` into `city/`), with
the guide and the campus suites (`campus-3d campus-pick campus-alive
campus-life campus-depth guide`).

Still owed from before: his frame-rate reading of the app's 3D campus
(`campus3d/`, #165) on his iPhone.

## Before

- **#157** the campus as a floating diorama; **#164** the real HUMC layout
  around the entrance; **#165** the campus in 3D, full screen; the time of
  day with the real sun over HUMC (`claude/campus-time`). All live.
- **This chat (claude.ai):** the real-map preview above, built step by step
  with Jose from his map export, his Google 3D flyover and his photos (Street
  View at 77 2nd St, his window at Theurer); moved into the repo here.
