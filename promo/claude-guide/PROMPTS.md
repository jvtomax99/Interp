# "Build apps with Claude": an animated video guide for friends

Prompts for Jose to paste into a Claude Code chat on this repo, one at a time. Each one ends by
showing you something and waiting for your OK. Don't paste the next one until you've said OK.

What the video is: a short series that teaches friends who have never coded how to build an app or
website with Claude, using the Hub as the example. Dr. Smiley is the host. A calm AI voice explains
everything in simple words. Cute, bouncy animations.

How it gets made (same tools as the promo, already proven in this repo): HyperFrames (videos written
as web pages, `promo/whats-new/`) for the picture, Kokoro (a free AI voice that runs inside the
cloud computer; `promo/hub-blend/BRIEF-60s.md`, "Voice") for the narrator. Cloud voices like
ElevenLabs are blocked in these sessions.

Decisions already made in these prompts (change them in Prompt 1 if you want):

- **Four short chapters, not one long video.** About 60-90 seconds each, around 5 minutes total.
  Friends finish a 90-second video; most stop a 6-minute one halfway. Each chapter also renders on
  its own, so one fix doesn't mean re-rendering everything.
- **Vertical, 1080x1920**, for phones. Drafts at 720x1280 (renders about twice as fast; the 60 s
  promo took 51 minutes at full size).
- **English narrator** (Michael, `am_michael`, the promo's voice). Spanish version later if wanted.
- **No HMH logo, no Hackensack photo, no real doctor names, no patient anything.** This goes to
  friends outside work and video files get forwarded. Dr. Smiley, the pins and the app's screens
  (captured with the tests' fake data) are yours to show.

---

## Prompt 1: the plan and the script (paste first)

> Read `AGENTS.md`, `CLAUDE.md`, `promo/claude-guide/PROMPTS.md`, `promo/whats-new/README.md` and
> `promo/hub-blend/BRIEF-60s.md`. Make a branch `claude/claude-guide-video`. This is not part of
> the app: everything lives in `promo/claude-guide/` (the deploy skips `promo/`), no User Guide
> update needed.
>
> I want an animated video guide, in 4 short vertical chapters of 60-90 seconds each, that teaches
> my friends (who have never coded) how to use Claude to build apps and websites, with the Hub as
> the real example. Dr. Smiley is the host. Simple words, like explaining to a smart 12-year-old.
> Chapters:
>
> 1. **Claude is your junior developer.** You're the boss with the idea, Claude writes the code.
>    Describe what you want in plain words, look at what it made, tell it what's wrong. Write a
>    short plan first: what it does, who it's for, what it will NOT do yet. Show the Hub going
>    from idea to a real app on my phone.
> 2. **Profile settings: teach Claude how to talk to you, once.** Where the personal preferences
>    box is, what to put in it (plain words, challenge me, give me choices as buttons, tell me your
>    pick, no fluff), and why: you stop repeating yourself every chat. Use my own preferences as
>    the example, shortened.
> 3. **CLAUDE.md: the project's rulebook.** A file in the project that Claude reads at the start of
>    every chat: what the app is, where things are, the rules, the mistakes never to repeat. Like
>    the note you leave a babysitter. Show the Hub's real one (scrolling, a few lines lit up: the
>    file map, a "hard-won gotcha", "never edit by hand"). How to start one (`/init`, or ask
>    Claude to write it), and that it grows every time Claude learns something the hard way.
> 4. **Handoff: start fresh without forgetting.** A chat has a memory limit (its "context",
>    measured in tokens, little pieces of words). Long chats get slow, costly and forgetful. So
>    before a chat gets heavy, Claude writes `docs/handoff.md`: what we're doing, where it stands,
>    what's next, and the exact message to paste. You open a new chat, paste it, and it picks up
>    in seconds with a clean memory. Show the Hub's real handoff.
>
> Before writing, check every claim about Claude against Anthropic's own docs or help pages (not
> blogs): where the personal preferences setting is today and what it's called, how CLAUDE.md is
> read and what `/init` does, what context and tokens are, what happens when a chat gets too long.
> List the links. Anything you can't confirm, tell me instead of guessing.
>
> Then write in `promo/claude-guide/`: `BRIEF.md` (the plan, who it's for, what it will NOT do in
> this version, and how 2-3 popular "learn to code with AI" videos explain these same ideas and
> where ours can be clearer), and `SCRIPT.md`: each chapter's narration word for word, with the
> picture for each line beside it. Short sentences, no jargon without a one-line meaning, every
> chapter ends on one thing to try today. Also tell me which 3-5 screenshots you need from me (for
> example the claude.ai settings screen and a Claude Code chat on my phone) since you can't log in
> to claude.ai from here. Show me the script and wait. Plain words, say "working on it" and "done".

