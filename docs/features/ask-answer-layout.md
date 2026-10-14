# How an Ask answer is drawn

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

**How an answer is drawn (`askTurnHtml`).** Dr. Smiley's byline and the
provenance tag, the headline, then at most one structured block from
`askLayout(t)`, built only from checked data, never from the answer's words:
`term` (the one glossary entry cited, among those sent: EN/ES as the glossary
has them), `ff` (one False Friend: the Spanish word and the English it looks
like), `compare` (a comparison follow-up, `t.fu === 'compare'`, whose two
`t.about` ids are both cited; or a question naming two cited entries), `prep`
(a checked open/continue briefing action: the briefing's own counts and
traps) and `practice` (a practice action: still-learning terms from
`TERM_REVIEWS`, tap to reveal the Spanish). `askLayoutSafe` falls back to the
plain card on any error. Sources are one compact row; Helpful / Correct this a
quiet footer. States: `.ask-wait` (loading + Stop), `is-stopped`,
`is-offline`, `is-failed`, `is-refused`. `renderAskMessages` keeps your place:
it follows only if you're at the end or just asked (`ASK.sentAt`), shows a new
answer from its question (`askScrollNewest`), otherwise leaves you where you
were with a "New answer" button (`askJump`). Only elements with a new `data-k`
ease in (`askEnter`), never on a repaint. Desktop: a 720 px reading column.
