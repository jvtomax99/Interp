# Cleanup list

Last audit: 2026-11-11, after phase "the notes trim" (#264, #265). The first audit on record.

A report only: nothing here has been removed or changed. Made by running
`docs/cleanup-audit.md`. An item is taken off this list when it is done.

**How it was made, and its limits.**
- `npx knip` and `npx depcheck` were run in `tests/` and `promo/`. The app
  has no import lines (plain `<script>` tags, no build), so both tools
  called nearly every file unused: 81 files in `tests/`, 57 in `promo/`.
  That is noise, not a finding. The one real hit is item 14.
- The app itself was scanned by script: every function and top-level
  constant in `index.html`, `features/`, `home-polish.js`, `pin-icons.js`,
  `sw.js` and `api/` counted across the whole repo; every class name in
  `app.css` and `home-polish.css` looked up in the code; every picture,
  clip and sound looked up by file name and by key.
- Each item below was then checked by hand against the ways a scanner
  misses use: a name inside an `onclick="..."`, a class or file name built
  from pieces (`'is-' + state`, `city/${key}-paint${n}.webp`), the service
  worker's list, the tests.
- Not found by this method: code used only by other unused code (a second
  pass after items 1 to 3 are removed would find it), and unused functions
  nested inside another function.
- Not looked for in depth: database or API calls made twice. None turned
  up, so nothing was added to `SPEC.md`, "Later".
- Checked and clean: every picture, clip and sound in `pins/`, `city/`,
  `drsmiley/`, `opening/`, `figures/` and `media/` is used; all 110 paths
  in `sw.js`'s list exist; every suite in `tests/suites/` has its line in
  `run.cjs`; `home-polish.css` has no unused class; no function name is
  declared twice at the top level.

## Unused code (safe to remove)

1. **Nine unused pieces of script.** Each name appears exactly once in the
   whole repo, its own definition. `index.html`: `ECG_STRIP` (line 10625,
   an 18-line heartbeat drawing), `ICON_NOTE` (6903), `ICON_CAMERA_TC`
   (6928), `ICON_CHEV_L_TC` (6934), `ICON_CHEV_R_TC` (6935),
   `ICON_GUIDE_MAP` (6959). `features/doctor-sheets.js:204`
   `openEditDoctorDirModal` (the app calls `_openEditDoctorDirModal`
   directly). `features/sound-alikes.js:109` `setSAMode`.
   `features/voice-check.js:249` `voiceCheckMoreHtml`.
   Why not needed: nothing calls them, no `onclick` names them.
   Improves: about 45 fewer lines downloaded and parsed at every launch,
   and less to read past. Risk: **low**.

2. **Two settings read at launch and never used.** `index.html:1221-1224`
   reads `ih_collapsedDomainGroups` and `ih_toolsCollapsed` from the phone
   into `collapsedDomainGroups` and `toolsCollapsed`. Nothing writes those
   keys and nothing reads those variables.
   Improves: four lines and two storage reads off startup. Risk: **low**.

3. **Styles for things the app no longer draws** (about 75 rule lines in
   `app.css`). No code or markup carries these class names:
   - the old doctor cards, `.doc-card` and its 13 `.doc-card-*` children
     (lines 1488-1576, plus 468, 5421, 7276); the list draws `.dl-card`
     now. `.doc-card` is also still named in the `LIFTS` list
     (`index.html:10830`) and in `tests/suites/feel.cjs:103`, and
     `DESIGN.md:199` lists `.doc-card-name` as a known gap: all three
     change with it;
   - the old study goal and "ready" card: `.study-goal`,
     `.study-goal-note`, `.study-goal-top`, `.study-goal-track`,
     `.ready-card`, `.ready-main`, `.ready-say`, `.ready-stats`,
     `.ready-stat` (3311-3400). `.study-goal-fill` is still named in a
     selector at `index.html:10316`, which then matches nothing;
   - the heartbeat strip of item 1: `.ecg-strip`, `.ecg-line`,
     `.ecg-heart` (4252-4275, 4342-4346);
   - singles: `.cp-face`, `.cp-sh`, `.cp-legend` (3947-4012), `.dl-head`
     (6829), `.dl-floor.is-none` (6852), `.dp-have` (7054),
     `.ask-head-acts` (6093), `.prep-fc.is-b2` (6383, 6390),
     `.domain-chip-count` (924, 7372), `.vc-more` (1240, with item 1).
   Why not needed: the screens that used them were redrawn.
   Improves: a smaller stylesheet on every launch; removes dead rules that
   look live to whoever edits next (the trap `CLAUDE.md` warns about).
   Risk: **low**, with one check: `.is-none` and `.is-b2` sit next to
   names built from pieces (`'is-' + state`), so confirm on the doctor list
   and Doctor Prep by measurement before removing those two.

4. **Unused code in the 3D campus page** (`campus3d/index.html`): `ROOF`
   (line 262), `bollard` (630), `bayDoors` (651), `BACK_LEAF` (1071), each
   seen once. That file is written by `city/live/gen.py`, so the fix
   belongs in the generator, not the page. Improves: little. Risk:
   **medium** (a generated file; needs a rebuild and a look at the scene).

## Repeated code (worth folding into one)

5. **The provider sheet and the doctor sheet carry the same photo code
   twice.** `handlePhotoSelect` (`index.html:15647`) and
   `handleDDPhotoSelect` (`features/doctor-sheets.js:259`) differ only in
   their ids and variable names (checked with a diff);
   `removePendingPhoto` / `removeDDPendingPhoto` and `renderPhotoPreview` /
   `renderDDPhotoPreview` the same. The name sheet's
   `handleMyPhotoSelected` is different code (square crop) and stays.
   Improves: one place to fix a photo bug instead of two. Risk: **medium**
   (both sheets need a real photo picked in a test afterwards).

6. **Reading and saving a setting is written out by hand about 40 times**
   (`try{ JSON.parse(localStorage.getItem(KEY) || '[]') }catch(e){}` and
   its saving twin: `index.html:802`, 1140, 1366, 1487, 2717, 5523, 6032,
   11226, 12850, 15804, 16438, 17554 and more). `features/account.js:27`
   already has the two helpers (`acctRead`, `acctWrite`) but keeps them to
   itself. Improves: about 80 lines; one place that handles a full or
   blocked storage. Risk: **medium** because of the number of places, each
   low alone. A helper's report; three places read by hand.

7. **Three toasts repeat one timer** (`showToast` `index.html:5343`,
   `showUndoToast` 2606, `showOutboxActionToast` 7878), and **four "time
   ago" wordings** (`relativeTime` 10684, `pushAgo` 4672, `teamAccessAgo`
   16169, inline in `reviewWhy` 5546). The wordings differ on purpose in
   places ("active today"), so only the arithmetic would be shared.
   Improves: small. Risk: **low** for the toasts, **medium** for the times
   (visible wording). A helper's report; `showToast` read by hand.

