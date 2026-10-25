# Dr. Smiley's full body: prompts to have him reviewed and fixed

Jose, 2026-10-25, after the 50-second preview: "The movements are awkward
and aren't animated properly." These are the prompts to get him looked at
the way a professional animator would, then fixed. Five of them, in the
order to use them. Nothing here goes live; his branch
(`claude/dr-smiley-body-home`) never deploys.

## What I saw first (Claude, frame by frame on navy)

This is a first read from `tests/tools/body-clip.cjs` at 1/60 s, not the
full review. Prompt 1 is there to check it and find what I missed.

1. **The swap shows.** In `greet` the cutout arm rises as one straight,
   stiff piece with the hand hanging limp, then a different drawn arm
   (the wave) replaces it. The two arms differ in shape, length and
   shading, so the eye sees one picture swapped for another instead of
   one arm moving. `cheer` and `point` hand over the same way.
2. **The cutout arms move like paper.** They turn at the shoulder in
   the flat picture plane. The elbow barely bends on the way up, the
   wrist doesn't lead or trail, and the shading painted on the sleeve
   turns with it, so a raised arm is lit from the wrong side.
3. **The walk reads as wrong.** He faces the camera while his arms swing
   out sideways from his body like a sprinkler. A real walk seen from the
   front swings the arms forward and back, which from the front is
   almost no sideways movement. His hips and shoulders don't counter
   each other and his body hardly bobs.
4. **His body watches his arm.** While an arm moves, his shoulders,
   chest and weight stay still: no shoulder lift on the raise, no lean
   into the wave, nothing in the coat.
5. **Every move lands the same way.** Most beats end on the same
   `spring` ease, so wave, cheer and nod all settle with the same small
   wobble, and many beats are evenly spaced.

## The real question before fixing anything

The rig is a cutout: one front picture of a 3D-rendered character, cut
into flat pieces that turn at their joints, with drawn poses swapped in.
That method has a ceiling. Flat pieces of a 3D-shaded character can't
bend, turn or catch light the way the render did, and every drawn pose
from ChatGPT comes back slightly different (0 to 4 px off, colours a few
points apart), so each added swap risks another visible jump. More
drawings alone won't get him to "professional"; they may make the swaps
more frequent.

The four ways forward, argued both ways:

- **Polish this rig.** Cheapest, keeps his exact look, everything already
  wired into the app. The ceiling is a well-made puppet: smooth, but it
  will still read as flat pieces when an arm crosses the body.
- **Rive** (an animation tool whose files play in a web page, with bones
  and parts that bend). The usual professional answer for an app
  mascot that reacts to taps. Needs his art redrawn in separate parts
  made for bending (upper arm, forearm, hand, coat panels) and a person
  who knows Rive; Claude can wire a Rive file into the app but can't do
  the animating in Rive's editor well.
- **A real 3D model.** He is already a 3D-looking character, so a rigged
  model would move the most naturally (the brain screens already use
  Three.js). Risks: getting a model that truly looks like him, and the
  weight on a phone's battery and loading time.
- **Pre-made video clips** (one short clip per move, with a see-through
  background). The best look per move, the least reactive: he can only
  play clips, not blend or follow a tap. iPhone Safari and Chrome need
  different video formats for the see-through background.

## Prompt 1. A professional review (new Claude chat, on his branch)

Paste into a new Claude Code chat on `jvtomax99/Interp`:

```
You are a senior character animator (15 years, TV and games, 2D cutout
and 3D) reviewing Dr. Smiley's full-body animation, plus a front-end
engineer who knows how it is built. Do not change any code in this chat.

Branch: claude/dr-smiley-body-home (storage only, never deploys).
Read CLAUDE.md, AGENTS.md, docs/handoff-dr-smiley.md (its first section),
docs/features/dr-smiley.md from "Full body: the cutout rig" on, and
docs/art/dr-smiley-body/prompts-fix.md (the first read and the four ways
forward).

1. Film every performance in DR_BODY_PERF and every held state in
   DR_BODY_STATES with tests/tools/body-clip.cjs, BG=is-navy, seeds 7 and
   3, in Lively and Focused. Make frame strips (every 3rd frame) of each.
   Also film him in the app at phone size (Home banner, quiz card) with
   a Playwright screen recording.
2. Grade each move against the 12 principles of animation (timing,
   spacing, anticipation, follow-through and overlapping action, arcs,
   squash and stretch, secondary action, staging, exaggeration, solid
   drawing, appeal, straight-ahead vs pose-to-pose). For each problem
   give the move, the frame numbers, what is wrong in one plain
   sentence, and why it reads as awkward.
3. Rank every problem by how much it hurts on a phone at real speed,
   worst first. Mark which come from the method (a cutout of a 3D render,
   swapped drawn frames) and which are fixable inside it.
4. Recommend one of the four ways forward in prompts-fix.md, with what
   it costs Jose (money, his time, new drawings) and what it can't fix.
   Argue the strongest case for the option you don't pick.
5. Write it all to docs/art/dr-smiley-body/animation-review.md with the
   strips as images beside it, commit and push to the branch, and send
   Jose the worst three problems as before/after-style strips on his
   phone. Plain words, short. Then ask him, with buttons, which way to go.
```

