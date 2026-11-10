# Architecture: HUMC Interpreter Hub

Short map, written 2026-11-10. For every file's full role, see the File map
in `CLAUDE.md`; feature detail is in `docs/features/`. Read this first
instead of exploring the code.

## Shape

A static web app (PWA) with no build step, served by Vercel, plus a few
serverless functions in `api/`. Data lives in Firebase (Firestore and
Storage, project `language-specialist`). AI answers come from the Claude
API, called only from `api/`, never from the phone.

## Main folders and key files

| Path | Role |
|---|---|
| `index.html` | The app's markup and most of its JS (18,407 lines on 2026-11-10), split into sections by banner comments |
| `app.css` | Styles for every screen but Home |
| `home-polish.css`, `home-polish.js` | Home's look and behaviour, loaded after `app.css` so they win |
| `pin-icons.js`, `pins/` | Which pin each domain and tool gets; one pre-cut `.webp` per pin |
| `features/` | 22 feature files moved out of `index.html` (Ask the Hub, Translate, campus, account, opening and more) |
| `guide/`, `practice/`, `falsefriends/`, `soundalikes/`, `memory/` | Plain data: User Guide answers, CoreCHI questions, word lists, memory lines |
| `api/` | 14 files: the endpoints (`translate`, `term-lookup`, `term-check`, `doctor-research`, `ask`, `push`, `sign-in`, `check-events`) and shared helpers (names starting with `_`) |
| `sw.js` | Service worker: offline copy, update rules, push notifications |
| `atlas/`, `brain/`, `campus3d/` | Separate pages run in frames: 3D Body, the two brains, the 3D campus |
| `city/`, `drsmiley/`, `opening/`, `figures/`, `media/` | Pictures, clips and the promo video |
| `tests/` | The checks (`node run.cjs` inside `tests/`), run on GitHub on every push |
| `docs/` | `PLAN.md` (phases), `features/` (one note per feature), mockups, art |
| `firestore.rules`, `storage.rules` | Firebase rules, published by hand in the console |
| `vercel.json` | Deploy rule, the daily cron, the walled-off headers for `atlas/` |

## Load order

`index.html` links `app.css` then `home-polish.css`, loads `home-polish.js`
in `<head>`, then the data files and the 22 `features/*.js` files with plain
`<script src>` tags, then its own inline script, then `pin-icons.js` just
before `</body>`. The Firebase SDK (compat 10.12.2 from gstatic) loads in
the background (`firebaseReady`); `db`, `storage` and `hubAuth` are `null`
until it arrives.

## How data moves

1. **First paint from the phone.** The app draws from `localStorage` caches
   (`ih_glossary_cache_v1` for terms, `ih_doctorDirectory` for doctors) before
   Firebase is ready. Settings and personal state are `ih_*` keys.
2. **Firestore, the shared truth.** One document per term in `terms/`.
   Other collections: team chat, doctors, reviews, practice, events, team
   access, accounts, push subscriptions. Full list: "Data model" in
   `CLAUDE.md`. The Hub is locked: only joined phones or signed-in team
   accounts pass the rules.
3. **AI through `api/`.** The phone sends its team sign-in to an endpoint;
   `_hub-access.js` checks membership; `_routine.js` calls the Claude
   Messages API (with web search for doctor research and term lookup).
   Results come back as JSON; some are cached in Firestore.
4. **Server jobs.** `check-events.js` runs daily at 13:00 UTC (Vercel cron)
   and writes CE events with its own service account login.
   `sign-in.js` emails a 6-digit code through Gmail and returns a Firebase
   sign-in ticket. `push.js` sends Web Push to closed phones.
5. **Account sync.** A signed-in user's practice, streak, badges and
   settings are kept in `account-sync/{uid}` and joined between phones.
6. **Service worker.** Network-first for the page and the app code, with
   1 s for the page (`PAGE_WAIT`) before the saved copy opens; a newer
   version reloads only when the app is in the background.
   Stale-while-revalidate for everything else. `CACHE_VERSION` names the
   saved copy.

## Deploy

1. A change merges into `main`.
2. GitHub Action `bump-version.yml` runs `.github/bump-version.cjs` and
   pushes "Bump version to bMMDD.HHMM", moving `BUILD_ID` (`index.html`)
   and `CACHE_VERSION` (`sw.js`). Pushes that change only docs, tests,
   `.github/`, `.claude/`, promo, `*.md` or the Firebase rules get no bump.
3. Vercel deploys only that bump commit (`ignoreCommand`); `claude/**`
   branches never deploy. `BUILD_ID` is how to tell what is live.