8. **Five ways to make text safe for HTML**: `escapeHtml` and `escapeAttr`
   (`index.html:6855`), `acctEsc` (`features/account.js:29`), a local
   `esc` in `features/opening.js:106` and in `home-polish.js:753`. They
   differ on `'` and on empty values. `home-polish.js` loads before
   `index.html`'s script, so its copy may be there for that reason.
   Improves: one behaviour instead of three. Risk: **medium** (escaping is
   a safety matter; needs a check per caller). A helper's report.

9. **Two picture shrinkers share their scaffolding**
   (`compressAvatarToBlob` `index.html:1307`, `compressImageToBlob` 3399:
   same read, load and save steps, different sizing). Improves: about 20
   lines. Risk: **low**. A helper's report.

10. **False Friends and Sound-Alikes are two copies of one screen shape**
    (`ffSearch` / `saSearch`, `answerFF` / `answerSA`, `nextFF` /
    `nextSA`, `ffMatches` / `saMatches`, the Study layout). Sound-Alikes
    adds audio, so they are close, not identical; the two Drill functions
    were not compared. Improves: a fix lands on both. Risk: **medium**.
    A helper's report.

11. **Icons drawn twice with a different line weight**: `ICON_CHECK` and
    `ICON_CHECK_WHITE` (`index.html:6922-6923`), `ICON_BELL` and
    `ICON_BELL_SM` (6906, 6914), `ICON_X_TC` (6930) and a local `ICON_X`
    (17850). Improves: little. Risk: **low**, but a line weight is a look:
    measure before and after. A helper's report.

