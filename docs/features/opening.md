# The opening (Badge in)

The first thing the Hub shows every time it starts: your staff
badge drops in on its lanyard in front of the Helena Theurer Pavilion, you
tap it, it scans green, and the green ring opens into Home. Jose,
2026-11-05, after about fifteen mockups ("I want an opening similar to the
CPA app... not with the train moving"). **Status: built 2026-11-05**
(`features/opening.js`; "As built" below). The picked mockup is in
`docs/mockups/opening/` (video and stills).

## What it does

1. **The pavilion, alive (0 to 1.3 s).** Jose's photo of the Helena
   Theurer Pavilion, softly out of focus, drifting slowly. Soft light comes
   down from the sky opening: rays made from the photo's own sky, not drawn
   on top. Faint dust in the air. The logo (the plain mark, no tile) and
   "*Interpreter* Hub" in Cormorant Garamond appear at the bottom, with HUMC
   LANGUAGE SERVICES under them.
2. **The badge (1.3 to 3 s).** It drops in on a woven navy lanyard (it says
   INTERPRETER only, because the team covers more than Spanish), a clear
   strap with a metal snap and a blue connector, the purple INTERPRETER
   card behind. The card follows the real HUMC badge: the name as first
   name and last initial ("Jose V."), the badge title (*Staff Interpreter* unless you change it), the Hackensack
   Meridian Health / HUMC lettering with the logo, "Language Services".
   **Dr. Smiley sits where the photo goes**, unless you put your own photo
   there (More, My photo on the badge; 2026-11-06, below). There is no
   barcode or number, so it can't pass for a real ID. It swings, catches the
   light, and the frosted glass reader under it pulses pink.
   "Tap your badge to begin".
3. **The tap.** The badge lowers onto the reader, a cyan line scans it
   (a short beep), the ring turns green (a chime), a green pulse runs up
   the lanyard and the badge glows green, Dr. Smiley winks, "Welcome in,
   Jose" (first name).
4. **Into the app (under 1 s).** The green ring keeps growing from the
   reader and the real Home shows inside it (picked from four: through
   the clouds, badge becomes the app, **access opens Home**, Home builds
   itself). Then the hello on Home runs as it does today, the name pen
   included.

**When it plays: every time the app really starts** (Jose, 2026-11-05:
"always triggers every time the app is opened"; this replaces "first open
of the day"). On iPhone, coming back to the Hub from another app resumes
it without a restart, so the opening plays when the app starts fresh, not
on every switch back (the same as the CPA app). Never when a notification started the app (`?open=`; Jose, 2026-11-05:
it goes straight to its message), never on the reload after an update, never during an exam or practice timer. A tap before the badge
arrives skips straight to Home. More gets **Replay the opening** and an
**Opening** switch (on / off).

**Who it is for.** Everyone on the team, on their phone.
The name comes from the name set in the app (`ih_myName`); with no name
set it says "Welcome in" and the card shows "Interpreter" where the name goes.

## How it will be built

- **The app is never held up by it.** Home draws underneath from the saved
  copy as it does now, so the ring opens onto the live Home, not a picture.
  The opening never waits on the network.
- **The background is a short pre-rendered loop**, not live 3D: the
  pavilion's drift and its light, rendered once from the mockup into a
  seamless clip of about 6 s (WebM and MP4, aim under 1.5 MB), in
  `opening/`, precached by `sw.js` so it plays offline. The mockup built
  the light by reading the screen back every frame with three.js (670 KB);
  on an older phone that would stutter, and it would load three.js on
  every morning's start. A clip looks the same and costs nothing.
- **Everything on top is plain HTML and CSS**: the badge, the reader, the
  words, the ring. One new file, `features/opening.js`, styles in an
  "Opening" block in `app.css`, Dr. Smiley's art drawn by `drSmileyArt()`
  (his wink is a face frame he already has).
- **Sound** only after the tap (phones allow sound only after one): the
  beep, the chime, a soft swell as the ring opens. Short files, quiet.
- **Still** (reduced motion, or Still in his settings): no drift, no swing,
  the badge already hanging; the tap goes straight to green and Home fades
  in over 260 ms.
- **Done hand-off:** it fires `hub-opening-done`; Home's hello and name pen
  wait for it while the opening is up (`home-polish.js`).

## Not in this first version

- Tilting the phone to swing the badge (iPhone asks a motion permission).
- The walk up the drive or the cherry blossom photos (tried and dropped).
- Anything from a real ID: no barcode, employee number or department
  code, ever. (This line said "no photo" too until 2026-11-06, when Jose
  chose an opt-in photo; see "Your photo on the badge".)
- A badge per role or per teammate in colour or layout (only the title
  changes).
- A way round an iPhone's rule of no sound before a touch: there is none for a web app (see Music below).
- Playing on desktop: phones only at first.

## What similar apps do, and where ours differs

- **Jose's CPA app** (`jvtomax99/cpa-study-app`, `src/intro.js`): a 15 s
  night train ride into its town on every launch, Tap to Start, side
  buttons, a white flash. Its loading line shows real progress. Ours plays on
  every start too, but is shorter (about 4 s before the tap) and skips
  on a tap, because the Hub is opened between patients to find a word
  fast.
- **Genshin Impact and Honkai: Star Rail** (start screens, from memory; not
  re-checked in this session): a scene that is never still, the title
  appearing out of light, one tap to start, music, then a big exit (a flash
  of white through a door; a rush forward in streaks of light). Ours copies
  the living scene, the single tap and the big exit, and drops the long
  wait: a game is opened to play, the Hub to work.
- **Apple's guidance on launch screens** (Human Interface Guidelines,
  "Launching"; from memory, not re-checked): a launch screen is not a
  branding moment and should get out of the way. Ours goes against that on
  purpose (Jose's call), so it keeps the rest: it skips on a tap and never
  waits for the network.

## Decided (Jose, 2026-11-05)

1. **The pavilion photo is Jose's own,** so it ships in the app and is kept
   in `docs/mockups/opening/`.
2. **The title on the badge: each person picks it once.** "Staff
   Interpreter" by default; More gets a **Badge title** field (Per Diem
   Interpreter, Coordinator, anything short), kept on the phone
   (`ih_badgeTitle`).
3. **Sound is on by default, quiet,** and only after the tap. More's
   **Opening** card gets a **Sound** switch next to on / off and Replay.

## As built (2026-11-05)

- **Deciding, before the first paint:** index.html's first script (before
  `<head>`). It plays unless `ih_opening` is `off`, the address has
  `?open=` (a notification), `sessionStorage.ih_opReload` is set (the
  reload after an update sets it just before reloading, and it is used
  once), or the screen's shortest side is 600px or more (a tablet or a
  computer). That script runs before the viewport tag, when a phone still
  reports a 980px page, so it reads the screen, not the page. It then sets
  `html.op-cover`: the opening's still over everything, until
  `openingStart()` mounts (the first line of index.html's main script),
  never more than 6 s. With it, `html.op-on`, until the ring starts
  opening into Home (`opFrame`; `openingFinish` for a skip; a Replay sets
  it too): the page's background (what an iPhone paints behind its clock;
  it was Home's `#f4f6fa`, a white strip over the dark scene, Jose,
  2026-11-05) and the `theme-color` (`syncTheme` in index.html) take
  `--op-top`, the pavilion's top edge per light (app.css). Evening
  `#1a1923` was measured on Jose's phone; morning and midday come from the
  clips' top edge, dimmed the same, not yet seen on a phone.
