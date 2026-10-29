# Build apps with Claude: the script

Draft 2, 2026-10-29, approved by Jose (his change: "works at Hackensack", no job title). Voice: Puck, warm (`tools/voice.py`). Facts behind every line
about Claude: `BRIEF.md`, "Checked facts". Says = the narrator, word for word (and the caption).
Shows = the picture. Pace: about 140 words a minute, so each chapter runs about 75-90 s.

---

## Chapter 1: Claude is your junior developer

1. **Says:** Hi! I'm Dr. Smiley. I live inside an app called Interpreter Hub.
   **Shows:** Dr. Smiley pops up from the bottom, waves. The app icon bounces in beside him.
2. **Says:** My friend Jose made it. He works at Hackensack, and he's not a programmer. He didn't
   write the code. Claude did.
   **Shows:** A phone with the Hub's Home screen slides in. A little "written by Claude" tag
   flips over the code.
3. **Says:** Here's the trick. Think of Claude as a junior developer: a fast, eager helper who
   builds whatever you describe.
   **Shows:** A tiny robot at a tiny desk, typing very fast.
4. **Says:** You're the boss. You bring the idea. Claude does the typing.
   **Shows:** Dr. Smiley puts on his graduation cap (`hat-grad`), points at the robot.
5. **Says:** Step one. Before any code, ask Claude for a short plan: what the app does, who it's
   for, and what it will NOT do yet.
   **Shows:** A card writes itself, three lines, each with a pin popping in. The third line gets
   a red "NOT yet" stamp.
6. **Says:** That last part matters. Without it, your helper keeps adding things, and nothing gets
   finished.
   **Shows:** The robot piles feature after feature on a wobbling tower. It tips. Dr. Smiley winces.
7. **Says:** Step two. Ask for one small thing at a time.
   **Shows:** The tower resets; one block slides in alone.
8. **Says:** Step three. Check its work. Ask Claude to test it and show you a screenshot. Don't just
   take its word for it.
   **Shows:** A screenshot of the Hub drops in with a green check. Dr. Smiley squints at it, then
   nods.
9. **Says:** Step four. Tell it what's wrong in plain words: where you tapped, and what happened.
   **Shows:** A finger taps a button; a speech bubble: "I tapped Back and landed on Home."
10. **Says:** Then do it again. Plan, build, check, fix. That's how a glossary, a quiz and a 3D body
    ended up in one app.
    **Shows:** The four steps spin as a wheel. Three Hub screens fan out: Glossary, CoreCHI
    Practice, 3D Body.
11. **Says:** Try it today: tell Claude your app idea, and ask it to interview you until it can
    write the plan.
    **Shows:** "Try it today" card. Dr. Smiley gives a thumbs-up (proud face).

## Chapter 2: Profile settings, teach Claude how to talk to you once

1. **Says:** If you keep telling Claude the same thing in every chat, there's a better way.
   **Shows:** Dr. Smiley repeating himself in five speech bubbles, getting more tired each time.
2. **Says:** Put it in your profile. Claude applies your profile instructions to every
   conversation you have with it.
   **Shows:** One sticky note slaps onto the screen. Little copies of it fly into a row of chats.
3. **Says:** On claude.ai, tap your initials, then Settings, then Your Claude, then Instructions.
   **Shows:** Jose's real screenshots, each tap circled as it happens. *(The menu names come from
   Anthropic's help page; Jose's screenshot decides what's said if his phone shows different
   names.)*
4. **Says:** Write it like you'd brief a new coworker. Who you are, what you're working on, and how
   you want answers.
   **Shows:** A name badge, a project folder, a speech bubble, popping in one by one.
5. **Says:** Here's what Jose wrote. Use plain words, I'm new to this. When there are choices, give
   me buttons, and tell me your pick. Challenge me. Tell me when my idea is weak.
   **Shows:** Each line lands as a sticky note on a corkboard as it's read.
6. **Says:** That last one is the most useful. A helper that always says yes will happily build a
   bad idea.
   **Shows:** The robot cheerfully building a bridge to nowhere. Dr. Smiley's doubt face.
7. **Says:** Short and clear works best. A few good lines beat a long essay.
   **Shows:** A long scroll shrinks into one tidy card.
8. **Says:** Try it today: write five lines about how you want Claude to talk to you.
   **Shows:** "Try it today" card, five empty lines filling with checkmarks.

## Chapter 3: CLAUDE.md, the project's rulebook

1. **Says:** Your profile is about you. CLAUDE.md is about your project.
   **Shows:** The sticky note from chapter 2 on the left, a folder labeled CLAUDE.md on the right.
