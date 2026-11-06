# Email sign-in: one account, every phone

Jose, 2026-11-06: "Let's have the ability of accounts syncing based on a
code sent to their email." The spec; three phases at the end, one pull
request each. **E1 is built** (2026-11-06): `api/sign-in.js`, `api/_mail.js`,
`customToken` in `api/_service-login.js`, `features/account.js`, the
`accounts` rule, checks `tests/suites/sign-in.mjs` (server) and
`tests/suites/account.cjs` (phone). It works once Jose's setup below is
done; until then More says "Email sign-in isn't switched on yet". E2, E3: not yet.

## What it does

A teammate types their email in More, gets a 6-digit code in their inbox
a few seconds later, types it into the Hub, and is signed in. They do the
same on their second phone (or a new phone), and both phones show the same
person: the same name, photo, practice score and settings.

Diagram Jose saw: https://claude.ai/artifact/STgWsnT1BmC28kUqbPsRCk

**Who it's for.** Interpreters who use two devices (a work phone and their
own), anyone who gets a new phone or clears Safari, and the team as a
whole: today a phone *is* the person, and who you are is a name anyone can
type ("Liz Lind" gets the Supervisor title on any phone). An account by
email ends that.

## Why a typed code and not an emailed link

Looked at, 2026-11-06:

- **Slack** signs in by email: you type your address, Slack emails a
  confirmation code, you type it in
  ([Slack help, Sign in to Slack](https://slack.com/intl/en-gb/help/articles/212681477-Sign-in-to-Slack)).
  Its help also tells people stuck without the email to check spam and ask
  IT to allow Slack's mail, the same risk we have with hospital mail.
- **Firebase's own email sign-in** (built in, free) sends a *link*, not a
  code. On iPhone a Home Screen app keeps its own storage, apart from
  Safari, and a link opens in Safari, so it would sign in Safari, not the
  Hub. A code typed into the Hub avoids that. This is the main reason.
- Firebase has no built-in email *code*, so we build it: our server makes
  and checks the code, then hands the phone a Firebase sign-in ticket (a
  "custom token", signed with the service account key; Firebase docs,
  [Create custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens):
  signed by a service account's key, valid one hour, the phone signs in
  with `signInWithCustomToken`).

Where ours does better than both: only a phone that already joined the
team (team code) can ask for a code, so a stranger typing an email gets
nothing sent; and the code works inside the installed app.

## How it works

1. **Ask for a code** (`api/sign-in.js`, action `send`). The phone sends
   the email with `hubAuthHeaders()`; `api/_hub-access.js` refuses phones
   that haven't joined. Limits: 3 codes per email per hour, 10 per phone
   per day. The server makes a random 6-digit code, keeps only a salted
   hash of it for 10 minutes (`sign-in-codes/{hash of email}`, written
   through `api/_service-login.js`, closed to phones by the rules), and
   emails it.
2. **Send the email** (`api/_mail.js`, new). Gmail's mail server with an
   app password, over Node's own `tls`, no new package (there is no
   `package.json`; same choice as `_service-login.js` and `_webpush.js`).
   From the Hub's own Gmail (Jose's pick, 2026-11-06: a new Gmail just for
   the Hub, not his own, so codes never sit in his Sent folder).
3. **Check the code** (action `check`). 5 wrong tries and the code is
   gone. On a match: the code is deleted, the account's id is made from the
   email (`acct_` + a hash, the same on every phone), and the server returns
   a custom token for it.
4. **Carry the phone's place over.** The account id is new, so the server
   copies what the old phone id had: `hub-members/{account}` (team or
   owner), the owner's `hub-access/owner.uid` if this phone was the owner,
   and `hub-admins/{account}`. Without this, signing in would lock Jose out
   of his own Team access screen.
5. **The phone signs in** (`signInWithCustomToken`) and syncs (below).
   Signing out goes back to a plain phone: the team code again.

## What syncs (phase E2)

Kept per account in `accounts/{id}` (only that account can read or write
it; rules applied by hand in the console, as always):

- name (`ih_myName`) and profile photo (`team-members`, keyed by account
  instead of the typed name)
- CoreCHI practice: score, history, streak, badges (`ih_practice_v1`,
  `ih_practice_streak_v1`, `ih_practice_badges_v1`)
