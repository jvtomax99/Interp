# Dr. Smiley: animation prompts (key poses and breakdowns)

Written 2026-10-24, after the frame-by-frame review. Today each gesture has
one drawing, at its top. A professional move needs more: the wind-up, the
big moment, one drawing in between, and the settle. The rig fills the
frames between drawings. These prompts add those drawings.

## The rules every drawing follows

- Each move gets drawings at its key moments. The rig does the rest.
- Hands drag. The wrist leads, the fingers follow.
- Every move travels on an arc, never a straight line.
- Nothing stops dead. A move overshoots a little, then settles.
- His head, face, torso and feet never change in these drawings. The app
  puts its own head on top.

## How to run one

1. Upload `body-master.png` in ChatGPT.
2. Paste the opening and one pose line together, as one message.
3. Send the result back with its file name. Every result is measured here
   and the ones to redo are named.

## Opening for arm drawings

```
Edit this image. This is one drawing in an animation sequence, so it must line up exactly with the original. Keep everything identical: the same character, size, position, camera, lighting and plain light grey background. Do not move, zoom, crop or tilt anything. His head, face, hair, body, coat, legs and feet stay exactly where they are. The background stays one flat, even light grey with no new shadows. His white coat keeps its exact length and width, and his scrubs stay the same bright blue. Same 3D cartoon style and render quality, same 2:3 size. Change ONLY his arms and hands, as described below.
```

## Opening for leg drawings

```
Edit this image. This is one drawing in an animation sequence, so it must line up exactly with the original. Keep everything identical: the same character, size, position, camera, lighting and plain light grey background. Do not move, zoom, crop or tilt anything. His head, face, hair, coat and arms stay exactly where they are. The background stays one flat, even light grey; only his shadow on the floor follows his feet. His coat keeps its exact length, and his scrubs and shoes stay the same blue. Same 3D cartoon style and render quality, same 2:3 size. Change ONLY his legs and feet below the coat, as described below.
```

## The drawings

Done: the three hello-wave drawings (in `greet`) and the three cheer drawings
(in `cheer` and `celebrating`), 2026-10-24; the two point drawings (in
`point`), the two thinking drawings (in `think` and `thinking`) and the
clipboard's way up (`clipboard-low` and `clipboard-mid`, in `read` and
`answering`), 2026-10-25; `docs/features/dr-smiley.md`. The rest are next.
The openings gained a line on 2026-10-25 from what the cuts showed: the
clipboard drawings came back with a blotchy wall, a shorter, narrower coat
and darker scrubs, each of which the cutter had to work around.

| Move | File | Pose line (after the opening) |
|---|---|---|
| Hello wave | `wave-rise.png` | His right arm (on the picture's left) halfway up and moving fast. The elbow is bent and leads, level with his chest. The wrist lags behind and bends back, so the open hand trails below the elbow. Fingers relaxed and slightly curved, palm toward his body. The other arm stays at his side. |
| Hello wave | `wave-in.png` | His right hand raised beside his head in a wave, palm toward the viewer. The hand tips in toward his head, wrist bent inward, fingers together and slightly curved. Elbow at shoulder height. The other arm stays at his side. |
| Hello wave | `wave-out.png` | His right hand raised beside his head in a wave, palm toward the viewer. The hand tips away from his head, wrist bent outward, fingers spread a little. Elbow at shoulder height. The other arm stays at his side. |
| Cheer | `cheer-load.png` | Both arms pulled down and back. Fists clenched beside his hips, elbows bent and pointing back, as if about to throw both fists up. |
| Cheer | `cheer-mid.png` | Both fists rising fast at shoulder height. Elbows bent and out to the sides, forearms angled up, knuckles toward the viewer. |
| Cheer | `cheer-up.png` | Both arms straight up above his head in victory, fists clenched, making a wide V. The coat sleeves slip toward the elbows. |
| Thinking | `think-rise.png` | His right hand rising toward his chin, halfway there at chest height. The index finger starts to point up, the other fingers curled. His left arm starts to fold across his stomach. |
| Thinking | `think-tap.png` | His right index finger at his chin and his left arm folded under the right elbow, as in a thinking pose. The index finger is lifted a little off the chin, mid-tap. |
| Point | `point-load.png` | His right arm bent and pulled back, hand near his right shoulder, index finger already out, as if about to point to the picture's left. The other arm stays at his side. |
| Point | `point-reach.png` | His right arm fully stretched to the picture's left, a little higher than the shoulder, index finger out, wrist straight. A strong reaching point. The other arm stays at his side. |
| Shrug | `shrug-half.png` | Halfway into a shrug. Both elbows bent and close to his sides, forearms swinging out to the sides, hands at waist height turning palms up, fingers relaxed and trailing a little. Not yet the full shrug (that one has both palms up beside his shoulders). |
| Reading | `clipboard-low.png` | Both hands holding a plain white clipboard with a silver clip at waist height, arms long and relaxed, as if lifting it to read. Nothing written on it. |
| Right answer | `thumbs-rise.png` | His right hand (on the picture's left) at stomach height, closing into a fist with the thumb starting to point up. Elbow bent close to his side. The other arm stays at his side. |
| Wrong answer | `wince-arms.png` | Both arms pulled in tight, elbows against his sides, hands curled loosely in front of his stomach, knuckles toward the viewer, as if flinching. |
| Jump landing (legs) | `legs-land.png` | Landing from a small jump. Knees bent deeply, feet planted wider apart than now, toes turned out a little, the weight sinking down. |
| Jump take-off (legs) | `legs-toes.png` | Rising on his toes, heels lifted off the floor, legs straight, as if springing up. |

## The limit of this method

In these drawings his torso and head never move. So his whole body cannot
bend into one strong curve, the "line of action" a Disney pose is built
on. That is the ceiling here. Going past it means full-body drawings with
the torso leaning and twisting, or a real 3D model of him.