- **Resume:** nothing to do. Coming back from another app doesn't run the
  page's scripts again, so the opening can't play.
- **The timeline** is the mockup's, on one clock (`opFrame(t)`): lockup
  0.2-2 s, the badge drops at 1.3 s and has settled at 2.05 s
  (`OP_BADGE_AT`; a tap before that skips to Home with a 260 ms fade);
  after the tap: lower 0-0.5 s, scan 0.5-0.95 s (beep), green at 0.95 s
  (chime, wink, the lanyard pulse, the glow), "Welcome in" 1.05-2 s, the
  ring 1.7-2.5 s (a mask on the scene, so the live Home shows inside it),
  then `hub-opening-done`. Escape skips; Enter or Space taps.
- **The stage** is the mockup's 390 x 844, scaled to fit the screen
  (`--op-k`, the smaller of width/390 and height/844); the pavilion loop
  covers the whole screen behind it.
- **The loop:** `opening/pavilion-1.mp4` (H.264, 0.7 MB, what iPhones
  and Chrome play) and `.webm` (VP9, 0.25 MB, for browsers without H.264),
  584 x 1264, 8 s, every motion a whole number of cycles in 8 s so it
  joins seamlessly. Rendered from the mockup's scene (the photo on its
  depth map, the light from its own sky, faint dust) with its drift made
  periodic; the still `pavilion-1.webp` (15 KB) is frame 0. `sw.js`
  precaches the MP4 and the still, carries them over from the last
  version's cache instead of downloading them again on every deploy, and
  answers an iPhone's Range requests from the saved clip. A new clip must
  get a new name (`pavilion-2`). If a phone won't autoplay it (iPhone Low
  Power Mode), the still stays: the same picture, not moving.
