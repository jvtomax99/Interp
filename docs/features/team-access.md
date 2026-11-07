# Team access

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
**Locked since 2026-11-07** (Jose; 41 phones had joined): practice mode is
off and every rule is enforced.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**Team access (one team code).** Everyone types the same team code
(`hub-invites/{CODE}`, kind `team`); the owner shares it and can change it on
the Team access screen, optionally signing every other phone out. The owner
has a separate owner code (kind `owner`) for their own phones. Entering a code
signs the phone in anonymously and creates `hub-members/{uid}`, with `who` =
the name set on that phone (self-reported). Every rule is `if team()` = joined phone OR practice
mode. Practice mode (`hub-access/settings.practice`) is the owner's switch;
while it's on nothing is enforced. The first owner is claimed once via
`?setup=owner`. The AI endpoints check the same thing through
`api/_hub-access.js`, and the app sends `hubAuthHeaders()`. Startup database
calls wait for `hubAuthReady`. Exception: `term-reviews` (each person's
practice record) also checks the phone's `who` against the record's
(`ownReview`; `knowledge-brain.md`, K2). Rules are tested against the Firebase emulator
(firebase-tools + `@firebase/rules-unit-testing`; run the emulators with the
proxy variables unset or cross-service Storage lookups silently fail).

**Titles in Team Chat** (`chatTitleHtml`, 2026-10-15). Under a sender's name
above their messages. *Admin*: each phone that joined with the owner code
writes its own `hub-admins/{uid}` = `{ name, at }` (`publishHubAdmin`, on
launch from `checkMyMembership` and on a name change from `syncAccessWho`;
only when the name differs from `ih_adminName`). Everyone listens to that
collection (`startHubAdmins`). New messages carry `uid` (the sending phone);
the rules hold it to that phone and stop an edit changing it, so the title
follows the phone, not a typed name. Older messages without `uid` are matched
by name. The owner-code tag reads *Administrator*. Titles by name,
`NAME_TITLES` (case and spaces ignored; anyone typing the name gets it; they
win over the owner-code one): *Supervisor of Language Services* for Liz Lind,
Elizabeth Lind, Liz Lind-Smith, Elizabeth Lind-Smith; *Administrator* for
anyone whose first name is Fabiola, with or without a last name (Jose,
2026-10-15). Rules
tested in the emulator (38 cases: owner/member/stranger, locked and practice).
Without the published rules the collection is refused and there are simply
no Admin tags.
*By account* (2026-11-07, email sign-in E3): the owner gives a title to an
email account on this screen (`hub-titles`); once given, the name rule it
came from stops matching anyone else. `docs/features/email-sign-in.md`,
"As built (E3)".
*On Home*: your own title shows in the hello, a smaller copy of the Chat ribbon
centred under the heart line (Jose: "in alignment with the heart"), never into
Dr. Smiley or past the banner's edge; one line when it fits, else two even
lines (`helloTitle` in `home-polish.js`, placed by `heartline.place`; who has
one: `window.myHubTitle` in `index.html`, which counts this phone's own owner
code or its line in `hub-admins`, never a name match against that list).
*Developer* (Jose, 2026-10-15): Jose's title, over Administrator. By name,
"Jose V…"/"José V…" with any last name from V (plain "Jose" doesn't count),
and by phone: the Hub owner's phone (`hub-access/owner.uid`, read into
`ACCESS.ownerUid`, through `hubOwnerUid()` because `ACCESS` is declared later
in the script). Names are compared without accents (`titleKey`).
Jose (2026-11-06) asked that "Jose V" count as Jose Vazquez the Developer:
the title already did (above, and by account since sign-in moved
`hub-access/owner.uid` to his account id). What didn't was his face: chat
photos and colours were filed by exact name, so "Jose V" showed a plain
circle. Now a message from an email account (`uid` "acct_...") shows the
photo of the name that account goes by now (`chatFaceName`,
`refreshChatFaceNames` beside `memberPhotoFor`: this phone's own name, the
owner line in `hub-admins`, then the account's newest message with a
photo), for everyone, not just Jose. Accounts only, on purpose: a plain team
phone can pass between people, so its messages keep the exact-name match,
and so do messages sent before signing in. Matching any "Jose V..." name to
his photo was turned down: anyone typing that name would get his face.

