# Check link

Built 2026-11-25 from the plan Jose OK'd the same day. His picks: "does
it still open", not "is it safe"; build now and show the team the working
button.

## Why

In the Hub a link lives in one place: the **Source link** on a glossary
term. The Link Directory is the list of those. Before this, nobody found
out a source had died until an interpreter tapped it between assignments
and got an error page.

## What it does

A button beside a link, in two places:

1. **Add / Edit term**, under "Source link": **Check link**, before saving.
2. **Link Directory**, on every row: **Check**, for an old one.

Within a few seconds one of four answers shows under the link:

| Answer | Means |
|---|---|
| **Opens** (green) | The page loaded. Shows what the page calls itself (its title), or "It is a PDF file". |
| **Moved** (amber) | It loads, but at a different address, reached only by permanent redirects. Shows the new address. In Add / Edit, **Use the new address** fills the box; the person still presses Save term. |
| **Not found** (red) | The site says the page is gone (404, 410), or there is no site at that name. |
| **Couldn't tell** (neutral) | The site refused the Hub, wants a sign-in, answered with its own error, kept redirecting, or was too slow. Says "Open it yourself to be sure." |

Every answer ends in one small line: "This only checks that the page
opens, not that it is safe or correct." The word "safe" appears nowhere
else.

Other messages, in plain words: an empty box, an address that is not a
web address (an email, say), offline ("You are offline: checking a link
needs a connection."), the daily limit, a phone outside the team, a check
that never came back.

## What it does NOT do

- **Never says "safe".** No scam or virus lookup.
- **No automatic sweep**, no schedule, no badge on dead links.
- **Saves nothing.** An answer is shown and forgotten: no stored data, no
  database rules.
- **Never changes a link by itself.** "Use the new address" only fills
  the box, and is not offered in the Link Directory.
- No page preview, picture or page text beyond the title.
- Not for links in Team Chat, doctor pages or events.

## What "Moved" is careful about

- http to https, `www.` added or dropped, and a closing slash are the
  same page for a person: that is **Opens**, not Moved.
- A temporary redirect (302, 303, 307) is often a sign-in or cookie page,
  so its target is never offered as the new address: **Opens**.

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

Copied: Raindrop's honesty ("Couldn't tell" instead of a false "broken")
and W3C's separate "Moved". Better here: the answer comes in seconds at
the moment the link is being added, and the new address is one tap away.

## The code

- **`api/link-check.js`**, the server. POST `{url}`, team members only
  (`allowTeam`), counted in the daily ceiling of 400 per phone. No AI.
  Answers `{result, reason, title, newUrl, kind}`; `result` is `opens`,
  `moved`, `not_found` or `unknown`; a non-web address is a 400.
  `checkLink()` holds the rules and takes `resolve` and `visit` so the
  tests swap the internet for tables.
- **The risky part**, at the first address and again at every redirect:
  only `http`/`https`, only ports 80 and 443, no name and password in the
  address; the name is looked up and **every** address it answers with
  must be public (`isPublicAddress`, a `net.BlockList` of the private,
  local and reserved ranges, IPv4 and IPv6); the visit then goes to
  exactly the address that was checked (`fetchOnce` pins the look-up), so
  a site cannot answer "public" to the check and "internal" to the visit.
  At most 5 redirects, 8 seconds in all (Vercel stops at 10), the first
  64 KB only, no cookies or sign-in sent, a generic browser name that
  does not mention the Hub. The title comes back as plain text, 120
  characters at most, control and direction-flipping characters removed.
  The address is never written to a log.
- **`features/link-check.js`**, the Hub's side: `linkCheckRun` (the call,
  the answers, a 12 second give-up), `linkCheckField` / `linkCheckClear` /
  `linkCheckUse` for the form, `linkCheckRowButton` / `linkCheckRowOut` /
  `linkCheckRow` for a directory row. An answer belongs to the address it
  checked: typing in the box or opening the form again clears it, and an
  answer that arrives late is dropped (`lcSeq`). Everything from the
  server is drawn through `escapeHtml`; a "new address" that is not
  `http(s)` is neither shown nor offered.
- **Hooks in `index.html`**: the button and answer slot inside the Source
  link field, `linkCheckClear()` where the form sets `fSourceUrl`, the
  button and slot in `renderDirectory`'s row, `.lc-btn, .lc-use` in
  `LIFTS`.
- **Styles**: `app.css`, "Link check". 44px buttons with 16px type on a
  phone; the row button is 32px on a computer.

## What can go wrong

- **Biggest: "Opens" read as "trustworthy".** The standing line under
  every answer is the guard.
- Hospital, journal and government sites often refuse automated visitors.
  Those show "Couldn't tell", so that answer will be common.
- A page can open and still be the wrong page (a "sorry, moved" page that
  loads fine). The title is shown so a person can spot it.
- A site that only speaks IPv6 while the server has none shows "Couldn't
  tell".

## Checks

- `tests/suites/link-check.mjs`, no real internet: the four answers, a
  site that does not exist, refused, too slow, too many redirects,
  internal addresses refused directly, by odd spellings and through a
  redirect, non-web addresses, the title's cleaning, one real visit to a
  server on the test machine (pinned, cut at 64 KB, timed out), a
  non-member refused, the daily ceiling.
- `tests/suites/link-check.cjs`, in the test browser at 393 and 360 wide
  and on a computer: the button in both places, each answer, offline, the
  tap target measured, "Use the new address" fills the box and saves
  nothing, a late answer dropped, dark mode's amber.
- The live site is blocked from a cloud session, so after a deploy Jose
  taps Check on one working link and one dead one himself.
