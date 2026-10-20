# The doctor's page

Since 2026-10-14 (D1 of the Doctors redesign, `docs/PLAN.md`). Jose's
approved mockup: `docs/mockups/doctors/page.png` (HTML beside it). Code in
`index.html`: banner "Doctor page" (`renderDoctorDirDetail` and its
helpers), CSS block "Doctor page" after the `ds-mode-seg` rules. Checked by
`tests/suites/doctor-page.cjs`.

**Where it lives.** Still `#doctorDirDetailOverlay` / `#doctorDirDetailModal`
(classes `dp-overlay`, `dp-page`), so Back, Escape and navigation close it
like any sheet, and the term sheet and photo viewer open over it. Full
screen up to 760px wide (the page itself scrolls); above that a 640px sheet
(the overlay scrolls). Top bar and bottom bar are `position:sticky` in
whichever of the two scrolls.

**What it shows.**
- Header: the photo (tap = photo viewer), else the specialty's pin in a soft
  tile with the initials badge. Pin: `specialtyPinKey(specialty, place)`,
  the `SPECIALTY_PINS` list (regex to pin key), fallback the place's pin
  (`groupIconKeyFor`). D3 reuses it for the list. Name 22/650; the dot and
  the tint come from `specialtyColor()`.
- Bento: navy tile = every term (research + team terms), one bar per tab
  (false friends pink, team terms white); no research = "Research this
  doctor". Where = place pin, place name (up to 3 lines), floor. Team tip =
  the first tip (up to 3 lines), who wrote it and the count; tap = the Team
  tips sheet. Jose tried layout B (one-line Where, tip strip, no navy tile)
  on 2026-10-20 and kept this one for its look; it was made compact
  instead: hero tile 64px, the short empty-tip text, the tab's description
  and the trust line in one block. Measured at 393x759 (typical: 7 terms,
  10-word definitions, no tip): first term at 503px (was 562), row 149px
  (was 171), 1 full row above the glass bar (was 0). Worst (37 terms,
  25-word definitions, long name, tip, place): 0 rows, the first term's
  text at 564px shows above the bar (was 576px).
- Tabs (`ds-mode-seg dp-tabs`, scrolls sideways): one per research tier
  (`researchTiers`), then Team terms (`customTerms`). Old flat research
  (`terms` with no `tiers`) is one "Terms" tab plus the "Older research"
  prompt. The active tab is `activeResearchTier.detail`. The tabs are
  sticky 62px down, right under the top bar.
- Rows: English 17/650, Spanish 17/550 navy, definition 14 ink-soft;
  EN / ES buttons (`speakText`, en-US / es-US), 34px to see and 44px to hit
  (`::after`), 12px apart so the hit areas never touch. Under them the
  glossary pill (`.dp-gl`, 30px, 44px to hit, 14px below ES): "+ Glossary"
  or a quiet "✓ Glossary". Research tabs: "From Doctor Prep, not checked by
  the team." above the rows (`.dp-trust`, Jose 2026-10-20); not on Team
  terms. Team terms keep a foot line: Remove and who added it.
  Add all N new, the target domain, Research again, source and who updated.
- Glass bar: Start appointment (`doctorPagePrep` sets `PREP` from the
  doctor's specialty, then `startAppt`; with this doctor already running it
  just goes back to it; with another, it asks first),
  Flashcards (the briefing deck, `setCategory('prep')`; `openPrep` if no
  domain matches), Add tip (the Team tips sheet, over the page).
- Edit (pencil, top right) closes the page, opens the doctor's sheet, and `closeDoctorDirModal` reopens the page (`doctorPageReturnTo`).