2. **Says:** To build apps, people use Claude Code, the version of Claude that can open your
   project's files and change them.
   **Shows:** A Claude Code chat on Jose's phone (his screenshot).
3. **Says:** CLAUDE.md is a plain text file that lives in your project. Claude Code reads it at the
   start of every session.
   **Shows:** The folder opens; a page floats up and Dr. Smiley reads it, eyes moving.
4. **Says:** Think of the note you leave a babysitter. Bedtime is at eight. No candy. Don't open
   the back door, the dog gets out.
   **Shows:** A note on a fridge, three lines with doodles. A puppy peeks in.
5. **Says:** For an app, it says what the app is, where everything lives, the rules, and the
   mistakes never to repeat.
   **Shows:** Four tabs on the note: About, Map, Rules, Lessons.
6. **Says:** Here's the Hub's. A map of every file. A rule: never change the version number by
   hand, a robot does that. And a lesson learned the hard way: hover effects don't work on phones.
   **Shows:** The real `CLAUDE.md` scrolling; those three lines light up as they're named.
7. **Says:** When Claude gets something wrong and you work out why, the lesson goes in the file.
   The next chat already knows it.
   **Shows:** A new line writes itself at the bottom. A fresh Dr. Smiley reads it and nods.
8. **Says:** To start one, type slash init. Claude looks at your project and writes a first draft.
   Then you add what it can't see on its own.
   **Shows:** "/init" typed; a draft page prints out; a pen adds two lines.
9. **Says:** Keep it short. Anthropic suggests under two hundred lines. Ours grew much longer. Don't
   copy that part.
   **Shows:** A ruler at "200"; the Hub's page unrolls far past it to the floor. Dr. Smiley,
   sheepish.
10. **Says:** Try it today: open your project in Claude Code, type slash init, and read what it
    wrote.
    **Shows:** "Try it today" card.

## Chapter 4: Handoff, start fresh without forgetting

1. **Says:** Last one: the handoff.
   **Shows:** Two Dr. Smileys side by side, one tired, one fresh.
2. **Says:** A chat with Claude has a working memory, called its context. It's measured in tokens:
   little pieces of words.
   **Shows:** A backpack. Words break into little colored chips and drop in.
3. **Says:** Everything in the chat goes in. What you said, what Claude read, what it wrote.
   **Shows:** Speech bubbles, pages and screenshots tumble into the backpack. It bulges.
4. **Says:** Every time you send a message, Claude re-reads the whole chat. So a long chat costs
   more, and its focus gets fuzzier.
   **Shows:** The tired Dr. Smiley flips through a huge stack of pages, slowing down. A coin meter
   ticks up.
5. **Says:** When it gets really full, Claude squeezes the old part into a summary. Anything the
   summary left out is gone.
   **Shows:** The backpack is vacuum-sealed into a small cube. A few chips fall out and fade.
6. **Says:** So don't wait for that. When a chat gets heavy, or a job is done, ask Claude to write
   a handoff.
   **Shows:** The tired Dr. Smiley pulls out a notepad.
7. **Says:** It's one page. What you're working on, where it stands, what's next, and the exact
   message to paste into a new chat.
   **Shows:** The Hub's real `docs/handoff.md`, its four parts lighting up, ending on "Paste this
   into the new chat".
8. **Says:** Open a new chat and paste it. The new chat reads your note and your CLAUDE.md, and
   picks up where you left off, with a clean memory.
   **Shows:** The note is passed to the fresh Dr. Smiley, who reads it, grins, and starts typing.
9. **Says:** One more tip. If you've corrected Claude twice and it's still wrong, start fresh with
   one better message. Anthropic says that works better almost every time.
   **Shows:** Two crossed-out tries, then a clean page with one clear message and a green check.
10. **Says:** Try it today: at the end of your next long chat, ask Claude to write a handoff for a
    new chat.
    **Shows:** "Try it today" card.
11. **Says:** A profile for you. A rulebook for your project. A handoff for every fresh start. Now go
    build something.
    **Shows:** The three objects (sticky note, fridge note, handoff page) line up. Dr. Smiley
    waves goodbye; the app icon, "Made with Claude".

---

## Screenshots needed from Jose

Phone screenshots, nothing private on them (I'll blur anything left):

1. claude.ai's Instructions screen: the taps from your initials to the Instructions box, one
   screenshot per screen. Your text in it is fine if you're OK showing it.
2. A Claude Code chat on your phone in the middle of real work on the Hub.
3. Starting a new chat in Claude Code (the button or screen you use).
4. Optional: you pasting a handoff into a new chat.

The Hub's own screens I capture myself with fake data.