- **The light by time of day** (Jose's pick, 2026-11-05, from four ways
  to raise the opening): the phone's clock picks one of three looks,
  morning 5-11 (`pavilion-morning-1`: warm, softer gold shafts), midday
  11-4 pm (`pavilion-1`, as first built) and evening and night 4 pm-5 am
  (`pavilion-evening-1`: blue hour, darker, faint cool shafts, less
  dust). `openingLook(h)` in `features/opening.js`; index.html's first
  script makes the same choice for the cover (`data-op-look` on `<html>`).
  The badge takes the light too: a touch warm in the morning, dimmer and
  under a cool wash in the evening (never a hue shift: that turned Dr.
  Smiley blue). Each look is the same photo graded and lit, rendered from
  the mockup's scene; no lit windows (the photo is daylight). The three
  stills are precached; the morning and evening loops are saved the first
  time each plays, and `sw.js` carries everything in `opening/` over
  between versions. Not in this version: weather, seasons, sunrise times
  by date, a sunset look.
- **Dr. Smiley on the card** is `drSmileyArt()` on his smile frame, the
  wink frames on green. The team's rank outfit is hidden on the card
  (`.op-pic .lv-acc`): bare-headed, like the photo on a real badge.
- **Sound** is made on the phone (Web Audio, nothing to download): the
  mockup's beep, chime and swell, at a lower volume, only after the tap.
  On iPhone it follows the silent switch.
- **Music** (Jose, 2026-11-05: "music similar to" Genshin Impact's start
  screen, then "softer and warming, like harps, piano and violin"; picked
  draft 2 and "start on tap"; 2026-11-06: "music from the moment the app is
  opened", picked "try at open"): `opening/music-1.m4a`, an original 28 s
  seamless loop (E major, 68 bpm: harp arpeggios the whole way, a soft
  piano melody, then a solo violin takes it, low strings under). Made from
  code, no samples or recordings, by `docs/mockups/opening/music/compose.py`
  (`python3 compose.py loop.wav`, then AAC 96 kbps at -16 LUFS); nothing
  in it comes from the game. Fetched when the opening mounts (precached
  and carried over by `sw.js`, 0.34 MB) and started at once
  (`opMusicAtOpen`): the AudioContext is made outside a tap, so it starts
  paused unless the browser allows sound before a touch, and `resume()`
  is asked for. Where it is allowed it plays from the first second; where
  not (iPhone; headless Chromium in the tests behaves the same) it stays
  paused, and the tap on the badge wakes it (`opAudio`) and it starts
  from the top. Whether an Android phone with the Hub on its home screen
  allows it was not checked on a phone or in Chrome's own pages (blocked
  from this session); the test for that path launches Chromium with
  `--autoplay-policy=no-user-gesture-required`. Gain .4 under the beep and
  chime; it fades out over 4 s once the opening hands over to Home, in
  0.4 s on a skip, Escape or the phone going to another app
  (`opMusicStop`). Replay is itself a tap, so there it plays while the
  badge waits, on every phone. More's Sound switch covers it. A new piece gets a new name
  (`music-2`).
- **Tap to enter** (Jose, 2026-11-06: still no music at open on his
  iPhone; after hearing why, picked "Add 'Tap to enter'"). Where the
  AudioContext is still paused once the opening mounts (iPhone: no sound
  before a touch), `OP.gate` is set: the lockup plays as usual, the badge
  waits, and the line where "Tap your badge to begin" goes says "Tap to
  enter". The first tap (or Enter or Space) wakes the audio inside that
  touch (`opAudio`), so the music starts from the top, and `opEnter`
  starts the badge's own clock (`OP.wait` holds it back; `bt` in
  `opFrame`). It is not a skip: a second tap while the badge drops still
  skips to Home, Escape still skips at any time. No gate with Sound off,
  in Still, or where the audio is already running (Replay, a phone that
  allows sound before a touch; if the audio wakes by itself while it
  waits, it goes on without the tap). Costs iPhone users one tap per
  start, the price Jose chose.