## Prompt 2: the look (after you OK the script)

> Script approved [paste any changes here]. Now the look, before any animation. Make 4 style
> frames per chapter as phone-size stills (send them to me as pictures):
>
> - Dr. Smiley as host, talking with his real face frames (`drsmiley/face.webp`, his engine in
>   `features/smiley-engine.js`), pointing at things, reacting (surprised at "tokens", proud at
>   the end of each chapter).
> - The app's pins (`pins/*.webp`) as the icons for ideas: a pin per step, popping in with a
>   bounce.
> - The app's real screens captured with the tests' fake data (like `promo/whats-new/tools/
>   capture.cjs`), never the live site, never real names.
> - My screenshots [attach them] for the Claude screens; blur anything personal.
> - Cute ideas to try: CLAUDE.md as a sticky note Dr. Smiley pins on the fridge; the chat's
>   memory as a backpack filling up with word-bubbles until it bursts; the handoff as a small
>   note passed to a fresh, smiling Dr. Smiley; the junior developer as a tiny robot typing fast.
> - Big captions on every line (people watch muted), at least 7:1 contrast, readable at 360 px.
> - The app's colours and Inter font. Bouncy is fine here (the app's no-overshoot rule is for the
>   app, not this video).
>
> Give me two directions to choose from and say which you'd pick and why. Wait.

## Prompt 3: the voice (after you pick a look)

> Look [A/B] approved. Make the narrator with Kokoro as in `promo/hub-blend/BRIEF-60s.md`: read
> each chapter in a few long passages, not one clip per line (one clip per line sounded robotic
> last time). First send me a 15-second sample of chapter 1 in two voices (`am_michael` at
> `-s 0.92` and one other you think is friendlier) and wait for my pick. Then voice all 4
> chapters and write each chapter's cue times (when each sentence starts) so the animation can
> follow the voice exactly.

## Prompt 4: build chapter 1 (repeat for 2, 3, 4)

> Voice approved. Build chapter [1] in HyperFrames, timed to its voice cues: every animation lands
> on the word it belongs to, captions change with the voice to the frame. Soft pops and ticks
> under the voice (like `promo/hub-blend/tools/sfx.cjs`), no music yet. Check: captions readable
> at 360 px and 7:1, no text off screen, Dr. Smiley's mouth moves only while the voice talks.
> Send me 4 stills, then a 720x1280 draft render with sound, and wait. Keep the render in
> `promo/claude-guide/renders/` and commit it to the branch so it outlives the session.

Then for each next chapter, paste the same prompt with the number changed. If a chapter needs a
fix, use Prompt 6.

## Prompt 5: final (after all 4 drafts are OK)

> All 4 chapters approved. Render each at 1080x1920 with sound, plus one joined version with a 1 s
> title card between chapters. Add soft background music only if it's free to use (say its
> licence) and 12 dB under the voice; otherwise none. Make each file small enough to send in
> WhatsApp (check its current limit, don't guess), keeping it sharp on a phone. Save to
> `promo/claude-guide/renders/`, commit, and send me the files. Then write `README.md` there (how
> to re-make it, the commands, render times) and send me a phone notification when it's ready.

## Prompt 6: fix something (any time)

> In chapter [N], at [time, e.g. 0:42]: [what's wrong, e.g. "the caption covers Dr. Smiley's
> face" or "say 'memory' instead of 'context' the first time"]. Change only that. Re-render only
> that chapter as a draft, send me a still of the fix and the clip, and wait.

## If the chat gets heavy

Rendering and voice files make these chats heavy fast. When Claude offers a new chat, take it: it
writes `docs/handoff.md` with where the video stands, and the new chat continues from the next
prompt here.
