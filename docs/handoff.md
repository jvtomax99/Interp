# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-03,
the doctor list / bold look chat.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `docs/PLAN.md` and `docs/handoff.md`. Work on branch
> `claude/next-after-bold`. Tell me what's being worked on now and what was worked on before, in a few short lines.
> Then ask me with buttons which of the "Next" items below to mock up first. Mockup before any code. Plain words,
> say "working on it" and "done".

## Now: the bold look, next screens

Jose asked for "big visual changes"; the calm first mockup was "too plain". The bold look is now live on the glossary
and Home rails. Pick one of these next (mockup first, his OK, then code, own PR):

- **Stronger term cards.** The colour wash on term cards (`.card[data-term-id]`, `app.css`) is faint for pale domains
  (Genetics). Raise it; keep definitions whole (a card has no tap to open it).
- **Doctor pages.** The doctor list and the doctor's page in the same hero style (big pin or photo, colour hero).
  `docs/features/doctor-page.md` first.
- **Home banner.** Busy (cloud bubble, Watch, the sign). Jose's banner rules are strict: CLAUDE.md "The Home banner
  photo is set per mode" and "Hello banner lettering". Mock carefully, ask before touching.
- Small things still open from the doctor list review: the search box's icon is a text glyph; a lighter panel with a
  hard top edge behind search; data typos "155 Polify Road" (likely Polifly), "Don IMUS"; a teddy bear icon on a
  street address. The Gastroenterology pin (a cup) reads small: its art needs a redraw, not code.

## Before: what this chat did (all live)

- **Doctor list cleanup, #188, live b1103.1859.** One count (no numbers on region tabs), Needs info as a chip,
  "Sort: Place" menu, groups of 1-2 merged into "Other places".
- **Top bar, #189, live b1103.1943.** Phones say "Hackensack UMC" on one line; bar back to 45px.
- **Bold glossary, #192, live b1103.2036.** Colour hero per domain with the 3D pin big, glass search, cards in the
  domain colour; long names step down in size.
- **All domains tiles, #193, live b1103.2225.** One colour tile per top-level domain, tap opens, Back returns; a
  search still lists terms.
- **Home rails, #194, live b1103.2342.** Rail cards with big tilted pins and colour wash; press glow kept.

## Learned, not elsewhere yet

- A helper ran `npm install` in `tests/` once, which installed a Playwright without its browser: every browser suite
  crashed at launch. `tests/node_modules` is git-ignored; delete it and the machine's Playwright is used again.
- Don't switch branches while a full test run is going in the same checkout: the run reads files mid-way.
- Mockups that patch the live page (`page.addStyleTag` / swapping a function by `eval`) are honest and quick; keep
  them in the scratchpad, never in the repo.
