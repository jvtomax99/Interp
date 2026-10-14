# The User Guide (Guide 2.0)

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**The User Guide (Guide 2.0).** The answers are one list, `GUIDE_TOPICS`;
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
