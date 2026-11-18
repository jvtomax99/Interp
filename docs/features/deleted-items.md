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
- **Restore** writes the item back through the outbox, then removes its bin
  entry behind it (the rules allow that once the item exists again). A
  restore that fails keeps the copy. An item already back under the same id
  (a doctor's id is their name) asks before it is replaced. A term brings its
  attachments back with it. Anyone can restore. The 30-day auto-clean
  (`loadTrash`) keeps running on every phone.
- **Order holds in every case:** `queuedWrite(entry, { behind })` queues the
  second write of a pair whenever the first was queued (`TRASH_STATE`,
  `queuedDelete`), so a delete never reaches the database before its copy.
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
- **A new sign-in id** (a new phone, cleared browser data) makes earlier posts
  no longer "yours"; the owner can still remove them. The guide says so.
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

## The rules (change 2, 2026-11-18)

Written on top of the other chat's #279 (chat and pins own-or-owner, upload
type and size, the AI daily cap). Added:

- `terms`, `doctor-directory`, `healthcare-providers`, `term-attachments`: a
  delete needs `deleted-items/<collection>__<id>` (`binned`), owners included.
- `deleted-items`: created only under the name its `type` and `payload.id`
  give, dated within the last 7 days (an offline copy may arrive late) and
  not ahead of now (`newBin`); overwritten only while its item exists again;
  removed by an owner, after 30 days by the server's clock (`oldBin`), or
  once its item exists again (`itemBack`, which also covers entries from
  before change 1 with random names).
- `ce-events`: created under your own sign-in; changed or removed by that
  phone or an owner. The watcher's finds are an owner's.
- `activity-log`: anyone adds; only an owner removes.
- `terminology-meta/categories`: the list may not get shorter.
- Storage: a new name only (`resource == null`; the emulator treats an
  overwrite as a create), the uploader's `uid` as metadata, deleted by that
  phone or an owner.
- Practice mode (`practice()`) still opens everything, as before.

Still possible, by design: a teammate can edit a term to junk, or recreate a
deleted term and then replace its bin copy (the copy is overwritable once
the item exists). Both are the same as editing, which stays open. A phone
whose domain list is behind can't save a domain until it reloads (the app
says so).

## Checks

`tests/suites/delete-safety.cjs` covers the app side: the named copy, no
copy no delete, offline order and replay, attachment restore, and the
buttons for a teammate and an owner. The rules: `tests/rules/` (66 cases,
its own GitHub check); the rules before change 2 let 23 of them through.
