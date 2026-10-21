# Notifications (Web Push)

Real notifications, the kind a native app gets: they arrive with the Hub
closed and the phone locked, and the icon shows a count. Built 2026-10-21 on
Jose's report "notifications aren't being delivered" and his ask for owners to
be able to send them.

## Why they weren't arriving

Until this change every notification was made by the open app itself: a
Firestore listener saw a new chat message, training item or edit and called
`showNotification` (`showChatNotification`, `showCeNotification`,
`showActivityNotification` in `index.html`). Nothing on a server ever sent
one. An iPhone freezes a Home Screen app a few seconds after you leave it, so
once the Hub was closed or the screen locked, nothing could arrive. The old
comment said as much ("True push-when-fully-closed additionally needs a
backend").

## How it works now

1. **Signing up (phone).** More → Notifications → *Turn on notifications*
   (`pushTurnOn`, from a tap, which iPhone requires). The browser asks
   permission, then `pushManager.subscribe` with our public key (from
   `GET /api/push`) gives an address at Apple's, Google's or Mozilla's push
   service plus two keys. The app writes it to `push-subs/{id}` (`id` = first
   40 hex of SHA-256 of the address) with `uid`, `name`, `region`, `chat`,
   `ce`, `device`, `at`. `pushSync` keeps that line current on launch, on a
   region change and on each switch; it rewrites only when something changed
   (`ih_pushSig`) or weekly.
2. **Sending (server).** `api/push.js`, with `api/_push-team.js` (the
   fan-out) and `api/_webpush.js` (the encryption, RFC 8291 aes128gcm, and the
   VAPID signature, RFC 8292, in Node's own crypto, no package).
   - **Team Chat**: the sender's phone, once its message is saved (not just
     queued), posts `{kind:'chat', id}` (`pushChatMessage`, called from the
     chat listener, so an offline message goes out when it lands). The server
     reads the message from Firestore (never trusts the request's text),
     skips it if over 15 minutes old, creates `push-sent/{id}` (fails if it
     exists, so each message goes out once) and sends to phones with `chat`
     on that follow the channel (Everyone, their region, or no region) or
     that it @mentions, never the sender's phone (by `uid`, else by name).
   - **Owners**: `{kind:'team', title, body}`. Only a phone whose
     `hub-members/{uid}.role` is `owner`, read with that phone's own sign-in
     token (a forged token is refused by Firestore itself). Typed names
     (Liz, Fabiola) do not count: anyone can type a name. Goes to every phone
     signed up; kept in `push-log/` and listed on the screen as *From the team*.
   - **New training**: `api/check-events.js` sends one notification per run
     to phones with `ce` on (`notifyPhones`), `Urgency: normal`, `Topic:
     events` (a newer one replaces an undelivered one).
   - **Test**: `{kind:'test', id}` to that one phone (*Send me a test*).
   - A phone the push service calls gone (404/410) has its line deleted.
     Only real push-service hosts are ever fetched (`isPushEndpoint`).
3. **Showing (phone).** `sw.js` `push`: always shows a notification (iPhone
   stops delivering to apps that don't), sets the icon badge to the number
   waiting. `notificationclick` focuses the open app on that screen, or opens
   it at `./?open=<section>` (read at startup). Opening the Hub clears the
   badge and the waiting notifications (`pushClearWaiting`).
4. **No doubles.** While push is on, the local chat and training
   notifications stay quiet (`pushCovers`). Team updates (glossary edits)
   stay local only, while the Hub is open: Jose chose chat and training for
   push, not edits (2026-10-21).

## Firestore

| Collection | Who | Rules |
|---|---|---|
| `push-subs/{id}` | each phone writes its own; the server reads all, deletes gone ones | read/delete `team()`; create/update `team()`, fixed keys, `uid` empty or the writer's own |
| `push-sent/{msgId}` | the server, once per chat message | create `team()`; nothing else |
| `push-log/{id}` | the server, with the owner phone's token | read `team()`; create `isOwner()` with its own `uid` |

The server reads with the service account when `FIREBASE_SERVICE_ACCOUNT` is
set, else with the asking phone's sign-in, else unsigned (practice mode). The
addresses in `push-subs` can't be used to send anything without the private
key, which lives only in Vercel.

## Setup (once, by Jose)

1. Vercel → project `interp` → Settings → Environment Variables, for
   Production (and Preview if wanted):
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (a pair made with
   `node -e "import('./api/_webpush.js').then(m=>console.log(m.newVapidKeys()))"`),
   and `VAPID_SUBJECT` = `mailto:` + a contact address. Then redeploy.
   Changing the pair later means every phone has to turn notifications on
   again (their subscriptions are tied to the public key).
2. Firebase console → Firestore → Rules: publish `firestore.rules` (the
   "Notifications" block is new).
3. On a phone: More → Notifications → Turn on → Send me a test.

Until step 1 the screen says "Not set up on the server yet" and chat goes on
as before (local notifications only).

## Limits (true as of 2026-10-21)

- iPhone/iPad: only the Home Screen app, iOS 16.4+. The screen says so in
  Safari.
- Not proven on a real phone from this repo: the cloud session can't reach
  Apple's or Google's push services. What is proven: the server's sealed
  message opens with a receiver written separately from RFC 8291
  (`tests/suites/push.mjs`) and with the `http_ece` library (checked by hand,
  not kept as a dependency), and the VAPID signature verifies.
- A chat push waits on the sender's phone telling the server. A phone that
  sends and is killed in the same second may never ask; the message still
  shows in Chat as before.
- A notification shows even if you're looking at that chat (iPhone requires
  every push to show one).

## Tests

`tests/suites/push.mjs` (no browser): sealing and signing, who hears about a
chat message (channels, regions, @mentions, the sender left out), once per
message, old messages, owner-only sends (member, no sign-in, forged token),
clipping, gone phones removed, planted addresses never fetched, the test
push, training alerts.
