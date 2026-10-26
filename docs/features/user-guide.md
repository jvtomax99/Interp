# The User Guide (Guide 2.0)

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. The front page, its
search and the install steps (`renderUserGuide`, `guideHomeHtml`,
`setupGuideSearch`, `GUIDE_INSTALL_STEPS`) are in
`features/guide-front.js` (since 2026-10-24); the answers are
`guide/topics.js`. Keep this in step with the code.

**The User Guide (Guide 2.0).** The answers are one list, `GUIDE_TOPICS`
(with `GUIDE_SECTIONS`, in `guide/topics.js` since 2026-10-21: plain data,
loaded by a `<script src>` just before `index.html`'s script, so every
reader below finds it by name as before);
Dr. Smiley (`askRetrieve`) and global search read it, so it has to match the
app. The guide screen is search-first: the box filters answers (every word
required, words in the question count most), and its last row hands the
same words to Ask (`guideAsk`, patient-detail warning still applies). Topic
tiles open in place (`guideSection`, not navigation). An answer opens in a
sheet (`guideOpenSheet`, an `.overlay`, so Back closes it); some draw their
steps with small copies of the real controls (`GUIDE_STEPS`, keep in step
with the text). "Show me" (`guideShowMe`, `GUIDE_COACH`) dims the app and
lights the real button; it is not an `.overlay`, so the tab bar and the
dock stay visible, and Back/Escape close it. One Dr. Smiley at a time: the
guide's is in the search box; for a dock "Show me" it steps aside
(`body.gd-coaching`, then `smileyRider.sync()`, since the rider's observer
doesn't see body classes) and the tip has no face. "Copy link" gives
`?guide=<id>`, opened at startup. The first-week list and "New" badges are
on this phone only (`ih_firstWeek`, `ih_guideSeen`).

**The 1-minute video** (54.5 s since 2026-10-26; `promo/hub-blend/BRIEF-60s.md`) (answer `promo`, first in "Getting started"). Its
`<video>` (`media/hub-promo.mp4`, poster `media/hub-promo.jpg`, made from
`promo/hub-blend/`, the 3D remake, 720x1280, since 2026-10-23; v12 before it) sits in the answer's text; tags are stripped for
search and Ask, so it doesn't pollute them. `promoPlayer` gives it our own
controls (play, time, seek, sound, full screen; the phone's are off because
the iPhone's full-screen player hides its X while playing, Jose: "no X to
exit"). Full screen (`.is-theatre`) is the same element fixed over the page
(never moved in the page, so playback is never interrupted), with an X that never
hides; Back, Escape, the X or the end leave it, and closing the sheet pauses
the video. It marks it watched
(`ih_promoSeen`) at the end or past 15 s; Home's bubble stays (Jose, 2026-10-19:
he watched it and the bubble vanished) and its ring stops turning (`.is-seen`).
`watchPromo()` opens the answer over Home (no navigation, Back closes it) and
starts it with sound, which the tap allows. The button itself is
`addPromoBtn` in `home-polish.js`, styled at the end of `home-polish.css`:
a story bubble (Jose's pick, 2026-10-19): `media/hub-promo-thumb.webp` in a
slowly turning ring of the promo's colours (paused with the petals when the
banner is off screen, still for reduced motion), a play badge, "Watch" on a
dark glass chip (the banner's bottom fades pale there). Bottom-right of the banner, its right edge on Search's, 9px above it, in the
band beside the Hackensack sign (never over it).
