# Recently deleted, and who may remove what

Security pass, 2026-11-15 (Jose's pick and plan). The audit found that any
joined phone could delete anything with no copy kept, empty the bin, clear
Updates, and delete anyone's chat message. Two changes fix it:

1. **The app** (this note's code, shipped first; it works with the old rules).
2. **The rules** (`firestore.rules`, `storage.rules`), which Jose pastes into
   the Firebase console at least 2 days after the app is live, so every
   phone has the new app before the database starts refusing the old ways.

## What it does

- **Deleting a term, doctor, provider or attachment puts its copy in the bin
  first.** The bin entry is named `<collection>__<id>` (`trashIdFor`,
  `TRASH_COLLECTIONS` in `index.html`), because the rules let an item go only
  once that entry exists. No copy, no delete: `trashItem` returns null and
  the caller shows `TRASH_FAILED`.
- **The copy and the delete both go through the outbox** (`queuedWrite`), in
  that order, so an offline delete still works and replays copy first.
- **Restore** writes the item back, then removes its bin entry through the
  outbox (the rules allow that once the item exists again). Anyone can
  restore. The 30-day auto-clean (`loadTrash`) keeps running on every phone.
- **Attachments are restorable** (`restoreTrashItem`, type `attachment`). The
  file stays in Storage on delete, as do provider and doctor photos, so a
  restore brings the picture back. Deleting a term moves its attachments to
  the bin too.
- **Yours means your phone's sign-in** (`myUid`, `isMine`, `canRemove`), never
  the typed name. You edit and delete your own chat messages and remove your
  own announcements and events; owner phones (`isHubOwner`) remove anyone's.
  Only owners see ✕ and Clear all on Updates. Reactions stay open to all.
- Announcements, events, shared results and new uploads now carry the
  poster's `uid` (uploads as Storage metadata), which the rules check.

## What it does not do (v1)

- **Typed names** are still self-reported: anyone can post under any name.
- **Editing** a term's or domain's text stays open to the whole team (it's
  the Hub's job); only removing is guarded.
- **No daily database backups** (needs Google's paid plan; ask Jose).
- **Older items** without a `uid` (messages sent before signing in by email,
  old announcements, the events watcher's finds) can be removed only by an
  owner.

## How others do it

- Slack: you delete your own messages; admins delete anyone's.
- Google shared drives: deletes go to a 30-day trash, and only Managers
  empty it.
- Notion: a 30-day trash.

Where the Hub is better: there, recovery depends on the app or on support.
Here the database refuses a delete that leaves no copy in the bin.

## Checks

`tests/suites/delete-safety.cjs` covers the app side: the named copy, no
copy no delete, offline order and replay, attachment restore, and the
buttons for a teammate and an owner. The rules get their own emulator suite
in change 2.
