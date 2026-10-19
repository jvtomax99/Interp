# Memory trainer (consecutive interpreting practice)

Approved by Jose 2026-10-19. The phone reads a line aloud (a provider in
English or a patient in Spanish) with the text hidden; you render it aloud
in the other language; the model rendering appears split into meaning
chunks and you tap the ones you dropped or changed. Three clean lines in a
row make the next one a few words longer, two misses make it shorter. Your
span (the longest line you hold clean) is charted over weeks on your own
phone. Notes: a toggle, memory-only by default; spans with notes are
charted apart. Phases M0-M5 in `docs/PLAN.md`.

Decisions (Jose, 2026-10-19): Claude drafts the longer lines and their
chunks, Jose checks every Spanish line before it ships; M0 first; notes
toggle, memory-only default.

## M0: Voice and mic check

Bottom of More, under "Measure smoothness". Block "Voice and mic check" in
`index.html` (after the smoothness meter), CSS block of the same name,
overlay `#voiceCheckOverlay`. Four steps: play a Spanish and an English
line (`speechSynthesis`, es-US / en-US, rate 0.92 like `speakText`, no
voice picked); record 5 s (`getUserMedia` + `MediaRecorder`, audio/mp4
first) and play it back on a tap; play Spanish again to hear whether the
voice is quieter after the mic (iOS can switch the audio route while the
mic is open); speech to text in en-US and es-US
(`webkitSpeechRecognition`, interim results, 10 s cap). Copy results gives
a plain-text report, including the voices' names and whether the page runs
as the installed app or a browser tab. Nothing is stored; close releases
the mic, stops speech and drops the recording.

Why: Apple said in 2021 that speech recognition is not available in Home
Screen web apps (WebKit bug 225298); a 2024 developer report says the same
(Apple Developer Forums thread 748048). Unchecked on current iOS. The
trainer must work without it (self-marking); recording and auto-marking
are built only if M0 shows they work in the installed app.

## Results

**Installed app, 2026-10-19** (Jose's iPhone, build b1019.2028; the user agent
says iPhone OS 18_7 with Safari Version/27.0.1, so the OS number in it is
frozen and not the real iOS version):
- Voices: Spanish only es-ES (Mónica) and es-MX (Paulina), no es-US; 28
  English, novelty voices included (Bubbles, Bad News...). The trainer must
  pick by name: Paulina for Spanish, Samantha for English; never rely on the
  default for a lang tag.
- English played (4.0 s for the 11-word line). Spanish not tried in this run.
- Record + play back: works (audio/mp4 AAC, 122 KB for 5 s). M3 can go ahead.
- After the mic: the voice is quieter (Jose: "no", not as loud). Likely iOS
  keeping the audio route on the earpiece after getUserMedia. Unproven fix:
  `navigator.audioSession.type = 'playback'` after recording; test before M3.
- Speech to text: the API is there (`webkitSpeechRecognition`), English got
  "listening, speak now" and nothing after. Unclear whether it stalled or the
  report was copied within the 10 s window. M5 stays on hold.

**Still to run:** a Safari tab; Play Spanish in both; speech to text waiting
until the line changes before Copy.

## M1: the lines

`memory/lines.json` (60 lines, 10 per setting: discharge, meds, consent, ed,
ob, peds; 36 en-es, 24 es-en; 10 to 43 source words). Each: `id`, `set`,
`dir`, `words`, `u` (meaning chunks `[source, model]`), `note` (what the line
tests), `reviewed`. The 101 False Friends `heard`/`truth` pairs in
`index.html` are the short starters and are not repeated. Thin spots: only 3
lines over 40 words and 2 at 10; add longer ones after the first review if
spans run long.

Jose reviews the Spanish on a private claude.ai page (Memory Lines Review,
https://claude.ai/artifact/36Jn3pPjbDuxQZ3tkTAm4A): Good, or a written fix
per line, saved in its `reviews` collection (doc id = line id, `verdict`
ok|fix, `fix`, `at`). Claude reads it back, applies the fixes and sets
`reviewed: true`. Nothing ships to the app until every line is reviewed.
