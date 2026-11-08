# Regions (North and South)

Since 2026-10-14 the Hub is shared by two interpreter regions: North (the HUMC
side) and South (the Shore side). Code is in `index.html` (banner
"Regions", next to `canonicalLocation`).

**A region is a view, not a wall** (Jose's decision). Everyone reads
everything; no rule in `firestore.rules` mentions regions, and nothing here
needed a rules change. A region decides these defaults:

- **Team Chat** has three channels: Everyone, North, South. Everyone and your
  own region badge and notify; the other region only shows a count on its tab
  (and still notifies when it @mentions you). With no region picked, all
  channels notify, as before.
- **Doctor Directory** opens on your region; chips switch to the other region
  or All regions for the visit. A search always spans every region.

**Your region** is per phone: `localStorage` `ih_region` (`myRegion()`,
`setMyRegion()`). Asked inline once (`regionAskHtml`) in chat and the
directory; changed in the name sheet ("My region"). Not stored in the database.

**Which sites are which** (Jose, 2026-10-14): `region` on each
`HMH_LOCATIONS` entry. North: HUMC, John Theurer, Sanzari, the School of
Medicine, CDI, Mountainside, Palisades, Pascack Valley, JFK and JFK Johnson.
South: Jersey Shore, K. Hovnanian, Ocean, Southern Ocean, Riverview, Bayshore,
Shore Rehab, Raritan Bay (all three), Carrier. The network name has none.

**Doctors.** `doctorRegion(d)` = the region of the doctor's place
(`regionOfGroup`, which also knows places the team added or moved; see
`places.md`), else `d.region` (2026-11-04: the place wins, so moving a place
moves its doctors; it used to be `d.region` first). Since places, the edit sheet has no Region field: the place
decides, and `region` is stored only for a doctor with no specific site. No region = shown
in every region, never hidden. A new doctor at a site that doesn't say (or a
Doctor Prep search under "Hackensack Meridian Health") gets the adder's region
in `region`. No migration: existing doctors get their region from their
location at display time.

**Namesakes.** Directory ids used to be the name alone, so a second Dr. Garcia
in another region merged into (and overwrote) the first. `doctorDirIdFor()`:
the first keeps the plain key; another region's namesake gets
`<key>--<region>`. Same region, or a record with no region, is still treated
as the same person. The duplicate-doctors check skips pairs in two known
regions.

**Chat storage.** One stream, `team-chat`, as before; a message's `channel`
(`north` / `south`) places it, and no `channel` means Everyone (every message
from before regions). So a launch reads exactly what it did (the newest 200
across all channels), there is no index, rules change or migration. Trade-off:
the 200-message window is shared, so a busy channel shortens the others'
history. Unread is per channel (`chatSeen`, `unreadInChannel`); the tab bar
badge counts followed channels (`unreadChatCount`). Typing markers carry the
channel. Switching channel drops a reply or edit in progress. A phone still on
an older version shows every channel's messages in one thread until it updates.

## Pins, events and the top bar (R4, Jose, 2026-11-08)

Plan: South's interpreters saw North's pins and HUMC's name. Not in this
version: hiding anything, a rules change, regions on the watcher's events
(CHIA, CCHI and NCIHC are statewide or national), notification changes.
Slack and Teams keep a pin in its own channel only, so a team-wide one is
repeated; here Everyone's pins show in every channel.

- **Pins follow the channel.** `addAnnouncement` stores `channel` (`north` /
  `south`) when pinned in a region's channel; none means Everyone (every pin
  from before). `pinsForChannel()`: Everyone's in every channel, a region's
  only in its own, marked "North only" / "South only". Switching channel
  redraws the strip (`setChatChannel`). The pin sheet says where it will
  show (`#fAnnouncementWhere`). The listener still reads every pin.
- **Team-added events can carry a region** (`#fEvRegion`, "For", default
  Everyone): stored as `region`, shown as a small tag (`.ce-region`) beside
  the source. A tag, never a filter.
- **The hospital line under the title** follows your region
  (`regionOrgName`, `applyRegionBrand`, run at load and from
  `syncRegionControls`, which `setMyRegion` and the account sync call):
  South reads Hackensack Meridian Health (short: Hackensack Meridian), North
  and no region Hackensack University Medical Center (Hackensack UMC). The
  exam seal's line too. The page `<title>` and the manifest are unchanged
  (one installed app for both).
