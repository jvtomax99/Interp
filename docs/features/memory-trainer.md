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

Bottom of More, under "Measure smoothness". Its code is
`features/voice-check.js` (moved out of `index.html` on 2026-10-23), its
styles the block "Voice and mic check" in `app.css`, overlay `#voiceCheckOverlay`. Four steps: play a Spanish and an English
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

**Safari tab, 2026-10-19** (same phone, same build): same voices. Spanish
played (3.9 s; es-US asked, the phone chose a voice itself), English 5.3 s.
Record + play back works (128 KB). Speech to text in English **works**:
"Hello hello hello", first words after 3.4 s. Spanish still read "listening"
when copied. Loudness after the mic not answered.

So far: speech to text works in a Safari tab; in the installed app it has
not produced words yet (one run, possibly copied early). **Still to run:**
in the installed app, Listen in English, speak, wait until the line says
"done" or an error, then Copy; Spanish the same way in either mode.

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
ok|fix, `fix`, `at`). The first version of the page lost Jose's first pass
(it showed marks before the save was confirmed); it now keeps marks on the
phone, says per line whether it saved, and has Copy my review as a fallback.

**Outcome (Jose, 2026-10-19):** all 60 marked Good, then the 12 riskiest
(`reviews2`) Good, both at under a second per line, so not read line by
line. Jose's call: ship them as approved-unread (`status` in the file,
`reviewed` stays false) and catch mistakes in use with a **Flag this line**
button in the trainer (M2): it saves the line id and what's wrong, and the
flags are read back before lines are edited.

## M2: the trainer

Its own screen (`activeCategory === 'memory'`, `renderMemTrainer`), opened
from the **Consecutive** tile on CoreCHI Practice, after the ways in
(`memEntryHtml`, `openMemoryTrainer`). Not in the tools list. Block
"Memory trainer" in `index.html`'s script (it calls `audioMode` from `features/voice-check.js`)
and a CSS block of the same name (before the campus block), in Practice's
clay and candy buttons.

A round (`MEM.stage`): **listen** (the line read aloud, words hidden, a
ring filling for about words / 2.6 s; Dr. Smiley `attentive`, `listen`),
**turn** ("Your turn, say it in Spanish"; `processing`, `ponder`), then
**check** (one button per meaning chunk, model rendering over the source;
tap the ones you dropped or changed; the line's `note` under them; Hear it
again). Next line scores it and plays the next one from the same tap (iOS
speaks only from a tap). Stop or leaving the screen (`memLeave`, called in
`setCategory`) cancels the voice and ends Dr. Smiley's task. No speech on
the browser: the line is shown to read once (**read**), then hidden.

Voices by name (`memVoice`): Paulina for Spanish, Samantha for English;
otherwise the language's default voice. Rate 0.92.

The ladder (`memScore`, `memPick`): level starts at 6 words. Three clean in
a row: level = max(level, that line) + 3. Two misses in a row: level =
min(level, that line) - 3. Range 4-44. The next line is within 3 words of
the level (widened until one fits), in the direction picked, least heard
first, never the same twice running. Under 10 words the False Friends
`heard`/`truth` lines are the starters (split at commas when both sides
match). Span = the longest clean line, kept apart for notes on and off.

Stored on the phone only, `ih_memory`: `level`, `clean`, `miss`, `notes`,
`dir` (both | en-es | es-en), `seen` {id: times}, `log` (last 600: `at`,
`id`, `w` words, `n` chunks, `miss` chunks missed, `notes`), `best`
{mem, notes}. M4 charts the log.

**Flag this line** (after the rendering): reasons (chips) and/or a note,
kept in `ih_memFlags` then written to `terminology-meta/memory-flags`
(`{flags: {<lineId>_<ms>: {line, src, model, reasons, what, by, at,
build}}}`, merged; no new rule needed). Unsent flags are retried when the
trainer opens. Read them before editing `memory/lines.json`.

`memory/lines.json` is precached by `sw.js`. Suite:
`tests/suites/memory-trainer.cjs`.

## M3: record yourself