12. **The server files repeat their setup** (`api/`): the Firebase project
    and key constants in four files (`_hub-access.js:19`,
    `_push-team.js:22`, `check-events.js:43`, `sign-in.js:32`); a Firestore
    wrapper written four ways; the "is the Claude key set" block in five
    endpoints; the "wrong method" answer in seven; stripping code fences
    from an answer in four (`_routine.js:106`, `term-check.js:157`,
    `translate.js:139`, `doctor-research.js:139`); two base64url helpers
    and two text clippers. Improves: one place to change a project setting
    or an error message. Risk: **medium** (the endpoints spend money and
    hold the sign-in check; their suites cover them). A helper's report.

## Too long

13. **`renderContent` is about 520 lines** (`index.html:8337`): it draws
    Team Chat's shell, the print view, the domain tiles and every term
    card in one function. The next longest are 130 to 160 lines
    (`renderChatMessages` 14198, `render` 7429, `renderPractice` 9522,
    `renderHome` 12461, `submitAsk` in `features/ask-hub.js:502`).
    Improves: a change to term cards no longer means reading the chat
    code. Risk: **high** (the most used screen; back navigation and the
    scroll restore run through it). Not cleanup: a refactor for
    `docs/refactor.md` if Jose asks.

## Files and tools

14. **`tests/tools/rules-e3.mjs` needs a package the tests don't list**
    (`@firebase/rules-unit-testing`; `depcheck`'s one real finding). Its
    header says how to install it by hand, and two feature notes name it.
    Either add it to `tests/package.json` or leave the header as the
    instruction. Risk: **low**.

15. **Two test tools nothing mentions**: `tests/tools/promo-shots.cjs` (16
    lines) and `tests/tools/smiley-clip.cjs` (52 lines; its header gives a
    wrong path). Also `tests/support/fonts/urls.txt`. Sixteen more tools
    are named only in notes (`tests/README.md`, `docs/PLAN-done.md`):
    one-time measuring scripts, kept as the record of how a number was
    taken, so they stay. Risk: **low**.

16. **`promo/`'s Remotion starter looks abandoned**: `promo/src/` is a
    3-second title card, and `promo/package.json` carries Remotion, React
    and TypeScript for it, while the real videos are made in
    `promo/hub-blend/` and `promo/whats-new/` with other tools. Never
    served. Improves: a clearer folder; no licence question (Remotion's
    licence is for small teams). Risk: **low**; Jose's call, it may be
    wanted for a later video.

17. **Pin source art at the repo root** (9.8 MB, never served):
    `pin-icons-source-hd-upload.png`, `medical-pins.png.PNG`,
    `specialty-pins.png.PNG`, and `pin-icons-sheet.webp` (390 KB), which
    `.vercelignore` says the app uses but `pin-icons.js:6` says is no
    longer drawn; only that last one is deployed. Kept on purpose as
    Jose's originals. Option: move them to `docs/art/pin-sheets/` (which
    holds five more sheets) and stop serving the `.webp`. Risk: **low**;
    Jose's call.

## Small things in comments and notes

18. `.claude/agents/scout.md:11` says `index.html` is about 28,000 lines
    (18,407). `api/check-events.js:16` says findings go to `activity-log`
    (the code writes `ce-events`). `tests/tools/smiley-clip.cjs` gives its
    own path wrong. Risk: **low**.

19. **Exports nobody imports** (`api/`): `ask.js:350` exports six names
    used only inside the file; `buildMessage` (`_mail.js:35`),
    `listSubscriptions` (`_push-team.js:65`), `signedAssertion`
    (`_service-login.js:45`), `tidyEmail` (`sign-in.js:41`) the same.
    Dropping the word `export` changes nothing that runs. Risk: **low**.
    A helper's report.

20. **`firestore.rules:153` still allows `terminology-hub`**, the old
    single-document glossary that nothing reads or writes. A rule, not
    data: the documents stay whatever is decided. Removing the line closes
    a door nobody uses; it needs Jose to publish the rules. Risk: **low**.

## Seen on the way, not cleanup

- `api/check-events.js:217` checks the caller's secret only when
  `CRON_SECRET` is set (`if (secret && ...)`). If that setting is missing
  in Vercel, anyone can start the events watcher. Whether it is set can't
  be read from the repo: Jose can look in Vercel, Settings, Environment
  Variables.
