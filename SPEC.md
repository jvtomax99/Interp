# SPEC: HUMC Interpreter Hub

Drafted from the code and docs on 2026-11-10. Gaps marked TO FILL for Jose.

Sources: `CLAUDE.md`, `AGENTS.md`, `docs/PLAN.md`. Detail: `docs/features/`.

## What it is and who it's for

A Spanish/English medical-interpreting tool, an installable web app (PWA),
live at https://interp-six.vercel.app.

**Real users: the interpreter team at Hackensack University Medical Center
(Hackensack Meridian Health)**, about 41 phones in the team (`CLAUDE.md`,
Open items, 2026-11-07), split into North and South regions. Jose Vazquez,
staff medical interpreter, owns and directs it. Owners and admins run team
access and titles.

What the team needs:
- Find the right term fast, one-handed, on a phone, between assignments.
- Prep for an appointment with a doctor they don't know.
- Study for the CoreCHI exam and keep skills sharp (traps, sound-alikes,
  memory for consecutive interpreting).
- Share what the team knows: terms, doctor tips, chat, CE events.
- Keep working on weak hospital Wi-Fi or no signal.
- TO FILL: what the team says it needs most. Check big plans with them.

## Features

Each "Done when" is drafted from what the code does today. TO FILL: Jose
confirms or rewrites them.

**Glossary (domains and terms).** Domains as colour tiles, subgroups,
slang, search without accents, add, fix, history, recently deleted,
attachments, CSV export and import, print. One Firestore doc per term.
- Done when: an interpreter finds a term in a few taps, hears it out loud,
  and a fix they save shows on every teammate's phone.

**Translate.** Short text in, a Claude rendering out (`api/translate.js`).
- Done when: a user gets a usable rendering of a short text and sees when
  not to rely on it.

**Look up a term.** A trusted-source search for one term
(`api/term-lookup.js`), cached; entries checked before saving
(`api/term-check.js`).
- Done when: a user gets a sourced explanation of a term not yet in the
  glossary.

**Doctor Prep and Doctor Directory.** Research on a doctor's specialty
terms (`api/doctor-research.js`), the directory by region and place, a
doctor's page with tabs, team tips, photos, duplicate merge, appointment
prep and appointment mode.
- Done when: before an appointment with an unknown doctor, a user opens a
  page with that doctor's likely terms and the team's tips.

**Ask the Hub (Dr. Smiley).** Questions answered from the glossary and
approved team notes (`api/ask.js`), follow-ups, actions, a memory kept on
the phone, corrections and feedback; Dr. Smiley's face, moods and rank.
- Done when: a user asks a question and gets an answer built from the
  team's own entries, with sources, and can correct it.

**Term Review and knowledge brain.** Spaced review of your terms, checked
Spanish, your own record; a live brain of what you know.
- Done when: a user finishes a review session and sees which terms to
  repeat and their brain grow.

**CoreCHI Practice.** 100 seed questions plus team questions, quizzes,
score trend, Focus next, badges, the HUMC campus that grows with practice.
- Done when: a user finishes a practice quiz, sees their score and what to
  study next.

**Daily Drill.** Three short rounds a day on Home.
- Done when: a user finishes the three rounds and sees their streak.

**False Friends.** 101 entries, Study and Drill, risk filter.
- Done when: a user drills traps and sees which ones they missed.

**Sound-Alikes.** 45 sets, Study with a speaker on every word, Drill by ear.
- Done when: a user hears a sentence and picks the right rendering.
  TO FILL: Jose checks the Spanish (each set marked unchecked until then).

**Memory trainer.** 60 practice lines in chunks, speakers beside the ring,
a voice and mic check, auto-marking.
- Done when: a user plays a round, repeats each chunk and gets a score.

**Team Chat.** Channels by region, pins, mentions, attachments, admin and
supervisor tags, announcements, Recent Updates.
- Done when: a message reaches the team and a mention reaches one person.

**Notifications.** Web Push to a closed phone for chat and owners' sends,
the bell and Notifications screen.
- Done when: a user turns them on and a chat message reaches their locked
  phone.

**Training and Events.** A daily check of CE feeds (`api/check-events.js`).
- Done when: a new CE event shows in the app within a day of being posted.

**Team access and email sign-in.** Team code, members only, regions;
email code sign-in, one account on every phone, practice and settings
synced, titles by account.
- Done when: a new teammate joins with the code, signs in by email on a
  second phone and finds their practice there.

**3D Body.** Human Atlas in a walled-off frame, 30 bilingual cards.
- Done when: a user taps a body part and reads its card in both languages.

**User Guide and Code of Ethics.** Questions in plain words, search,
Show me, New lately, the 1-minute video; the Code of Ethics for reference.
- Done when: every visible feature has an answer a user can find by
  searching their own words.

**Home, opening and look.** Hello banner, rails, the Badge in opening,
tool banners, idea credits, HUMC Brain, dark mode, offline with a saved
copy.
- Done when: the app opens on a phone to a usable Home in a few seconds,
  even offline. TO FILL: Jose's target time.

## Not in v1

From `AGENTS.md` "Not building" (proposed 2026-10-29, still waiting for
Jose's OK there). A request that crosses one is flagged before any work.
- **No patient information, ever.** No names, record numbers, dates of
  birth, room numbers or anything that identifies a patient, anywhere
  (Firestore, the phone, Team Chat, AI requests).
- **Not a replacement for the hospital's official interpreting systems,**
  its scheduling or its records. A study and prep tool beside them.
- **No app-store app.** It stays an installable web app.
- TO FILL: Jose confirms this list and adds anything else he won't build.

## Later

From `docs/PLAN.md` "Later" (each waits on its trigger) and open ideas:
- Glossary changes-only sync, if Firestore reads near 50K a day.
- Startup: draw less at first, if Jose finds opening slow.
- Reduced motion: a short fade for the name instead of nothing.
- Dr. Smiley's three face frames with a white edge: trim them.
- Training and Events: a limit on its listener, with a new badge rule.
- Type leftovers: 8 inline px font sizes, old 400-weight headings.
- Doctor list ideas: compact rows, search that finds a doctor's terms and
  short forms (Jose picks; mock up first).
- Opening extras offered, not picked; tool banner extras in
  `docs/features/tool-banners.md`.
- TO FILL: Jose's own saved ideas.

## Phases

Build order and phase checkboxes live in docs/PLAN.md. (It has no checkbox
lines today; "Next (in order)" marks items done in words.) Next 3 open:
- [ ] **Waiting on Jose.** K2: publish `firestore.rules` so Term Review's
  "only your own record" rule works (may be covered by the 2026-11-07
  rules publish; TO FILL: Jose confirms). M5: one memory-trainer round with
  Auto-mark on, one with Record me on too.
- [ ] **Doctor list, next ideas.** Compact rows instead of two-column cards
  (mock up first), and search that finds a doctor's terms and short forms.
  Jose picks.
- [ ] **Doctors redesign D1c.** Needs Jose: the real-data replay (he sends
  `doctors.json`) and the 5-minute interpreter test on iPhones.

Also built and waiting for Jose's OK in that list: the opening (Badge in)
and the tool banners.
