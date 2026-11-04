# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-04,
the "figures" chat (Tripo figures, practice scenes, the 3D nurse made to match the drawing).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Work on branch `claude/hub-figures`. Goal: the
> doctor and visitor made in Meshy through its API, to match the Meshy nurse. First check the Meshy API works (Jose
> saved the key as a network secret for api.meshy.ai, header Authorization, prefix Bearer, and allowed api.meshy.ai,
> assets.meshy.ai, docs.meshy.ai): read docs.meshy.ai for the image-to-3D call and credit costs, then one balance or
> list call. Tell me the cost per figure before spending, and write the ChatGPT prompts for the doctor and visitor
> pictures (like the nurse prompt in "Meshy nurse" below). Plain words, say "working on it" and "done". "Push" is
> always a button.

## Now: Meshy by API for the doctor and visitor (older notes below)

Status 2026-11-04 (chat 1): Meshy blocked in that chat. The proxy refused api.meshy.ai, docs.meshy.ai
(403 on connect) and injected no Meshy key; only api.tripo3d.ai was set. The settings were likely saved after
the chat started: a new chat picks them up. First call to try: `GET https://api.meshy.ai/openapi/v1/balance`.
Later the same chat: Jose allowed the three hosts and they opened (docs read, api.meshy.ai answers), but the key
was still not added ("Invalid API key", 401): a new chat should pick it up. Then Jose made an API key (meshy.ai/developers/keys, monthly cap 100) and saved it: balance call works in the same chat, balance 1490 credits (1070 monthly, 420 permanent). Jose's ChatGPT pictures: `docs/art/doctor-single.png`, `visitor-single.png`. Meshy image-to-3d tasks (latest = meshy-7.1, 2K texture, glb, multi-view thumbnails; 30 credits each, balance after 1430): doctor `01a1a894-183e-73f6-bc03-a5eebac01a40`, visitor `01a1a894-1e43-752d-bb5b-81754daf65f5`. Fetch with `GET /openapi/v1/image-to-3d/<id>`. Both SUCCEEDED (~560k triangles, one 2048 base colour each; raw 18 MB GLBs in Meshy, links expire). Phone files
`meshy/doctor.glb` (1.8 MB) and `meshy/visitor.glb` (1.7 MB): `KEEPBASE=1 tools/toy/slim_tex.py -- raw out 0.085`,
47.4k and 47.6k triangles, colours as Meshy made them (no warming, unlike the nurse). The three side by side, same
light (`plain.py`, `EXPO=-0.9`): `meshy/trio-meshy.png` (front and 3/4), `trio-meshy-face.png`. Next, Jose to say:
the trio into the app's practice scenes (replacing the cut-out drawings), or polish first. Costs, read from
docs.meshy.ai/api/pricing.md: image to 3D with 2K textures is 30 credits on `meshy-7.1` (latest) or `meshy-6`
(mesh only 20, 8K textures 35). So 30 a figure, 60 for both. The API uses prepaid API credits, bought in the
subscription settings; not checked yet whether app credits count. The ChatGPT prompts for the doctor and visitor pictures: `meshy/prompts.md`.


Picture of where she stands: `docs/mockups/characters/nurse-current.png` (drawing, then front and 3/4) and
`nurse-current-face.png` (face close up). File: `docs/mockups/characters/tripo/nurse-best.glb` (7.6 MB, one GLB,
the face and badge baked in). How she was made, step by step: "Making her match the drawing, round 2" below; the
tools are in `docs/mockups/characters/tools/`. Renders come from Blender (`pip install bpy`, not kept between chats:
ask Jose with a button before installing, and offer the setup-script line `pip install bpy`).

Still different from the drawing: thin stray-hair marks at the temples, a faint line along the bang, the model's
own proportions (bigger head, shorter legs), lumps in the hair. Jose had not said yet whether to polish more, do
the doctor and visitor the same way (about 110 Tripo credits each; balance 635), or stop.

Waiting on Jose, outside the figures: #204 (rules: paste boxes for environment settings, ask with a button before
installing tools), tests passed, his "Not yet" on 2026-11-04.