**Record me** on the start card (`p.rec` in `ih_memory`, off by default,
Jose 2026-10-19). On: the mic opens only at Your turn (`memRecStart`, after
the line has played, so the voice is never played with the mic open) and
closes at Show the rendering (`memRecStop`); 60 s cap; "Recording 0:07" on
screen. The check stage then has **Listen back: Mine** (your take,
`MEMREC.url`) and **Model** (the model rendering read by the voice of the
language you rendered into). The take is in memory only and dropped
(`memRecDrop`) when the next line starts or you leave; never sent. Mic
refused or no recorder: it says so and the round goes on.

The quieter voice after the mic: `audioMode()` sets
`navigator.audioSession.type` to `play-and-record` before the mic and back
to `playback` after it (Safari 16.4+; nothing elsewhere). Unproven on
Jose's phone: the Voice and mic check has **Try the volume fix** (step 3),
which sets playback and plays Spanish; the report has "Volume fix" and a
yes/no line. If it doesn't help, the fallback in `docs/PLAN.md` stands
(earbuds).

**Second installed-app run, 2026-10-20** (build b1020.0830, before M3, so
without the fix): Jose: "it sounds fine", the voice as loud after the mic
this time. So the quiet voice of the first run doesn't happen every time;
the fix stays as a guard (it only sets the audio session back to playback).
Same voices, now each listed twice (Paulina and Samantha both there). Speech
to text still not tried in the installed app: M5 stays on hold.

**Speech to text in the installed app, 2026-10-20** (build b1020.0955):
English **works**, "This is a test test", first words after 3.5 s, then
done. Spanish: the first try read "error: aborted" (most likely the check
itself: starting one Listen aborts the other while it's still listening);
alone, it **works**, "Esto es un examen" (copied while still "hearing").
So both languages give words in the installed app: M5 can go ahead.

## M4: span chart

**Your span, by week** on the trainer's start card, under Start (Jose
picked the start card; above Start it pushed Start under the tab bar on a
phone). `renderSpanChart`, `memSpanWeeks`: the last 8 weeks, Monday to
Sunday (local), one bead per week at the longest clean line (`w` of a log
entry with `miss` 0); memory only is the main line with a fill, notes a
lighter second line with hollow beads and a key. Weeks with nothing clean
are skipped; older than 8 weeks isn't drawn (the "best ever" in the foot
still counts it). Scale: 20 words, or the top value rounded up to 10.
Tap a bead (`memSpanPick`) to read its week; again for this week. Look and
motion are Practice's score line (`trend-*` classes, `data-motion="span"`,
plays once per change, then still). The span number on the Practice tile
is the M2 one (Jose: nothing more).

## M5: auto-mark

**Auto-mark** on the start card (`p.auto`, off by default, Jose
2026-10-20; shown only where the phone has `webkitSpeechRecognition`).
On: at Your turn `memSRStart` listens (continuous, interim results, es-US
or en-US for the language you render into; restarted up to 4 times when
iOS ends it after a pause), "Auto-mark: 12 words heard" on screen. Show the
rendering stops it (`memSRFinish`, waits for the last words or 1.5 s), then
`memAutoMarks` pre-marks each chunk it didn't hear and tags it "not heard";
the card shows what it heard (`memAutoLine`). Your taps win (`MEM.touched`:
once you tap, late results don't re-mark). The log keeps `am`, the number
the phone marked, next to your `miss`, to tune the matching later.

Matching, phone only (Jose's pick; Haiku later if needed): words folded
(accents, case, punctuation), small words skipped (`MEM_STOP`), a chunk is
heard when half its content words are in the transcript, a word matches on
its first 5 letters too (tome/toma, puede/pueden), every number word and
digit counts as one "number" token (48 = cuarenta y ocho). A paraphrase
gets marked; you untap it. If listening can't start without a tap
(unproven on iPhone; `not-allowed`), a **Start listening** button starts
it. Unproven too: Record me and Auto-mark both on at once (two users of the
mic). Apple may process the speech on its servers: the switch says to
practise away from patients.
