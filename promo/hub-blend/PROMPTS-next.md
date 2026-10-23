# The promo remake: last three additions (Jose, 2026-10-22)

Jose: "It's almost perfect." Three things to fold in from his other storyboard
("Hub Ad Storyboard" artifact) and two pictures, without changing the script or
the pacing. Paste one prompt at a time; each ends with a preview for Jose.

Rules every prompt keeps (do not restate them as optional):
- v11's audio stays untouched; no shot moves; HOOK_MAP, FEATURE_LEN (3 s),
  SHOTS, captions and their wording stay exactly as they are (45 s).
- Only the shot named in the prompt changes. Everything else renders the same.
- Checks before showing: tools/check-smiley.cjs (0 fails), tools/check-contrast.cjs
  (captions 7:1 or better), the proof readable at 360 px wide, and a frame
  check that every caption change still lands on v11's time (+/- 1 frame).
- Stills first (phone size), then a short clip of that shot with sound, then wait.

## Prompt 1: the 3D Interpreter Hub logo (8-10 s)

Rebuild only the logo shot (8-10 s) after my 3D logo picture
(promo/hub-blend/assets/ref/hub-logo-3d.webp): "Interpreter" in deep navy, a
big bright blue "Hub" under it, glossy extruded 3D letters with a soft light
edge, the two chat bubbles (one clear glass, one blue) to the left of "Hub",
and the app icon's diamond tiles streaming in an arc over the word, on a soft
white-blue glow so the navy letters never sit dark on dark. Keep the line "For
The HUMC Interpreter Team" under it. Build it in Three.js, not as a flat
picture: the tiles fly in and settle on the beat, the letters land with a
small bounce, a shine sweeps across "Hub" at the end. Same 2 s, same cut in
and out, nothing else in the video changes. First show me 2-3 stills of
font candidates closest to the picture's rounded heavy letters, then the clip.

## Prompt 2: the Hackensack photo as the doorway to CoreCHI City (28-31 s)

In the CoreCHI shot only (28-31 s), open on my cherry-tree photo (the app's
hero.jpg: the tree, the lamp post and the Hackensack Meridian Health sign)
instead of the desk. The camera pushes in on it with gentle depth (the tree
and post nearer than the building), and in about 0.7 s the photo turns into
the CoreCHI Practice card on the phone; from there the flight into the campus
runs as it does now, just starting earlier so it still ends at 31 s with "145
Questions". The caption, Dr. Smiley's spot and the shot's length stay the
same. Keep the HMH sign readable for a moment. Stills of the hand-off first.

## Prompt 3: Dr. Smiley's real brain on "Ask Dr. Smiley." (34-37 s)

Replace the brain I drew in the Ask shot with his real one, the HUMC Brain
from the app (brain/index.html and brain/data.json on main: merge main into
the branch first). Draw it the way the app draws it: the glowing nodes in
cyan, pink, green and amber, the fine fibre lines, signals racing along them,
the slow turn. When he rises out of the screen, his head glows and the brain
lifts out of it as a hologram into the middle of the frame (where the proof
cards fly), turns for about a second with a couple of its region names
("Safe First Moves", "Startup Path"), then folds back into his head as his
oncology briefing card flies out as it does now. No HUD text, no stats panel.
Same 3 s, same caption, he still winks and waves at the end. Capture it from
the real page if that is the most faithful; stills first, then the clip.

## Prompt 4: finish

Run every check, render the final 1080x1920, rebuild the side-by-side with
v11, and send both. If I say "final cut": put it in media/ in place of
hub-promo.mp4 (and its still), update the User Guide where the video plays,
and open the pull request.
