# Kept-on-the-phone saves: the plan

Written 2026-11-26. Jose's decision the same day: **all four steps**
("Order of work"), each its own change waiting for his push. Step 1 is
live (#297, build b1126.1318; `team-terms.cjs`); step 2 is built
(`doctor-outbox.cjs`; "Step 2, as built" below); steps 3 and 4 are not.
`docs/PLAN.md`, Next, item 4.

The first table and "The problem" describe the Hub before step 2: a
doctor, a tip and a doctor's team term are kept on the phone now.

## The problem, in one paragraph

A term or a chat message saved with no signal is kept on the phone and
sent later (the "outbox": the list behind the "unsent" badge). Seven
other saves are not: a doctor, a provider, a doctor's tip, a doctor's
team term, an event, a file on a term, and deleting a chat message.
With no signal they say "needs a connection" (since #292). On Wi-Fi
that is connected but dead they wait for ever and say nothing.

## What I recommend

Build it for everything that is text, in three small changes. Leave
files as "needs a connection", and give uploads a real "this stalled"
message instead. Fix one bug found while reading, whatever you decide
(see "Found on the way").

## What each save needs

"Explicit id" means the phone names the record before sending it. That
is what makes sending it twice harmless, and it is the outbox's first
rule (`index.html`, "Offline outbox").

| Save | Today | To go through the outbox | Risk |
|---|---|---|---|
| Doctor, add or edit | Phone already names the record (from the doctor's name). Writes only the sheet's fields. | The outbox learns "write only these fields". | Low |
| Doctor's tip, add, edit, delete | "Add this one to the list" and "take this one out", done by the database. | The outbox learns "add to a list" and "take out of a list". | Low |
| Doctor's team term, add, delete | The phone sends its **whole copy** of the list. | First change it to add and take out one at a time, like tips. Then as tips. | Medium today, low after |
| Provider, add or edit | The database names a new record. | The phone names it instead. Its photo is separate (Files, below). | Low |
| Event, add, delete | The database names a new record. | The phone names it. The list shows it at once, marked as waiting. | Low |
| Chat message, delete | Deleted outright, then its photos are deleted from storage. | The delete waits in the outbox; once it is sent, its photos are deleted too. The message hides on this phone at once. | Medium (see 2 below) |
| File on a term; a provider's or doctor's photo; a chat photo | Uploaded to storage first, then a record points at it. | **Not in this version.** | n/a |

No database rule changes: same records, same kinds of write. Nothing
for you to paste in the Firebase console.

## What can't go through, and why

**Files.** The outbox lives in the phone's small text storage, about
5 MB shared with the glossary's copy (not measured per phone; the usual
browser limit). One photo after shrinking is a few hundred KB, a PDF up
to 25 MB. Keeping files would need a second, different store on the
phone (a new kind of stored data, so its own plan). Instead, in this
version: if an upload stops moving for about 20 seconds, cancel it and
say "The file didn't upload. Check your connection and try again."
Cancelling an upload is safe, because the record that points at the
file is only written after the upload finishes. That closes the "waits
with no message" hole for files without storing them.

**Things that rewrite a whole shared list or many records at once:**
the domain list, joining two duplicate doctors, a CSV import, Team
access. Sent late from an old copy, these would undo teammates' work.
They stay "needs a connection". Never queue them.

**Not in this version, could follow later if asked** (same recipe, each
small): pinning and unpinning an announcement, adding a CoreCHI
question, removing a Recent Update, credits, a place's icon.

## What can go wrong

1. **A late save beats a newer one.** You edit a doctor with no signal;
   a teammate edits the same doctor an hour later; your phone reconnects
   and your older edit lands last and wins. Terms already behave this
   way. Firestore's own offline mode has the same rule ("for multiple
   changes to the same document, it's last write wins"). It is narrow
   here because a doctor save writes only the sheet's fields and tips go
   one at a time. I would accept it and say so in the User Guide.
2. **A deleted chat message is still on teammates' phones until yours
   reconnects.** Someone deletes a photo posted by mistake in a
   basement, sees it vanish, and believes it is gone. It is not. The
   message must say it plainly: "Hidden on this phone. Teammates still
   see it until you're back online." and the unsent badge counts it.
   This is the one I would ask the team about.
3. **Two phones add the same doctor offline.** Both get the same record
   name; the second save lands on top of the first. Same as two phones
   doing it online today. Tips are not lost.
4. **Editing a tip a teammate also edited** leaves both versions showing
   (nothing lost, one to delete by hand).
5. **A save the database refuses later** (the doctor was deleted
   meanwhile, the phone left the team) goes to the Unsent changes sheet
   with its full text, to send again, copy or discard. That exists
   today; the sheet needs a readable title for each new kind.
6. **The phone's storage fills.** The outbox holds 200 changes and
   refuses the 201st with a message, keeping the draft. Doctor records
   are bigger than terms; how big is not measured yet and is the first
   thing to measure.
7. **Opening the Hub with no signal.** Doctors are kept on the phone
   from the last visit, so they show. Providers and events: not checked
   yet whether they show on a cold open with no signal. If they don't,
   keeping their saves helps only when the signal drops mid-visit.

## Assumptions (tell me which are wrong)

- Interpreters do add tips and doctors where the signal is bad
  (elevators, basements, imaging). If they only ever do it at a desk,
  the tips and doctors part is still worth it for dead Wi-Fi, and
  providers and events are optional.
- "Last one to arrive wins" is acceptable for doctors, as for terms.
- A waiting delete may be undone from the Unsent changes sheet before
  it is sent.
- No patient information is involved: same fields as today, nothing new
  is stored except the same save, waiting.

## How similar tools do it

- **Firestore's own offline mode** (firebase.google.com/docs/firestore/manage-data/enable-offline):
  queues writes and applies last write wins; says nothing to the person
  about what is waiting. The Hub can't turn it on (it crashed iPhones,
  `docs/FACTS.md`), and ours is better in one way: the badge and the
  Unsent changes sheet show what is waiting and what was refused.
- **Workbox Background Sync** (developer.chrome.com/docs/workbox/modules/workbox-background-sync):
  keeps failed requests and retries them; on browsers without the
  background feature it retries only "every time the service worker is
  started up", so on an iPhone the app has to be open. Ours has the same
  limit and should say it: changes send the next time the Hub is open
  with a signal. It also does not retry anything the server answered
  with a refusal; ours keeps those to review, which is better.
- Trello's offline page did not load (404), so no third comparison. Not
  guessed.

## Found on the way (a bug that is live now)

Saving a doctor's sheet, and adding or deleting a doctor's team term,
send that phone's whole copy of the doctor's team terms. The doctor list
is read once when the Hub opens, not kept live. So a phone open since
the morning that edits a doctor can erase a team term a teammate added
at noon. Read in the code (`features/doctor-sheets.js` line 300,
`index.html` `persistDoctorDirectoryEntry` and `saveDoctorTerm`) and
reproduced against the tests' stand-in database (4 of 6 checks in
`team-terms.cjs` fail on the old code); not reproduced on two real
phones. Fixed in step 1. Found while fixing: merging duplicate doctors
never moved the other doctor's team terms (it read a field no doctor
has); they went to Recently deleted with the duplicate. Fixed in the
same step.

