# Team access

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
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
calls wait for `hubAuthReady`. Rules are tested against the Firebase emulator
(firebase-tools + `@firebase/rules-unit-testing`; run the emulators with the
proxy variables unset or cross-service Storage lookups silently fail).