- **Home's hello waits:** `home-polish.js` holds the startup hello and the
  name pen's 6 s cap while `hubOpeningUp()` is true, and starts them on
  `hub-opening-done`.
- **More's Opening card** (above Measure smoothness): Badge opening,
  Sound and My photo on the badge switches, the Badge title field (28 characters, empty means Staff
  Interpreter), Replay the opening (goes Home first; not during a timed
  exam).

## Log in or link your account (Jose, 2026-11-06)

A glass pill, **Log in or link your account**, in the open space between
the badge and the reader (stage y 522, 40 tall; on a 393 x 759 phone it
sits 469-505, the badge ends at 382 and the reader starts at 575). Only on
a phone not signed in to an account (`ih_account` has no uid,
`openingAcctShow`); signed in, it isn't drawn at all. It fades in and out
with "Tap your badge to begin" (and with Tap to enter), and leaves on the
badge's tap (`opAcctFade`); while faded it takes no taps (pointer-events
none), so a tap there is still the opening's own.

Tapping it (`openingAccount`) closes the opening with the skip's fade,
then opens the sign-in that fits: a phone already in the team
(`isHubMember`) gets More with **Your account** open over it (email, then
the 6 numbers: this phone becomes the account, "link"); a phone not in the
team gets the team-code screen switched to **Sign in with email** (an
account already in the team, "log in"). Enter or Space on the focused
pill is the pill's, not the badge's.

Not in this version: signing in on the opening itself.

## Your photo on the badge (Jose, 2026-11-06)

Asked for: "the option to replace the picture on the badge with Dr.
Smiley with another picture". Jose picked the photo he already added with
his name (his Team Chat picture) over a separate badge-only upload, and,
told it goes against the no-photo rule above (a real face, name, HMH logo
and title together look closer to a real badge, and can be screenshotted),
chose it anyway, **opt-in**: off unless each person turns it on.

- **More's Opening card: My photo on the badge** (`opPhotoSwitch`,
  `ih_badgePhoto` = `on`, this phone only). With no photo yet, it stays
  off and the toast says where to add one (the initial at the top right).
- **Which photo:** `ih_myPhoto` (index.html saves it beside your name on
  this phone), only while its name matches `ih_myName`
  (`openingMyPhoto`). No photo or another name: Dr. Smiley, as before.
  A photo added on another phone (it follows the name, so the account)
  was never in this phone's `ih_myPhoto`, so the switch said "Add a photo
  first" (Jose, 2026-11-06). Now it falls back to the team list's photo for
  your name (`memberPhotoFor`), and the team list's listener saves your
  photo into `ih_myPhoto`, so the next start has it before the list loads.
  The opening never waits on it: Dr. Smiley is drawn underneath and the
  photo fades over him once it has loaded (`.op-photo.is-in`; he is then
  hidden under it, `.op-pic.is-photo`). A photo that can't load removes
  itself and Dr. Smiley stays.
- **Dr. Smiley steps off the badge** (Jose, 2026-11-06, the same day): at
  first he moved to a small round seal in the card's corner; Jose wanted him
  elsewhere on the screen, didn't like the flat cut under his shoulders
  (he was drawn head and shoulders only), and sent full-body clips of him.
  Now he stands at the bottom right, by the reader (`.op-dr`, 190px tall on
  the 390-wide stage, measured clear of the badge at rest and as it comes
  down for the scan, the reader, Tap your badge and the Hub's name). He
  comes in with the reader, does a gentle wave on a loop while the badge
  drops and waits, and on green his big grin and wave (`opDrFrame`).
  - **The clips** (`opening/smiley-wave-1.*`, `smiley-grin-1.*`, made by
    `docs/mockups/opening/smiley-body/`, its README): each is a video with
    his colours on top and a black-and-white matte below; every new frame
    is drawn onto a canvas with the matte as its see-through amount
    (`opDrDraw`). A video with real transparency plays only in some
    browsers (VP9 in Chrome, HEVC in Safari); this plays in all of them.
    MP4 first, WebM for a browser without H.264.
  - **His still** (`smiley-wave-1.webp`, `smiley-grin-1.webp`) shows until
    a clip has drawn, so the opening never waits on them; in Still or
    Reduce Motion it is all there is (the grin on the tap). Low Power Mode
    on an iPhone, which stops videos, leaves the still too.
  - **Not saved ahead** in `sw.js`'s first list (only people with the photo
    on use them): the first open fetches them, and the `opening/` rule
    keeps them from then on. Until then, his still.
  - A photo that can't load puts him back on the badge (`op-photo-on` comes
    off the opening).