## Step 2, as built (2026-11-26)

**Measured first.**

- A doctor's record is too big to keep whole. The research on one doctor
  is up to 16,000 tokens of output (`api/doctor-research.js`), tens of KB
  as text; 200 of those would be several times the phone's 5 MB. So an
  edit is kept as **only the fields that save changed**: 232 bytes for a
  changed specialty on a doctor carrying 50 KB of research
  (`doctor-outbox.cjs`). Real records on the live database were not read
  (a cloud session can't reach it).
- Providers and events do **not** show on a cold open with no signal:
  neither is kept on the phone (`loadProviders` is one read with nothing
  saved; events are a live listener with nothing saved). Read in the
  code, not run on a phone. So in step 3, keeping their saves helps when
  the signal drops mid-visit or the Wi-Fi is dead, not when the Hub is
  opened in a basement. Doctors are kept on the phone and do show.

**What an outbox entry can say now** (`applyQueuedWrite`, `index.html`,
"Offline outbox"). Plain text in the entry, turned into the database's
own marker only when it is sent:

| In the entry | Means | Used by |
|---|---|---|
| `mergeFields: [names]` on a `set` | write only these fields | a new doctor |
| `listAdd: { field: [items] }` | add each to the list, by the database | tips, team terms |
| `listRemove: { field: [items] }` | take each out of the list | tips, team terms |
| `dropFields: [names]` | remove those fields | the old single note becoming a tip |
| `filesAfter: [paths]` | delete these files once the write is in (`deleteFilesAfter`) | a doctor's replaced photo; step 3's chat delete |

A list add and a list remove on the same field (a tip edit) go as two
updates in one batch. Sending any entry twice changes nothing more.

**How each save goes.**

- **The doctor's sheet** (`doctorSheetEntry`). An edit is an `update` of
  the fields that changed. Three reasons: the entry stays small; a save
  that arrives late can only overwrite the fields it touched, not put
  back what a teammate changed elsewhere on the sheet; and a doctor
  deleted or merged away on another phone is refused ("removed or merged
  on another phone") instead of coming back as a record. That last part
  is a change: before, saving the sheet of a doctor deleted elsewhere
  re-created the doctor. A new doctor is a `set` of the sheet's fields;
  so is Add doctor with a name this phone already lists (the doctor may
  have been deleted elsewhere, and adding should make them again).
- **Tips and team terms**: `listAdd` / `listRemove`, as before but
  through the outbox.
- **Doctor Prep's own save after a search** and **joining duplicate
  doctors** are not kept: the first only runs right after an online
  search and carries the whole research, the second must never arrive
  late. A merge with no signal now says "needs a connection" (it used to
  wait for ever).

**This phone's copy.** The doctor list is read once per opening, so
`loadDoctorDirectory` puts the waiting doctor changes back on top of
what the database answered (`doctorsWithWaiting`), and the list is read
again after waiting doctor changes are sent or refused: a refused change
stops showing as if it were saved, and is in the Unsent changes sheet
with a readable title (`describeOutboxEntry`).

**Dead Wi-Fi coming back.** The phone gets no "online" signal then, so
while changes wait and the phone says it is online, the outbox tries
again after 30 seconds, then twice as long each time nothing went, up
to 5 minutes (`scheduleOutboxRetry`). This also helps terms and chat.

**The cold review (2026-11-26)** found three things, fixed before the
pull request: a change refused while the doctor list was being read
showed as saved; Add doctor over a name deleted elsewhere was refused;
the Unsent sheet said "Changed: photo" for a doctor with no photo on
file. Its leftovers are under Later in `docs/PLAN.md`.

**Not done here:** a doctor's photo is still an upload, so choosing a
new one needs a connection (the save around it is kept).

## Order of work, one change each for your "push"

1. **Team terms one at a time** (the bug above). Nothing looks
   different.
2. **The outbox learns three things** ("only these fields", "add to or
   take out of a list", "delete these files after"), then doctors, tips
   and team terms go through it.
3. **Providers, events, chat delete**, with the wording in 2 above.
4. **Uploads that stall say so.**

Each one: the forced-failure checks (`tests/tools/stress-fail.cjs`: no
signal, dead Wi-Fi, refused) extended to its saves, the User Guide's
"offline" answers rewritten, a cold review before the pull request.

## Done when (for `SPEC.md`, once OK'd)

With no signal, or on Wi-Fi that is connected but dead, saving a doctor,
a tip, a team term, a provider or an event, or deleting a chat message,
answers within 12 seconds, shows on this phone, is counted by the unsent
badge, and reaches the team when the Hub is next open with a signal. A
file that can't upload says so within about 20 seconds.

## Will NOT do in this version

Keep files on the phone. Queue the domain list, doctor merges, CSV
imports or Team access. Warn when a teammate changed the same doctor
meanwhile. Send while the Hub is closed.
