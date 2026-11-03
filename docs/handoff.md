# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-03,
the "free assets and figures" chat (parked Kenney cars, the toon look test, the three figures, Tripo).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Work on branch `claude/hub-figures`. Tell me
> what's being worked on now and what was worked on before, in a few short lines. Then make the nurse with Tripo's
> image-to-3D API as `docs/handoff.md` says, show me front, side and back pictures beside the code nurse, and wait
> for my go before the other two. Plain words, say "working on it" and "done". "Push" is always a button.

## Now: the three figures from Jose's reference sheet, made by Tripo (nurse first)

Jose's picture: `docs/art/figures-reference.png` (doctor left, nurse middle, visitor right; lavender background).
Goal: 3D figures as close to that picture as possible, to compare with the code figures in
`docs/mockups/characters/` (viewer `index.html`, factory `figures.js`; phone link, private:
https://claude.ai/artifact/RQKt6GehUQQdVHa2yHhYSf).

Set up already (Jose, 2026-11-03):
- Tripo API key as a network secret: header `Authorization`, prefix `Bearer`, host `api.tripo3d.ai`. Claude never sees
  the key; send requests with no auth header and the proxy adds it. The old chat got 401 (secrets load when a chat
  starts) but the host answered without any bot check. First call: `GET https://api.tripo3d.ai/v2/openapi/user/balance`.
- `tripo3d.ai` and `www.tripo3d.ai` are allowed too, but the website itself answers automated reads with a
  Cloudflare check: do not try to get past it. Read the API docs at docs.tripo3d.ai instead, if reachable.

2026-11-03, second chat: the key was loaded but Tripo still answered 401 "Authentication failed" to the balance
call, so nothing was made or spent. Jose was asked to check the secret's value (only the `tsk_` key, no "Bearer" in it,
no spaces) and re-save it. `docs.tripo3d.ai` and `platform.tripo3d.ai` are blocked (proxy 403); not needed unless Jose
adds them. If the balance call still fails, stop and tell Jose; do not retry in a loop.
2026-11-03, third chat: still 401 on the balance call, also with a placeholder `Authorization: Bearer` header (so the
proxy reaches Tripo and the key itself is refused). Nothing made or spent. Likely causes, unproven: the key belongs to
Tripo's studio site and not the API platform (platform.tripo3d.ai, its own credits), the key was replaced or deleted,
or "Bearer" doubled. Jose is checking or replacing the key on platform.tripo3d.ai; the next chat starts after he saves it.
Nurse crop used: `docs/art/figures-reference.png`, box (532, 0, 996, 1024), which keeps the visitor's arm out.

Steps:
1. Check the flow against Tripo's API docs before spending (from memory, unverified: `POST /v2/openapi/upload` with the
   image gives a token; `POST /v2/openapi/task` `{type:"image_to_model", file:{type:"png", file_token}}` gives a task
   id; `GET /v2/openapi/task/<id>` until `success`, then the model's download URL). The model may download from
   another host: if it is blocked, tell Jose the host to add under Network access.
2. Crop the nurse out of the reference (middle third, plain background kept), Python with Pillow in the scratchpad.
3. One generation only, then stop and show. Jose approved three in total (nurse, then doctor, then visitor) and
   only after he sees the nurse. Each costs about 20-50 credits (1 credit = 1 cent, Tripo's pricing page).
4. Put the GLB in `docs/mockups/characters/tripo/`, measure its triangles and file size, slim it for phones if it is
   heavy, and show it in the viewer next to the code nurse (front, side, back, phone size).
5. Before anything goes into the app: Jose reads Tripo's terms on commercial use (not yet read by anyone).

Where the figures would go is not decided. On the campus a person is about 20 px tall, so detail there is invisible;
up close (Home, the guide, beside Dr. Smiley) it shows. Ask Jose if it comes up.

## Before (this chat)

- Live: parked cars in 3D are Kenney Car Kit models (#191, build b1103.2036). City Sample (Epic) ruled out: licensed for
  Unreal Engine only.
- Tested, not kept: a toon look for the campus (soft stepped light, brighter colours). Small change alone; the big
  levers are lighter roads, a pastel sky, tinted shadows. Jose has not picked it up yet.
- Branch `claude/hub-figures` (no pull request, not deployed: `docs/` is in `.vercelignore`): the code figures and
  this handoff.
- From the chat before: "a smoother walk" for the campus people. The 3D page already swings arms (`armMesh`), so check
  `docs/PLAN.md` before treating it as open.
