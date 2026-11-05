# The opening (Badge in)

The first thing the Hub shows on the first open of the day: your staff
badge drops in on its lanyard in front of the Helena Theurer Pavilion, you
tap it, it scans green, and the green ring opens into Home. Jose,
2026-11-05, after about fifteen mockups ("I want an opening similar to the
CPA app... not with the train moving"). **Status: plan only, no code yet.**
The picked mockup is in `docs/mockups/opening/` (video and stills).

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
   **Dr. Smiley sits where the photo goes**; there is no photo, barcode or
   number, so it can never pass for a real ID. It swings, catches the
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

**When it plays.** The first real start of the day only (`ih_openingDay`
holds the date it last played). Never when a notification opened the app
(`?open=`), never on the reload after an update, never during an exam or
practice timer. A tap before the badge arrives skips straight to Home. More
gets **Replay the opening** and an **Opening** switch (on / off).

**Who it is for.** Everyone on the team, on their phone, once a morning.
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
- Anything from a real ID: no photo, barcode, employee number or
  department code, ever.
- A badge per role or per teammate in colour or layout (only the title
  changes).
- Real sound design (v1's sounds are simple placeholders).
- Playing on desktop: phones only at first.

## What similar apps do, and where ours differs

- **Jose's CPA app** (`jvtomax99/cpa-study-app`, `src/intro.js`): a 15 s
  night train ride into its town on every launch, Tap to Start, side
  buttons, a white flash. Its loading line shows real progress. Ours is
  shorter (about 4 s before the tap) and once a day, because the Hub is
  opened between patients to find a word fast.
- **Genshin Impact and Honkai: Star Rail** (start screens, from memory; not
  re-checked in this session): a scene that is never still, the title
  appearing out of light, one tap to start, music, then a big exit (a flash
  of white through a door; a rush forward in streaks of light). Ours copies
  the living scene, the single tap and the big exit, and drops the long
  wait: a game is opened to play, the Hub to work.
- **Apple's guidance on launch screens** (Human Interface Guidelines,
  "Launching"; from memory, not re-checked): a launch screen is not a
  branding moment and should get out of the way. The reason ours plays once
  a morning, skips on a tap, and never waits for the network.

## Decided (Jose, 2026-11-05)

1. **The pavilion photo is Jose's own,** so it ships in the app and is kept
   in `docs/mockups/opening/`.
2. **The title on the badge: each person picks it once.** "Staff
   Interpreter" by default; More gets a **Badge title** field (Per Diem
   Interpreter, Coordinator, anything short), kept on the phone
   (`ih_badgeTitle`).
3. **Sound is on by default, quiet,** and only after the tap. More's
   **Opening** card gets a **Sound** switch next to on / off and Replay.

## Checks (when built)

A new suite, `tests/suites/opening.cjs`: it plays on the first open of the
day and not the second; not with `?open=`; a tap before the badge skips
it; after it, nothing is left over Home (`elementFromPoint` reaches Home's
search); Still takes the short path; it never adds a wait to Home's first
draw. The other suites start with today's `ih_openingDay` set, so they
never see it.