## Prompt 2. Fix it inside the current rig (after Prompt 1, if Jose picks "polish")

```
Fix Dr. Smiley's full-body animation on branch claude/dr-smiley-body-home,
working from docs/art/dr-smiley-body/animation-review.md, worst problem
first. You are a senior character animator who also writes the code.
Read the same docs as the review first.

Rules for every fix:
- No visible swap. Where a cutout arm hands over to a drawn pose, the
  cutout must reach the drawn arm's exact angle, length and hand position
  first (measure both in pixels), or the drawn pose comes in earlier from
  an in-between drawing. A cross-fade longer than about 2 frames is not a
  fix; it shows as a ghost arm.
- Arms bend: the forearm leads on the way up and trails on the way down,
  the wrist follows a beat behind the forearm, and the hand never hangs
  limp unless the move means it.
- Every arm move has the body in it: the shoulder lifts on a raise, the
  chest leans into the wave, the weight shifts before a step.
- Moves follow arcs, not straight lines, and each has its own timing:
  no two performances end on the same ease. Fewer, stronger key poses
  with clear holds beat many even beats.
- The walk: from the front, arms swing forward and back (small, mostly
  a scale and slight shift, not a sideways swing), shoulders counter the
  hips, the body dips on the contact and rises on the pass.
- Keep his face acting in sync with the body: the face reacts at the
  same beat, not after.

For each move you change: film it before and after with
tests/tools/body-clip.cjs on navy (two seeds), put the two side by side,
and check frame by frame for pops and stray edges. Run cd tests &&
node run.cjs (body-rig and smiley-body-app must pass). Update
docs/features/dr-smiley.md and the handoff. Commit each move on its own,
push to the branch only, never to main. Send Jose a before/after video
of each fixed move at phone size, then a phone notification.
If a fix needs a new drawing, write the ChatGPT prompt for it (Prompt 3's
format) and stop for Jose instead of faking it in code.
```

## Prompt 3. A missing in-between drawing (ChatGPT, one per drawing)

Use only when Prompt 1 or 2 names a drawing that's missing. Attach
`docs/art/dr-smiley-body/body-master.png` and the drawn pose on each side
of the gap (for example `body-master.png` and `wave-rise.png`).

```
This is Dr. Smiley, a 3D-rendered cartoon doctor (first image: his master
picture). I need ONE in-between drawing for an animation: the moment
halfway between the second and third images.

Exactly the same character, size, framing, camera, lighting, colours and
transparent background as the master picture. Same canvas size, his feet
on the same line, his head in the same place. Change ONLY [the right arm]:
[the elbow bent about 90 degrees, the upper arm out to the side at about
45 degrees, the forearm pointing up, the palm turning toward the camera,
the fingers relaxed]. The light stays where it is in the master, so a
raised arm is lit from the same side as the rest of him. Nothing else on
him moves: same face, same coat folds, same legs.
```

## Prompt 4. A second opinion on the video (ChatGPT or any AI that takes video)

Attach the preview video (or a slow clip from `body-clip.cjs`):

```
You are a senior character animator. This is a cartoon doctor mascot in a
phone app, animated as a cutout rig (flat pieces of one picture turning at
the joints, with some drawn poses swapped in). The owner says the moves
look awkward and not properly animated.

Watch it at real speed first, then frame by frame. List what makes it
read as awkward, worst first, each with the time in the video and one
plain sentence on how a professional would fix it. Use the 12 principles
of animation where they apply. Then say honestly whether this method can
reach a professional look at all, or whether it needs a different one
(Rive, a 3D model, pre-made clips), and why.
```

## Prompt 5. A brief for a human animator (Upwork, Fiverr, a Rive or Spine freelancer)

```
Character animation for a medical app's mascot, Dr. Smiley.

What exists: a 3D-rendered cartoon doctor (front view, full length) and
about 30 drawn poses of him (wave, cheer, think, shrug, thumbs up, point,
clipboard, crouch, jump, landing). Attached: his master picture, the
poses, and a 50-second video of the current animation.

What I need: him animated in Rive [or Spine], to play in a web page on
phones, as a state machine:
- an idle loop (breathing, blinking, small weight shifts)
- 12 one-off moves: greet (wave), acknowledge (nod), think, cheer, wink,
  shrug, read (a clipboard), point, bounce, wince, walk a few steps,
  doze
- 5 held states, each with a way in and a way out: listening, thinking,
  answering, celebrating, unsure
- a tap reaction
His face is a separate set of 30 expression frames that must stay in
sync with the body.

He must keep his exact look (same face, coat, colours). Each move under
about 2 seconds, readable at 110 to 220 pixels tall on a phone. File size
target under 1 MB.

Please send: a quote, how long it takes, two examples of mascot or
character work you've done in Rive [or Spine], and which parts of his art
you'd need redrawn in separate pieces.
```
