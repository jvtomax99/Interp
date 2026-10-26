# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-26, from the chat that ran #153 to #158.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, in a few short lines each, say in 2-3 lines what you'll do next,
> and wait for my go. Plain words, say "working on it" and "done".

## Now

Nothing is open from this chat (#158 is merged and live, b1026.1522). Jose picks the next
work. The pick on the list (`docs/PLAN.md`, Next): **S9 Home taps, part
2**, which needs Jose first: a few runs of More, Measure smoothness on his
phone (it lists the six slowest taps), then fix the slow ones. Offer that
with buttons, plus "something else".

## Before (this chat)

- #153 handoff notes (merged both chats' notes).
- #154 Ask the Hub group -> `features/ask-hub.js` (live b1025.1947).
  Caught: `ASK_STOP` builds with `foldText` at load, so it stays in
  `index.html`; HUMC Brain's `claim()` broke on an empty region (fixed).
- #155 Dr. Smiley's engine -> `features/smiley-engine.js` (live
  b1025.2317). The split of `index.html` is finished: 1.15 MB to 0.96 MB.
- #156 the 1-minute promo saved (another chat made picture, voice and
  effects; this one added the music: v11's track with its narrator
  removed by audio-separator, since Demucs' hosts are blocked here).
- #158 the app's Watch video is now that film, 10% faster (54.5 s, 720p),
  with three voice cuts fixed ("Daily drills" had lost "Da"). User Guide
  answer and New lately card updated. Jose tried his own song
  (`hub-promo-ost.mp4`, 81 BPM) under it and kept the current music.

## Learned here

- A static scan misses code run at load inside arrows (`.map(w =>
  foldText(w))`). Run a moved file in a bare `vm` sandbox: each "X is not
  defined" is a load-time read.
- Removing a voice from music: `audio-separator` with
  `UVR-MDX-NET-Inst_HQ_3.onnx` downloads and works here; Demucs,
  Hugging Face and download.pytorch.org answer 403.
- `promo/` changes get no version bump (`bump-version.yml` ignores it).

## Not proven / open

- humc-brain's double-tap checks fail now and then under load (seen on
  `main`, 2026-10-24); not investigated.
- The promo's music has one join (25.70 s in the 60 s cut); Jose called
  the sample clean, but only he has listened.
