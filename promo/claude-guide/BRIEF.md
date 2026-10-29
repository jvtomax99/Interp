# Build apps with Claude: the brief

Jose's ask (2026-10-29): an animated video guide, with a voice, that teaches his friends how to use
Claude to build apps and websites. Simple words, thorough, cute animations, the Hub's own pictures.
The prompts that drive it: `PROMPTS.md`. The words: `SCRIPT.md`.

Not part of the app: the deploy skips `promo/`, nothing loads this folder, no User Guide change.

## What it is

Four short vertical videos (1080x1920), 60-90 s each, about 5 minutes in all, plus one joined copy.
Dr. Smiley is the host. A calm AI narrator (Kokoro, runs inside the cloud computer) reads the
script; big captions carry every line for people watching with the sound off.

1. Claude is your junior developer
2. Profile settings: teach Claude how to talk to you, once
3. CLAUDE.md: the project's rulebook
4. Handoff: start fresh without forgetting

## Who it's for

Jose's friends: smart, use phones all day, have never written code, may have tried a chatbot. They
want to know "could I make my own app?" and what to do on day one. They'll watch on a phone, often
muted, and stop the moment it gets boring or confusing.

## What it will NOT do in this version

- Teach coding, git, or how to set up a computer. It points to where to start and stops there.
- Cover every Claude feature (skills, hooks, subagents, MCP, plans and pricing). Four ideas only.
- Show the HMH logo, the Hackensack photo, real doctors' names or anything about patients. Video
  files get forwarded; this goes outside work.
- Show claude.ai screens we made up. Claude's own screens come from Jose's real screenshots, or
  they're left out.
- Spanish narration. English first; a Spanish voice (Kokoro's `ef_dora`) is a later version.
- Music unless its licence is clear.

## Checked facts (Anthropic's own pages, read 2026-10-29)

Everything the narrator says about Claude rests on one of these. Anything not here is left out.

- **Profile instructions.** Claude Help Center, "Understanding Claude's personalization features"
  (support.claude.com/en/articles/10185728): click your initials in the lower left, "Settings",
  then "Your Claude", then "Instructions" (older layout: "Account", "Instructions for Claude").
  "Any instructions you add here will be applied to all of your conversations with Claude."
  It suggests: your preferred approaches, common terms you use, typical scenarios, general
  communication instructions. **Not yet confirmed on Jose's phone**: blogs still call the box
  "What personal preferences should Claude consider in responses?", so the menu has been renamed
  at least once. His screenshot decides what the video shows.
- **CLAUDE.md.** Claude Code docs, "How Claude remembers your project" (code.claude.com/docs/en/
  memory): "You write these files in plain text; Claude reads them at the start of every session."
  `/init`: "Claude analyzes your codebase and creates a file with build commands, test
  instructions, and project conventions it discovers." Size: "target under 200 lines per
  CLAUDE.md file. Longer files consume more context and reduce adherence." It survives compaction:
  "Claude re-reads it from disk." Add things said only in chat to CLAUDE.md "to make them
  persist." (The Hub's own CLAUDE.md is far past 200 lines. The video says "keep it short" and
  doesn't hold the Hub up as the size to copy.)
- **Tokens and context.** Claude API glossary (platform.claude.com/docs/en/about-claude/glossary):
  the context window is the model's "working memory"; tokens can be "words, subwords,
  characters"; roughly 3.5 English characters each on older models, about 30% more tokens on
  newer ones. The video says "little pieces of words" and gives no exact number.
- **Long chats.** Claude Code docs, "Explore the context window" and "Best practices":
  - Claude Code compacts automatically when the window fills up: it "replaces the conversation with
    a structured summary". Details left out of that summary are gone from the chat.
  - "Every request sends the whole conversation", so a long chat keeps paying for its old history.
  - "a focused context gets you better answers and costs less."
  - After two failed corrections, start over: "`/clear` plus one new prompt that folds in what you
    learned works better almost every time."
  - Write the plan to a file, then "start a fresh session to build from it, so the build begins
    with a clean context".
  - Most current models have a 1-million-token window, so "running out is rare".

  **What this changes in the script:** the handoff isn't sold as a way to get more tokens or
  because the chat will "run out". It's sold as cheaper, sharper and safer than a giant chat:
  the new chat reads a one-page note instead of re-reading everything, and nothing important
  depends on what a summary kept.
- **Plan first, give it a check.** Best practices: have Claude "interview me until you could write
  the spec"; things go wrong when Claude "had no way to check its own work"; ask for "evidence:
  the command it ran and its output, or the screenshot".

## How other "learn to build with AI" videos explain this

I couldn't watch videos from here, so this is from listings and Anthropic's own material, not a
viewing. Jose: if you know a video your friends liked, send the link and I'll compare against it.

- **Long courses** ("Claude Code for normal people", a 6-hour course; "All 35 Claude Code
  concepts explained for non-coders"). They cover everything, and a beginner drowns. Ours: 4
  ideas, 5 minutes, one thing to try at the end of each chapter.
- **Anthropic's own webinar** ("Claude Code in an Hour: A Developer's Intro", March 2026). Correct
  but made for developers: a terminal on screen and words like "repo". Ours: a real app made
  by a non-programmer, every new word explained in one line the first time it's said.
- **Typical screen-recording tutorials.** Sped-up typing and a talking head; the ideas
  (context, rulebook, handoff) stay invisible. Ours: each idea gets an object you can picture: a
  backpack that fills up, a sticky note on the fridge, a note passed between two Dr. Smileys.

## Assets (all already in the repo)

- Dr. Smiley: `drsmiley/*.webp` (base, 30 face frames, brows, hats), his engine
  `features/smiley-engine.js`; the promo's copies in `promo/hub-blend/assets/drsmiley/`.
- Pins as icons: `pins/*.webp` (41). The app icon: `promo/whats-new/assets/appicon.png`.
- The app's screens: captured from this checkout with the tests' fake data
  (`promo/whats-new/tools/capture.cjs` is the pattern), never the live site.
- Inter (the app's font), the kit's sound effects: `promo/whats-new/`, `promo/hub-blend/assets/sfx`.
- From Jose (still needed): the screenshots listed in `SCRIPT.md`.

## Tools and timing

HyperFrames 0.8.181 for picture and render, Kokoro for the voice, both as in
`promo/hub-blend/BRIEF-60s.md`. The 60 s promo took 51 minutes to render at 1080x1920 on 4 cores,
so drafts render at 720x1280 and each chapter on its own.
