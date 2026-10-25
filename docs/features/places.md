# Places (where a doctor works) and their icons

Since 2026-10-14. Code in `index.html`: banner "Places (shared)" (data,
icons, `savePlace`) next to `HMH_LOCATIONS`. The "Where" picker and the
doctor's add and edit sheet (`openAddDoctorDirModal`) are in
`features/doctor-sheets.js` (moved out of `index.html` 2026-10-25).

**Jose's decisions:** icons are his pin artwork (`pins/*.webp`), with the HMH
mark for hospitals that have no specialty of their own; anyone can change a
place's icon (logged in Updates); stored with no Firebase console step.

**Shared, one document.** `terminology-meta/places`:
`{ places: { <placeId>: { name, region, icon, custom, by, at } } }`.
`placeId(name)` is a slug of the name. Written with `set(..., {merge:true})`
one key at a time, so two people changing two places never overwrite each
other (Firestore merges nested maps key by key; the test stand-in does too).
`startPlacesListener()` keeps `PLACES` live; a change re-renders the
directory and Provider Pictures. `terminology-meta` already allows any
document, so no rules change. Never write places on
`terminology-meta/categories` (`saveCategoriesMeta()` overwrites it whole).

**Which places exist.** `placeList()`: every `HMH_LOCATIONS` site except the
network name, places the team added (`custom: true`, with a region), and any
group name already on a doctor or provider (no region unless added).
`regionOfGroup()` reads `HMH_LOCATIONS` first, then `PLACES`.

**Icons.** `PLACE_ICONS` (26: the HMH mark plus pins). `groupIconKeyFor(name)`
= the shared choice, else `defaultGroupIcon(name)` (cancer, children, rehab,
behavioral, teaching, research, heart by name; other HMH sites the HMH mark;
anything else the clinic pin). The old per-phone choices (`ih_groupIcons`,
line icons) are no longer read. Group headings show the pin at 34px in a 44px
button; the picker (`openGroupIconPicker`) is a grid of pins.

**The doctor sheet.** One "Where" button (`fDDPlace`, `ddPlace`) replaced
the group dropdown, "Other", "location as written" and Region fields; "Floor,
suite or room" stays. The sheet (`openPlacePicker`): search (16px), "No
specific site" (= `HMH_NETWORK_LABEL`), your region's places, the other
region's, then others; "Add a place" (name + North/South). Saving sets
`locationGroup` to the place; `hospitalLocation` keeps Doctor Prep's wording
while the place is unchanged and becomes the place when it moves, so a card
never shows the old building under the new heading. `region` is stored only
for a doctor with no specific site (their old one, or the adder's).

**Provider Pictures (R5, 2026-10-20)** uses the same picker: the sheet's
"Where" button (`fPPlace`, `ppPlace`) plus "Department or unit" (`unit`,
free text, shown after the place's note on the card and searched). The
picker serves both sheets: `openPlacePicker('pp'|'dd')` sets
`placePickFor`, `pickPlace` writes the right value and `placeCount` lists
doctors and providers at a place. Saving sets `locationGroup`; `facility`
keeps its old wording while the place is unchanged and becomes the place
when it moves (the doctors' rule). Old providers keep grouping by
`facility` until edited; nothing is migrated.
