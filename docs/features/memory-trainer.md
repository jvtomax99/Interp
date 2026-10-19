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

(Jose's pasted reports go here, one per mode: installed app, Safari.)
