# Check link (planned, not built)

Jose OK'd this plan on 2026-11-25. His picks: "does it still open", not
"is it safe"; plan now, build once the consistency pass is finished. No
code exists yet. When it is built, rewrite this note to describe the code
and keep it in step with it.

## Why

In the Hub a link lives in one place: the **Source link** on a glossary
term. The Link Directory is the list of those. Today nobody finds out a
source has died until an interpreter taps it between assignments and gets
an error page.

## What it does (version 1)

A **Check** button beside a link, in two places:

1. **Add / Edit term**, next to "Source link": check it before saving.
2. **Link Directory**, on every row: check an old one.

Within a few seconds one of four answers shows under the link:

| Answer | Means |
|---|---|
| **Opens** | The page loaded. Shows what the page calls itself (its title). |
| **Moved** | It loads, but at a different address. Shows the new address. In Add / Edit, a "Use the new address" button fills it in; the person still presses Save. |
| **Not found** | The site says the page is gone, or the site does not exist. |
| **Couldn't tell** | The site refused the Hub, wants a login, or was too slow. Says "open it yourself to be sure". |

Every answer carries one small line: "This only checks that the page
opens, not that it is safe or correct."

Who it is for: any interpreter adding or reading a term, and Jose when
tidying the Link Directory.

## What it does NOT do in version 1

- **Never says "safe".** No scam or virus lookup.
- **No automatic sweep** of every link, no schedule, no badge on dead links.
- **Saves nothing.** A result is shown and forgotten: no new stored data,
  so no database rules to paste.
- **Never changes a link by itself.** "Use the new address" only fills the
  box.
- No page preview, no picture, no page text beyond its title.
- Not for links in Team Chat, doctor pages or events.

## How three similar tools do it (their own help pages, read 2026-11-25)

- **Raindrop.io** (`help.raindrop.io/broken-links/`): checks on a schedule
  only, results "a few hours" later, paid plan. Its own words: "A
  broken-link flag is a hint, not a verdict", because "some sites block
  automated requests".
- **W3C Link Checker** (`validator.w3.org/docs/checklink.html`): a person
  pastes a page, it lists every link and *warns* about ones that moved
  instead of calling them broken.
- **Linkwarden** (`docs.linkwarden.app`): does not check links; it keeps a
  saved copy of the page. Out of our size.

Copied: Raindrop's honesty (hence "Couldn't tell" instead of a false
"broken") and W3C's separate "Moved". Better here: the answer comes in
seconds at the moment the link is being added, and the new address is one
tap away.

## How it is to be built

- **A new endpoint, `api/link-check.js`.** A phone's browser may not open
  another site's page itself, so the Hub's server does. Modelled on
  `api/term-check.js`: POST only, team members only (`allowTeam` from
  `api/_hub-access.js`), counted in the same daily ceiling of 400 per
  phone. No AI, so no cost per check.
- **The risky part.** A server that opens any address a person types can
  be pointed at places it should not reach. So it accepts only `http` /
  `https`; looks the site up first and refuses private or internal
  addresses, again at every hop of a redirect; follows at most 5
  redirects; gives up after 8 seconds (Vercel stops at 10); reads only the
  first 64 KB, only to find the title; sends no sign-in or cookies;
  returns the title as plain text cut to 120 characters, never the page.
  Addresses are not written to logs.
- **The Hub's side, a new file `features/link-check.js`**: the button, the
  four answers, and offline ("You are offline: checking a link needs a
  connection"). It reuses `hubAuthHeaders()`, the call pattern in
  `features/term-lookup.js` and `externalUrl()`. Hooks in `index.html`:
  the Source link field (`fSourceUrl`) and the row built by
  `renderDirectory`.
- **Styles** in `app.css` under "Link check", from the existing tokens;
  the button a 44px tap target, 16px type.
- **A new feature file joins the usual lists**: `sw.js`,
  `.github/bump-version.cjs`, `tests/support/harness.cjs`,
  `docs/ARCHITECTURE.md`, and the feature list in `AGENTS.md`. The
  approved plan named that one `AGENTS.md` line; confirm it with Jose in
  the building chat before editing that file.
- **User Guide, same change**: a new answer "How do I check a link still
  works?" in `guide/topics.js` and a "New lately" card.

One pull request, no migrations.

## Assumptions

- "Checked" means "opens right now"; a result need not be remembered.
- Checking is for team members only, like the AI tools.
- Vercel stops a server job at 10 seconds; a slower site gets "Couldn't
  tell".
- Interpreters want this in the two places above. Worth showing two or
  three of them the plan before building.

## What can go wrong

- **Biggest: "Opens" read as "trustworthy".** The standing line under
  every answer is the guard; the word "safe" appears nowhere else.
- Hospital, journal and government sites often refuse automated visitors.
  Those show "Couldn't tell", so that answer will be common.
- A page can open and still be the wrong page (a site's "sorry, moved"
  page that loads fine). The title is shown so a person can spot it.
- One gap remains in the internal-address guard (a site can change where
  its name points between the look-up and the visit). Low stakes: the
  server has no private network worth reaching and returns only a title.

## Checks before it goes live

- `tests/suites/link-check.mjs`, no real internet: opens, moved, not
  found, site missing, refused, too slow, too many redirects, an internal
  address refused directly and through a redirect, a non-web address
  refused, a non-member refused, the daily ceiling.
- `tests/suites/link-check.cjs` in the test browser at 393 and 360 wide:
  the button in both places, each of the four answers, offline, the tap
  target measured, "Use the new address" fills the box and does not save.
- The four `index.html` checks from `AGENTS.md`, the full suite, a cold
  reviewer, phone screenshots of each answer for Jose.
- The live site is blocked from a cloud session, so the "try this" list
  asks Jose to tap Check on one working link and one dead one himself.
