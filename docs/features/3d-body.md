# 3D Body cards

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
The Hub's side (`anatomySync`, the bridge, the cards) is in
`features/3d-body.js` since 2026-10-22 (moved verbatim out of `index.html`);
other code named here is in `index.html` unless a file is named. Keep this in
step with the code.

**3D Body cards.** Tapping a structure in the viewer shows a card (the
viewer's `app/hub-card.tsx`): English name, Spanish under it, a speaker for
each (the Hub's `speakText`), what it is, Open glossary / Practice this term /
Ask Dr. Smiley, and Sources. The text is `atlas/hub-catalogue.json` (FMA ids,
names, explanation, sources with what each supports; read when the 3D Body
opens, never generated). Anything not listed shows "Spanish name not added
yet" and "About this body system". The bridge (`ATLAS`, `atlasOnMessage`,
`atlasAction` in `features/3d-body.js`; `app/hub.ts` in the viewer) accepts only
ready / card / action from the frame on screen; the Hub resolves the glossary
match itself (`atlasGlossaryMatch`: exact name, never partial), runs the
action, and sends back only the match state and, on return, your place
(`ATLAS.mem`, memory only). Practice opens Term Review on that one term and
records nothing until answered (asks first if a session is in progress). Ask
gets the structure as `context.anatomy` plus its card as an `an:` entry
(`api/ask.js` `cleanContext`); offline, he answers from the card.
