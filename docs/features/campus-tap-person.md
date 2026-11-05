# Campus: tap a person for a term

Jose picked this on 2026-11-05 as the next campus piece (item 2c in `docs/PLAN.md`: "tap a person: a term from your
glossary, counts as practice; tap area bigger than the figure"). This is the spec, written before any code (his rule,
`AGENTS.md`, "How Jose works with AI tools"). His go the same day: "Go, Term Review only".

## As built (2026-11-05, branch `claude/campus-tap-person`)

- `features/campus.js`, section "Tap a person for a word": `campusFolkGroups()` groups the idlers and sitters of
  `CAMPUS_MAP.live` (each joins the first group whose middle is within 22 css px at the phone's scale, else starts
  one; five groups today, named from `CAMPUS_FOLK_SPOTS` by the nearest, else "on the campus"). `renderCampus`
  writes one `.cp-folk` button per group, placed in the markup before the buildings' `.cp-bld` boxes, so a wall
  still takes the tap; `is-word` on the group with the dots (`campusWordGroup`, kept in `ih_campusWord.g`), `is-sel`
  on the picked one. Dr. Smiley's line names that group until a word is answered on the phone (`ih_campusTalked`).
  `renderCampus` also starts loading your Term Review record if it is not in yet (`ensureLoaded('termReviews')`).
- The tap (`campusFolkTap`): the name first (`requireName`), a building pick closed, the held word or a new one
  (`campusWordDraw`: `reviewBuild(null, 2)`, the first that is not the word before, kept in `ih_campusWord.id`), then
  the card (`campusFolkCard`) in the `.cp-pick` region: the English with `reviewWhy`'s reason, Show, then Got it and
  Missed it; Saving…; Not saved with Try again and Skip; "Saved to your Term Review record", and the card closes
  itself 1.6 s later. A second tap on the ringed group is Show. `campusFolkAnswer` writes through
  `saveTermReview(id, box, count + 1, { result, confirm: true })` (box up or 0, as `reviewRecord` does), then the
  next word waits with another group (`campusFolkMark` moves the dots without a redraw). `campusPick` closes a word
  (`campusFolkClose(true)` keeps the card for the building); a tap elsewhere or Escape closes either.
- `app.css` beside `.cp-clouds`: `.cp-folk` is a 44 x 44 px transparent round button centred by margins, its ring a
  14 px `::after` on `is-sel`, `:active`, `.is-pressed` and focus (both classes are in `LIFTS`); `.cp-folk-say`, the
  bubble, three 3 px dots on `cpDots` (1.4 s, staggered), 5 px above the group's middle; the word card stacks
  (`.cp-folk-in`, column) and the `.cp-pick` region anchors it to the foot's bottom with `:has`, so a long term grows
  it up over the picture and never past the card. Once the Spanish shows, the English steps back (`.is-asked`).
  Reduced motion: the dots stand still; `is-away` pauses them; Still stops them through the page's rule.
- Checks: `tests/suites/campus-alive.cjs`, "tap a person" (the list under Checks below, all in). `campus-pick.cjs`'s
  empty-scene sweep skips the spots. Guide: the practice answer's new paragraph and keywords (`guide/topics.js`); the
  first New lately card (`GUIDE_NEWS`, `index.html`) in the celebration's place: the three cards must point at three different answers (a card's New badge is the answer's, `ih_guideSeen`, so two cards on the practice answer cleared together; `guide.cjs` holds it), and both campus pieces open the same practice answer.
- Not done from the spec: nothing. Beyond it: nothing (no team point for an answer, unlike Term Review's `teamPoints(1)`;
  add it if Jose wants his rank to count these).

## What it does

On the CoreCHI Practice card, people stand and sit about your HUMC campus (the fifteen idlers and three sitters,
`CAMPUS_MAP.live`). Tap one of them and they ask you for a word from your glossary, the way a passer-by at work
might: the term in English, you say the Spanish in your head, tap **Show** to see it, then **Got it** or **Missed
it**. The answer is saved as a Term Review answer, the same record Term Review writes, so your knowledge brain lights
the term and Term Review's missed and due lists move.

1. **Who you tap.** The people stand in groups (a bench by Oncology, a plaza in front of Encounter, one person on
   the path between them, a group at Encounter's east side, three at Ethics' door). A group is one tap spot: a
   44 x 44 css px circle at the group's middle (Apple's minimum, from memory: the Human Interface Guidelines pages
   could not be read here, see below), never the 3 px figure itself. The walkers are not tappable: they move, and at
   2 x 4 css px on a phone a moving target that size is a miss every time.