- The square photo fills the tall slot (`object-fit: cover`), so its
  sides are trimmed.
- **Not in this version:** a badge-only photo separate from your chat
  picture; moving or zooming the photo inside the slot; his other two
  clips (thinking, sad then cheering up; not saved yet) and his full body
  anywhere else in the app.

## Checks

`tests/suites/opening.cjs`, "your photo on the badge": the photo over him
once loaded; Dr. Smiley off the badge, on the screen and clear of the
badge, the reader and the words, at rest and on green; his wave drawn cut
out (solid in the middle, see-through at the corner), the grin on green,
his clips let go after; a still in Still, grinning on the tap; Dr. Smiley when the switch is off, when the photo is
another name's, and when it can't load; More's switch off by default,
refusing with no photo, on and off on this phone.

"log in or link your account": the pill between the badge and the reader,
clear of both, unseen and untappable before the badge arrives, on top
(`elementFromPoint`) once it has; its tap closes the opening onto Your
account (a phone in the team) or the team-code screen's email sign-in (a
phone not in it); not drawn on a phone signed in to an account.


A new suite, `tests/suites/opening.cjs`: it plays on a fresh start and not on a resume; not with `?open=`; a tap before the badge skips
it; after it, nothing is left over Home (`elementFromPoint` reaches Home's
search); Still takes the short path; it never adds a wait to Home's first
draw. The other suites start with the opening switched off
(`ih_opening` = off), so they never see it.

## Pins on your lanyard (2026-11-07)

Jose picked it from the ideas offered 2026-11-05 ("pins you earn on your
lanyard"), then "Build it" on the plan below.

- **What:** each CoreCHI practice badge you have earned (the eight in
  `BADGES`, `index.html`, kept in `ih_practice_badges_v1`, which follows
  your account since E2) is an enamel pin on the lanyard: the badge's emoji
  on its own colour, a gold rim, a glare. The first earned sits lowest, by
  the clasp; each newer one 17 px above, a little to either side, tipped its
  own way. All eight fit on a phone above the clasp (measured).
- **New ones click on:** a badge earned since this phone's last opening
  (`ih_pinsSeen`, per phone, not synced, so each phone has its moment)
  drops onto the strap as the badge settles, one after another, with a ring
  of light (`opPinsFrame`). Remembered when the opening closes, only if it
  had its moment (a skip before the badge arrives keeps it for next time).
  Still: simply there, and remembered.
- **The list** is `OP_PINS` in `features/opening.js` (ids, icons, colours),
  because the opening runs before `index.html` defines `BADGES`;
  `tests/suites/lanyard-pins.cjs` holds the two lists together.
- **Others looked at:** Duolingo and Apple Fitness keep awards in a gallery
  inside your profile; Disney's pin-trading lanyards wear them where they're
  seen. Here they show at the moment you see every day, the badge-in.
- **Tap the lanyard, see your pins** (2026-11-07, Jose's pick over tapping
  each pin: 24 px pins that overlap are too small a target, and a near miss
  would scan the badge). An invisible strip 58 px wide over the pins
  (`.op-pinhit`) opens a card (`opPinsOpen`): every pin, newest first, its
  name, what earned it and the day. The opening waits; Back to your badge, a
  tap around the card or Escape closes only the card. Before the badge has
  arrived, at Tap to enter, or after the badge tap, the strip passes the tap
  on as before. `OP_PINS` carries each badge's note too (the suite checks
  names and notes against `BADGES`).
- **Not in this version:** new kinds of badge, pins not yet earned shown as
  outlines, teammates seeing your pins, choosing which pins show, a sound
  for the click.
- **Not proven from here:** the emoji are Apple's on an iPhone (the checks
  run with Chromium's), so the faces look a little different there.
