# Cleanup list

Last audit: 2026-11-11, after phase "the notes trim" (#264, #265). The first audit on record.

The audit itself changed nothing; what was cleaned afterwards is under
"Done" at the end. Line numbers are as measured at the audit: `index.html`'s
are about 40 lower now, `app.css`'s up to 190 lower. Made by running
`docs/cleanup-audit.md`. An item is taken off this list when it is done, and the numbers stay
as they were, so a gap is a finished item.

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
- Not found by this method: code used only by other unused code (the second pass, after
  items 1 to 3 were removed, is still to run), and unused functions
  nested inside another function.
- Not looked for in depth: database or API calls made twice. None turned
  up, so nothing was added to `SPEC.md`, "Later".
- Checked and clean: every picture, clip and sound in `pins/`, `city/`,
  `drsmiley/`, `opening/`, `figures/` and `media/` is used; all 110 paths
  in `sw.js`'s list exist; every suite in `tests/suites/` has its line in
  `run.cjs`; `home-polish.css` has no unused class; no function name is
  declared twice at the top level.

## Unused code

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
    path is right when run from inside `tests/`). Also `tests/support/fonts/urls.txt`. Sixteen more tools
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

## Rules

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

## Done

- 2026-11-11: items 1, 2, 3, 18 and 19 (Jose's pick, "Clean up the
  low-risk ones"). Out: nine unused pieces of script, two settings read and
  never used, about 190 lines of styles nothing draws (the old doctor
  cards, the old study-goal and "ready" card, the heartbeat strip and its
  three animations, six singles), a wrong line count and a wrong comment,
  ten `export`s nobody imported. Left in from item 3, to measure first:
  `.dl-floor.is-none` and `.prep-fc.is-b2`.