Live in the app (done): practice scenes in the memory trainer (#197, b1104.1059), with the figures cut straight
from his drawing (#201, b1104.1206).

## Meshy nurse (2026-11-04 night): the best so far

Jose made her in Meshy from `docs/art/nurse-single.png` (screen recording in the chat; original GLB 21 MB, 595k
triangles, three 2048 textures, kept in his Meshy account, not in the repo). Rendered as is with
`tools/toy/plain.py` (`EXPO=-0.9`: the studio light was washing her out; her own skin is near the picture's).
Base colour warmed a touch (`base-warm.png`: skin blue -15%, green -4%; scrubs red down). Phone file
`meshy/nurse.glb`: 47.6k triangles, 1.7 MB, via `tools/toy/slim_tex.py ... 0.08 base.png` with `KEEPBASE=1`
(shrinking the base colour to 1024 opened seam lines on the face). Pictures `nurse-meshy.png`, `nurse-meshy-face.png`.
The ChatGPT prompt that made `nurse-single.png` (Jose attached `docs/art/figures-reference.png`):
"Using the attached picture as the character reference, draw ONLY the nurse in the middle (...), alone, as a single
full-body character for 3D modeling. Keep her exactly the same: same face, (...) same soft clay-toy 3D style and
colours. Pose: standing straight, facing the camera directly, arms hanging slightly away from her body so there is a
gap between arms and torso, hands relaxed, feet slightly apart. Camera: straight on at chest height, no perspective
tilt, whole body in frame with a little space around her. Lighting: soft, even, flat front lighting, no strong
shadows, no rim light. Background: plain solid light grey, nothing else in the picture. Square image, as large and
sharp as possible." For the doctor (left) and visitor (right), swap the person and their clothes from the reference.
Not read yet: Meshy's terms for commercial use (free plan rules may differ from paid). Shoes a bit soft.

## Second nurse (2026-11-04 night, Jose's ChatGPT picture)

`docs/art/nurse-single.png` (Jose made it in ChatGPT from the prompt in this chat: the nurse alone, straight on,
even light). Tripo views task `13a857b8-fa64-4f6a-b5a4-54b9d5c291cc` (10), `multiview_to_model` v3.1 detailed
geometry, standard paint, task `6718c65f-0a73-45f3-ab5f-79e63653e5ee` (50); balance 575. Slimmed with
`tools/toy/slim.py` (0.1) to `tripo/nurse2.glb`. Same clean rebuild, per-figure zones and face layout in
`tools/toy/nurse2/` (`run.sh tag front|three|face`, needs `MERGE=3e-4` for the slimmed seams).
Pictures: `nurse-toy2.png`, `nurse-toy2-face.png`. Much better proportions and a round face. Left: eyes rounder
and more goggly than the picture, a blue line on the badge, black specks on the pant cuffs, a rough hairline on the
forehead, arms touching the sides. Polish round (same night): lids lower and thicker, matte eyes, badge clean, V neck
back (`vneck` as apex, slope, half width, top), vote radius 0.018, `PASSES=1` (two passes ate the right brow).
Pictures `nurse-toy3.png`, `nurse-toy3-face.png`. Still: ragged hairline, a few dark specks at the pant cuffs. V2 API still works on api.tripo3d.ai (upload gives `image_token`; multiview task
takes `files` front, left, back, right).

## Clean rebuild (2026-11-04 evening, Jose picked it)

Why the earlier rounds kept missing: we painted over Tripo's paint. Now shape and colour are apart, like a toy:
`docs/mockups/characters/tools/toy/` (run from a scratchpad copy; Blender via `pip install bpy`).
1. `bake_pos.py` bakes where each texel sits in 3D; `glbimg.py` pulls the GLB's colour map.
2. `labels.py` sorts every texel into skin, scrubs, hair or white by a 3D vote (thin painted marks vanish), with
   rules by place (eye zone all skin, V neck skin, no hair on cheeks, white only on shoes). `paint.py`: flat colours.
3. `toy.py` (with `face.py`, `features.json`): whole figure smoothed (`GSMOOTH=16 GTYPE=SMOOTH`), face fitted to a
   smooth surface, clay-ball nose, eyes as glossy domes with drawn irises, lids, brows and mouth as tubes, badge as a
   card, blush in the shader. Feature places are measured on the drawing and anchored on the nose.
   Render: `FACE=1 SAMPLES=128 GSMOOTH=16 GTYPE=SMOOTH JAWIT=60 KEY=55 KEYS=3 FRONT=40 UNDER=12 WORLD=0.35 ./view.sh z front|three|face`.
Pictures: `nurse-toy.png` (drawing, before, now front, now turned), `nurse-toy-face.png`. No Tripo credits spent.
Left: head boxier than the drawing (shadowed cheek sides), lower face longer, skin a touch orange, no GLB export yet
(curves and the blush need baking first).

## History of the figures work (oldest first)


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
2026-11-03, fourth chat (after Jose re-saved the key): balance call still 401 "Authentication failed" (code 1002).
The proxy lists api.tripo3d.ai as "Allow + inject", so the header goes out; Tripo refuses the key. Stopped, nothing spent.
Same chat, later: balance call 200 OK, key works. Balance 0 credits, so Jose tops up on platform.tripo3d.ai before the nurse.
Nurse made (same chat): task `a46f35c3-09dd-4440-a750-d1e294fe800a`, 30 credits, 970 left, model v2.5. Download host `tripo-data.rg1.data.tripo3d.com` blocked by the network policy; Jose adds it. Download links expire in about 10 min: ask `GET /v2/openapi/task/<id>` again for fresh ones (no new generation needed).
Nurse in the viewer (2026-11-04): `docs/mockups/characters/tripo/nurse.glb`, slimmed from 315,528 to 37,862 triangles and 10.9 MB to 1.1 MB (gltf-transform simplify 0.12, textures 1024 webp); raw stays on Tripo (task id above). Viewer button "Tripo" puts it beside the code nurse; it comes in facing +X, turned -90°. Tripo made it glossy (roughness ~0.2); `?matte` shows it matte (roughness 0.75), closer to the clay picture. Loader: three 0.160's GLTFLoader in `docs/mockups/characters/lib/`. Waiting on Jose's go for doctor and visitor.
Doctor and visitor made (2026-11-04, Jose's go): tasks `fc16a7a2-7105-4dd0-9197-75889adc198e` (doctor) and `c883ad4e-a418-413b-bff5-cd2cdd5f239b` (visitor), 30 credits each, 910 left. Slimmed: doctor 46,952 triangles (13.3 MB to 1.4 MB), visitor 49,944 (14.1 MB to 1.4 MB). Viewer: "Tripo" is now an on/off button putting each Tripo figure beside its code version, matte by default (`?gloss` for Tripo's shine, `?tripo` to start with it on). All three Tripo models are one solid piece: moving them needs Tripo's rigging, untried. Tripo's commercial-use terms still unread.
Nurse rigged and walking (2026-11-04, Jose's go, about 35 credits): rig check free (biped), `animate_rig` task `c22e9c21-2481-4a42-81fe-e64d718fd9f2` 25 credits (rig v1.0), `animate_retarget` `preset:walk` task `eec59fb1-185d-4696-ba9f-93f6013f67cf` 10 credits; 875 left. `tripo/nurse-walk.glb`: 41 bones, 2.33 s walk, 37,862 triangles, 1.6 MB (from 14.3 MB). The walk carries her forward; the viewer takes the drift out of Root/Hip so she walks in place. Tripo's V2 API is being replaced by V3 (their migration guide); everything here used V2.
2026-11-04, later: the practice scenes now use pictures cut straight from Jose's drawing (#201): the Tripo visitor looked
rough up close. Second visitor (v2.5, `texture_quality` detailed, task `233fc377-1e53-4a4d-8dee-88dea1de25d3`, 40 credits): skin
cleaner, hair still lumpy. Newest model test, nurse: `model_version` `v3.1-20260211` with geometry and texture "detailed",
sent through the V2 API (works; V3's host openapi.tripo3d.ai is blocked here), task `8fea8c2c-6aec-4d5c-9146-da9136cd45f9`,
60 credits, 775 left: 1.97M triangles, three 4096 px textures, 61 MB. Sharper shapes than v2.5, still not the drawing's smooth
finish. Docs: developers.tripo3d.com (reachable now): its V2-to-V3 migration guide lists the versions and options
(`texture_quality` standard/detailed/extreme). Use v3.1 for any figure that must move in 3D.
Repaint test (same day): `texture_model` v3.0 at `texture_quality` extreme, guided by the nurse drawing, on the v3.1 nurse:
task `e7052567-8a93-4a0a-a054-8ed307a16fbb`, 30 credits, 745 left. Barely different from v3.1's own paint. A neutral,
frontal light in `render.html` (`?light=studio&face=front`) brings it closest; what still differs: whites smeared round the
eyes, grainy cloth, a lighter blue. Free next levers: smooth and colour-match the texture to the drawing.
Making the 3D nurse match the drawing (Jose: "perfect, like the drawing, use credits"), 2026-11-04:
1. Tripo drew four views from the nurse crop (`generate_multiview_image`, task `c44b2cbe-2ef3-4690-8786-929293783a99`, 10 credits).
2. `multiview_to_model` from those, v3.1, geometry detailed, texture extreme (task `06a52900-10e4-4e6b-84b9-2b31ab1319d5`, 70):
   shape right from every side. Paint still rough.
3. `texture_model` v3.0 extreme guided by the four views (task `43a20cbc-c438-4063-ba5b-22b4e5a884db`, 30): skin a bit better.
4. Free, in `docs/mockups/characters/`: `tools/clean.py` (smooth each colour class and match it to the drawing's colours),
   `tools/eyes.py`, `tools/smooth.mjs` (flatten Tripo's carved eyes and mouth on the face, seam copies moved together),
   `bake.html` (projects the drawing onto the front and bakes it into the texture; `?bias&f0&f1`), `tools/tex.mjs`
   (swap a GLB's base colour). The drawing is fitted to the front render by bounding box, then the face shifted 40 px
   down (eyes) at 1200 x 2400. Result: `tripo/nurse-best.glb` (1.8 MB). Front now reads as the drawing; up close the
   eyes are soft because the nurse's face is only ~220 px wide in the reference sheet; the sides show a little smear
   where the projection reaches past the front (`f0=0.02`; try 0.15).
   Balance 635. Next lever: a big, single-figure picture of each person (ideally front, side, back in the same style).
   Refined: the drawing sharpened (unsharp mask) before projecting, and `f0=0.15&f1=0.40`: the side smear is gone, eyes crisper.
   Blender (installed with `pip install bpy`, 5.2.3; add it to the setup script to keep it): `tools/studio.py in.glb out.png
   front|three standard|agx` renders a figure in Cycles with soft key, fill and rim area lights and a matte, slightly
   subsurface skin. With it the same nurse looks close to the drawing: most of the gap was the browser render's light.
Making her match the drawing, round 2 (2026-11-04 afternoon, Jose: "perfect, like the drawing"): the chain is now in
`docs/mockups/characters/tools/` (run from the scratchpad copies; paths inside are the chat's):
1. `tools/smooth.mjs in.glb out.glb 40` with `LAP=60`: Taubin smoothing then a flattening pass over the face (nose
   kept, the badge bump too), seam copies moved together, consistent normals. Tripo's carved eyes and mouth go.
2. `tools/vecface.py drawing-screen.png vec.png`: the face redrawn as crisp shapes (eyes, brows, nose, mouth, blush)
   over cleaned skin, plus `vec-decal.png` (features only) and `vec-hair.png` (the drawing's hair).
3. `bake.html` through `tools/bake4.cjs` (features), `bake9.cjs` (wide mask: face zone, badge, shirt zone, hair,
   below-eye flag) and `bake10.cjs` (straight-on mask): screen pictures projected into the texture's layout.
4. `tools/clean.py`, `tools/eyes.py`, then `tools/project.py base projF projM out projMF`: per-kind flattening and
   colour match (skin, blue, hair, white), every mark off the face (straight-on: all; sideways: keep the hair mass
   above eye level), the shirt flat round the badge; writes `color.png`, `rough.png`, `coat.png`, `spec.png`.
5. `tools/studio.py in.glb out.png front|three standard` with `TEXDIR`, `SMOOTH=0.2`, `DECAL=vec-decal.png`,
   `BADGE=badge-decal.png`: Blender render; the face plate is a copy of the head's front faces lifted a hair off the
   skin with camera-projected picture coordinates; the badge a flat card at the bump.
   `CLAY=1` renders the shape alone (how the carved mouth was found); `tools/uvmap.py` maps screen pixels to texels.
6. For a single file: `tripo/features-screen.png` (the face plate and the badge card at their screen places) baked
   with `tools/bake11.cjs` and laid over `color.png` (`color-final.png`), then `tools/tex.mjs set`.
Result `tripo/nurse-best.glb` (7.6 MB, features and badge baked into the texture, no plates): front and 3/4 read as
the drawing.
Left: thin stray-hair marks at the temples, a faint line along the bang's edge, the figure's own proportions
(bigger head, shorter legs than the drawing), the hair's lumps.
Place picked (Jose, 2026-11-04): practice scenes. Plan in `docs/features/practice-scenes.md` (pictures rendered from the Tripo figures, no live 3D, no rigging for doctor and visitor); PLAN.md item 4. Waiting on his OK and on Tripo's terms.
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
