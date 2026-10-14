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
  doctor". Where = place pin, place name, floor. Team tip = the doctor's
  `notes` with `updatedBy` (count 0 or 1) until D2 adds `tips`.
- Tabs (`ds-mode-seg dp-tabs`, scrolls sideways): one per research tier
  (`researchTiers`), then Team terms (`customTerms`). Old flat research
  (`terms` with no `tiers`) is one "Terms" tab plus the "Older research"
  prompt. The active tab is `activeResearchTier.detail`.
- Rows: English 17/650, Spanish 17/550 navy, definition 14 ink-soft;
  EN / ES buttons (`speakText`, en-US / es-US), 34px to see and 44px to hit
  (`::after`), 12px apart so the hit areas never touch. Under the text: In
  glossary, or Add to glossary; team terms add Remove and who added it.
  Add all N new, the target domain, Research again, source and who updated.
- Glass bar: Start appointment (`doctorPagePrep` sets `PREP` from the
  doctor's specialty, then `startAppt`; asks first if one is running),
  Flashcards (the briefing deck, `setCategory('prep')`; `openPrep` if no
  domain matches), Add tip (the doctor's sheet focused on Notes).
- Edit (pencil, top right) and Add tip close the page, open the doctor's
  sheet, and `closeDoctorDirModal` reopens the page (`doctorPageReturnTo`).

**Redraws** go through `refreshDoctorDirDetail()` (keeps the scroll);
buttons pass a row number, `DP_ROWS` holds the rows on screen.

`initialsOf` now skips middle initials and trailing credentials
("Dr. Lori A. Leslie, MD" is LL); it is shared with chat avatars.