**Specialty to domain** (`doctorDomainFor`): `SPECIALTY_DOMAINS` hints
first (specialty regex to domain-name regex, most specific first; Mental
Health is matched as `\bmental health` because "Develop-mental &
Neurology" contains "mental"), then `findBestDomainMatch`. No domain:
Flashcards opens the specialty picker, the appointment runs without one.
Add to glossary still uses `findBestDomainMatch` alone.

**The saved copy has no research.** `doctorDirToCache` leaves out
`researchResult`. Opening a doctor before the directory has loaded fetches
that one document (`doctorPageFetch`); a finished load redraws an open page;
offline the no-research card says the terms need a connection, never "Research
this doctor" (that costs an API call).

**Measured** (`docs/mockups/doctors/d1-review.md`): above the fold, axe,
speed, open questions for Jose (layout A or B, the "not checked" label).

**Redraws** go through `refreshDoctorDirDetail()` (keeps the scroll);
buttons pass a row number, `DP_ROWS` holds the rows on screen.

`initialsOf` now skips middle initials and trailing credentials
("Dr. Lori A. Leslie, MD" is LL); it is shared with chat avatars.

**Team tips** (D2, 2026-10-19; banner "Team tips (D2)"). `tips: [{id, text,
by, at, uid, editedAt?}]` on the doctor's document; `#doctorTipsOverlay`
(`openDoctorTips`, `renderDoctorTips`, `saveDoctorTip`, `deleteDoctorTip`).
- The old single `notes` shows as the first tip (`doctorTips`, by
  `updatedBy`, `id:'notes'`, `legacy`) until someone edits or deletes it;
  then it's written into `tips` and `notes` is deleted. No migration.
  Anyone may edit that one (the note was always open to everyone).
- Yours (`isMyTip`): the tip's `uid` is this phone's; a tip with no `uid`,
  your name. Others' tips show no Edit or Delete. Client-side only: the
  rules give `team()` the whole document, as before.
- Writes are one `arrayUnion` / `arrayRemove` each (`doctorTipWrite`), so
  two phones adding at once both keep theirs. `persistDoctorDirectoryEntry`
  saves with `mergeFields` minus `tips` and `notes`, so the sheet, Doctor
  Prep, team terms and merges never write a stale copy of them back (it
  also keeps research that a copy without it would have erased). `whole`
  (restore from Recently deleted) writes everything. Merging duplicates
  moves the others' tips and old notes onto the kept doctor.
- The doctor's edit sheet has no Notes box any more (Jose, 2026-10-19).
- Search, the list card and Ask the Hub read the tips (`doctorTipsText`).
- Back closes the top overlay (the last `.overlay.show`), so it closes the
  tips sheet before the page under it.

**The list** (D3, 2026-10-19; `docs/mockups/doctors/list.png`). In
`renderDoctorDirectory`: `doctorListCard` per doctor in `.dl-grid` (two
columns on a phone, `auto-fill` 200px on a computer), the standard finish.
- Card: the photo, else `specialtyPinKey` in a tile tinted by
  `specialtyColor`, the initials badge; name 17/650; specialty with its dot;
  the floor (`locationDetails`) or "No floor yet"; labels from
  `doctorListCounts`: terms (research + `customTerms`), traps (the
  falsefriends tier), tips (`doctorTips`, old note included). No research:
  "+ Prep terms" (`researchThisDoctorFromDirectory`, Doctor Prep filled in),
  shown only when `DOCTOR_DIR_STATE` is ok.
- The saved copy has no research, so `doctorDirToCache` keeps `_n:{terms,
  traps}` for the labels. `persistDoctorDirectoryEntry` drops `_n`.
- The whole card opens the page (role=button, Enter/Space). Edit is the
  page's pencil; Delete is in the doctor's sheet (`deleteDoctorFromSheet`,
  hidden when adding).
- Navy "+ Add" (`DOCTOR_ADD_BTN`) at the end of the section head; the
  topbar has no add button on this screen.
- Duplicates and old terminology: one "N things to tidy" button
  (`doctorTidyCount`: each duplicate group, plus 1 if any doctor is on the
  old terminology) opening `#doctorTidyOverlay` with the same banners. A
  running update shows on the list instead. The sheet redraws after a merge
  and closes when nothing is left.