- Dr. Smiley's memory of you (`ih_smileyMemory`)
- memory trainer (`ih_memory`, `ih_memFlags`), Daily Drill (`ih_warmup`),
  campus progress (`ih_campusLv`, `ih_campusDone`, `ih_campusSky`),
  knowledge log (`ih_knowledgeLog`)
- settings: theme, region, how lively Dr. Smiley is, the opening

**First sign-in on a second phone merges, never overwrites:** practice
history is joined (each answer once), streak and levels keep the higher,
settings take the account's. Sync happens when the app opens and after a
change; there is no live link between two phones open at once.

Phase E3: Term Review records (`term-reviews`, today keyed by typed name,
`ownReview` in the rules) and titles in Team Chat move to the account.

## Not in this version

- No passwords, and no Google, Apple or hospital (Microsoft) sign-in.
- Not a way in without the team code: the team code still lets a phone
  join; email only says *who* you are.
- No live sync between two phones open at the same time.
- No "sign out my other phones" and no deleting an account from the app
  (the owner can delete `accounts/{id}` in the console if asked).
- Per-phone conveniences stay per phone: collapsed sections, caches,
  unsent chat drafts, the outbox, the smoothness meter.
- No patient information, ever (`AGENTS.md`, Not building). An email
  address is the only new personal thing stored, and only as a hash in the
  account id; the address itself is kept in `accounts/{id}` so More can
  show "Signed in as …".

## What Jose sets up once (before phase E1 goes live)

1. Make the Hub's Gmail (e.g. `humc.interp.hub@gmail.com`).
2. Turn on 2-Step Verification on it (Google requires it for an app
   password), then make an app password.
3. Vercel, project interp, Settings, Environment Variables: two entries,
   `GMAIL_USER` (the address) and `GMAIL_APP_PASSWORD` (the app password,
   pasted there only, never in chat).
4. Publish the new rules (`accounts`, `sign-in-codes`) in the Firebase
   console, as with every rules change.

Already done: `FIREBASE_SERVICE_ACCOUNT` is set on Vercel (checked
2026-11-06), so the server can sign the custom token and write the codes.

## Risks, said plainly

- **Hospital email filters** may hold or delay automated mail; work
  addresses may get codes late. Personal email is the safer default; the
  screen says to check spam.
- **Gmail's limit**: about 500 emails a day for a personal Gmail (Google's
  page, support.google.com/mail/answer/22839; not re-checked here, third
  party guides agree). The team needs a handful a week.
- **Google discourages app passwords** and could turn them off for
  personal accounts. If it does, the fallback is an email service
  (Resend or similar) and a ~$10/year web address; only `api/_mail.js`
  changes.
- **The owner moving to an account id** (step 4) is the one step that can
  lock Jose out. Tested in the Firebase emulator before E1 ships.

## As built (E1), and what is not proven yet

- The code box survives the Hub restarting while you read Mail
  (`ih_accountPending`, 10 minutes).
- Signing in on a phone leaves its old phone id in `hub-members` (the
  owner's Team access list may show that phone twice). Harmless; tidy later.
- `hub-access/owner.uid` moves to the account when the server checks the
  code, before the phone has used its ticket. If that last step failed,
  the owner's "Developer" title by phone would point at no phone until he
  signs in; the title also matches his name, and his owner powers come
  from `hub-members`, which the account has. Checked in `sign-in.mjs`.
- **Not proven against the real services from here** (the cloud session
  can't reach them): that Firebase accepts the ticket from this service
  account (shape from its docs; signature and claims checked in the test),
  and that Gmail takes the sign-in (the conversation checked against a fake
  mail server). The first real sign-in after Jose's setup is the proof.
- The new `accounts` rule must be published in the Firebase console, or
  the name doesn't follow (sign-in itself still works: the server writes
  with its own login).

## Phases

- **E1, sign in.** `api/sign-in.js`, `api/_mail.js`, More's Account card
  (email, code, signed in as, sign out), the place carry-over (step 4),
  rules for `sign-in-codes` and `accounts`, emulator tests, a suite for the
  screen with the email stood in for. Name and photo follow the account.
  User Guide answer and a New lately card.
- **E2, sync.** The list above, the merge rule, tests for two phones
  merging.
- **E3, identity.** Term Review and Team Chat titles by account; the
  `ownReview` rule by account id.