2. **Who wins a tap.** The spots sit **under** the buildings' tap boxes (`.cp-bld`) and their badges in the stacking
   order, so a tap on a building's wall still picks the building, and the people take only the ground around them.
   Measured at phone scale (0.373 css px per render px, `K` in `renderCampus`): the bench group's circle crosses
   Oncology's lower edge, the plaza group's crosses Encounter's lower edge, the east group and the three at Ethics'
   door stand inside building boxes and are mostly covered. Four spots are reachable in practice (bench, plaza, the
   path, the east group's lower half); the three at Ethics' door get a spot too, for the day a tap lands on it, but
   nothing promises they can be reached. Oncology's own chip (`.cp-tag`) and its wall above the bench keep it fully
   tappable.
3. **Finding them.** Nobody discovers a 3 px tap target. One group at a time carries a small speech bubble with
   three dots, white on the domain-neutral ink, above its middle (like a villager's "!" in Animal Crossing, from
   memory): that is the group holding today's word. The bubble moves to another group after each answer. Dr.
   Smiley's line on the card says it once per phone, before the first answer: "The people by the bench have a word
   for you. Tap them." (`ih_campusTalked`), then goes back to his paint line.
4. **The card below the picture** (the `.cp-pick` region the building pick already uses): "**Someone at the bench
   asks:** shortness of breath" with Term Review's reason under it in small type (`reviewWhy`: New to you, Missed
   last time, Due, Quick check), the buttons **Show** then **Got it** / **Missed it**, and a close. No typing: this
   is one-handed, between assignments; Term Review keeps the typed sessions. Tapping a building closes it, as now.
5. **Which word.** Term Review's own order over the whole glossary, one card: missed first (most missed), then due,
   else new, else a quick check (`reviewBuild(null, 1)`, every term with English and Spanish). The same word stays
   on the card until it is answered, so leaving and coming back does not shuffle it; after an answer the next word
   is drawn and the bubble moves. Never the same word twice in a row.
6. **What counts.** Got it saves box up, Missed it saves box 0, through `saveTermReview(..., { confirm: true })` as
   Term Review does: on failure "Not saved", Try again / Skip, and nothing changes. The knowledge log's day count
   (`kbLogNote`) follows from the save. The streak and today's count on the card (`bumpStreak`, `DAILY_GOAL`) are
   **not** touched: they count CoreCHI questions, and "15 answered today" would lie if glossary words were in it.
   Jose's call; my pick is to keep them apart (below).

Reduced motion: the bubble is simply there, no pulse. Still: the same. Off screen: nothing runs (the card's
`is-away`). Nothing in the picture changes when a word is answered; the people stay where Blender put them.

## Who it is for

Interpreters between assignments, one hand, a minute at most. It joins the campus (where you already go to see how
ready you are) to the glossary (where the words are), so a glance at the card can turn into one real term reviewed.

## Not in this version

- No typing the answer and no checking what you typed (Term Review does that; here you judge yourself).
- No Spanish-to-English direction: always the English shown, the Spanish hidden. A toggle can come later.
- No word by place: the person near Oncology does not give an oncology term. The buildings are CoreCHI exam areas,
  not glossary specialties, so there is nothing honest to map. Later maybe: the word's specialty named in the card.
- No tappable walkers, cars, the helicopter or the ambulance. No sound. No Dr. Smiley reaction beyond his one line.
- No change to the CoreCHI streak, today's count, readiness or the buildings' paint.
- No change to the 3D view (`campus3d/`); its people stay as they are.
- No record beyond Term Review's (`term-reviews/{who__termId}`) and the knowledge log already written from it.
- Not for a phone with no name set: the card asks for the name first (`requireName`), like Practise does.

## How others do it, and where this can be better

None of the pages could be read from this session (their hosts are outside the allowed network; to let a chat read
them, Network access, Allowed domains, one per line):

```
ac-pocketcamp.com
niantic.helpshift.com
nimblebit.com
developer.apple.com
```

(`developer.apple.com` answers but sends an empty page to a plain fetch; it needs a browser.) So these are from
memory, marked:

- **Animal Crossing: Pocket Camp** (Nintendo). Tap an animal and it talks; an animal with a request shows a small
  icon above its head, so you know which one to tap without trying them all. Lesson: the bubble over one group.
  Where ours differs: their animals are the size of a thumb; ours are the size of a letter, so the tap spot has to
  be the group, not the figure.
- **Pokémon GO** (Niantic). Pokémon on the map are drawn far bigger than life so a thumb can hit them; the tap opens
  a separate screen. Lesson: a big spot on a small thing is normal in games. Where ours is better: no screen change;
  the card below the picture is enough for one word, and the campus keeps moving behind it.
- **Tiny Tower** (NimbleBit). Tap a bitizen and a small card shows who they are; it is information, not a task.
  Where ours is better: the tap gives you something to do, and it feeds a record you already keep.

## Checks (to add to `tests/suites/campus-alive.cjs`)

- Five tap spots, each at least 44 x 44 css px on the phone, each centred within 4 css px of its group's middle.
- `elementFromPoint` at a building's wall above the bench returns the building, not the people; at the ground
  below the bench returns the people.
- The bubble shows on exactly one group; after Got it it is on another group and the word changed.
- The pick card shows the word, its reason, Show reveals the Spanish, Got it writes a term-reviews record (stand-in
  Firestore) with `lastResult: 'ok'`, Missed it with `'miss'`; the streak in `localStorage` is unchanged by both.
- A phone with no name: the tap asks for the name first and saves nothing.
- Reduced motion: no animation on the bubble. The guide answer for practice names the people.

## Guide

The practice answer (`guide/topics.js`, `practice`) gets a sentence: tap the people by the bench or on the plaza
for a glossary word, your answer counts as a Term Review. A New lately card takes the celebration's slot (both open the
same answer, and the three cards must be three answers).
