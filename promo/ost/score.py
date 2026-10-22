"""The Hub's theme, "Built Here": the score for media/hub-promo.mp4.

Writes out/built-here.mid. render.sh turns it into audio and puts it under
the video. Every time below is in seconds on the video's own clock, measured
from its cuts (ffmpeg scene detection, 2026-10-22):

    1.0   "Heart failure"            (the doctor's words)
    6.0   "¿Fallo cardíaco?"         (the wrong word, a question)
    7.9   "Insuficiencia cardíaca"   (the right word)
   10.73  "Built by our own interpreters", then a new card every 3.0 s
   36.65  the campus photo, then the Interpreter Hub title to the end (45)

A card every 3 s is one bar of 4/4 at 80 beats a minute, so from 10.73 the
music sits on that grid (bar(n, beat)). The intro and the ending follow
the cuts instead. Key: D major. Warm and hopeful: piano tune, strings
under it, a soft timpani heartbeat in the second half.
"""
import os
import random

import mido

random.seed(7)  # the same small human wobble on every render

TPB = 480          # ticks per beat
BEAT = 0.75        # seconds per beat at 80 bpm
T0 = 1.7333        # where bar 0 would start; bar 3 is the first card cut


def bar(n, beat=0.0):
    """Seconds at bar n, beat (0-based) of the card grid."""
    return T0 + 3.0 * n + BEAT * beat


# General MIDI programs from the FluidR3 bank, one channel each.
PARTS = {
    'piano':   (0, 0),    # Acoustic Grand: the tune
    'keys':    (1, 0),    # the same piano, accompaniment, softer
    'strings': (2, 49),   # Slow Strings: the bed
    'cello':   (3, 42),   # Cello: the bass in the second half
    'harp':    (4, 46),   # Harp: moving eighths in the second half
    'bells':   (5, 9),    # Glockenspiel: the right word, the title
    'timp':    (6, 47),   # Timpani: the heartbeat
    'pad':     (7, 89),   # Warm Pad: under everything, very low
}

events = []  # (seconds, part, note, velocity, length in seconds)


def n(part, t, note, vel, dur, wobble=0.0):
    if wobble:
        t += random.uniform(-wobble, wobble)
        vel += random.randint(-4, 4)
    events.append((max(0.0, t), part, note, max(1, min(127, vel)), dur))


def chord(part, t, notes, vel, dur, roll=0.0):
    for i, x in enumerate(notes):
        n(part, t + i * roll, x, vel, dur)


# Note numbers.
D2, E2, Fs2, G2, A2, B2 = 38, 40, 42, 43, 45, 47
Cs3, D3, E3, Fs3, G3, A3, B3 = 49, 50, 52, 54, 55, 57, 59
Cs4, D4, E4, Fs4, G4, A4, B4 = 61, 62, 64, 66, 67, 69, 71
Cs5, D5, E5, Fs5, G5, A5, B5 = 73, 74, 76, 78, 79, 81, 83
D6, Fs6, A6 = 86, 90, 93

# ---------- Intro: the question and the right word (0 - 10.73) ----------
chord('pad', 0.0, [B2, Fs3, D4], 50, 6.0)
chord('strings', 0.2, [B2, Fs3, D4], 46, 4.0)
n('piano', 1.0, B4, 58, 1.6)
n('piano', 1.75, D5, 54, 1.6)
n('piano', 2.5, Fs5, 60, 2.0)
n('keys', 1.0, B2, 50, 3.0)
chord('strings', 4.0, [G2, D3, B3, D4], 50, 2.1)
n('keys', 4.0, G2, 50, 2.0)
n('piano', 4.0, E5, 52, 1.0)
n('piano', 4.75, D5, 50, 1.2)
# 6.0 "¿Fallo cardíaco?": left hanging on a suspended chord
chord('strings', 6.0, [A2, E3, D4, E4], 52, 1.95)
chord('pad', 6.0, [A2, E3, D4], 44, 1.95)
chord('piano', 6.0, [A3, D4, E4], 48, 1.9, roll=0.03)
n('piano', 6.75, B4, 46, 1.1)
# 7.9 "Insuficiencia cardíaca": it resolves, and the bells say so
chord('strings', 7.9, [D3, A3, Fs4, A4], 62, 2.9)
chord('pad', 7.9, [D3, A3, Fs4], 48, 2.9)
chord('piano', 7.9, [D3, A3, D4, Fs4, A4], 60, 2.8, roll=0.035)
n('piano', 8.08, D5, 68, 2.6)
n('bells', 7.95, A5, 52, 1.5)
n('bells', 8.2, D6, 48, 1.5)
# pick-up into the first card
n('piano', bar(2, 3), Fs4, 54, BEAT)
n('piano', bar(2, 3.5), G4, 54, BEAT)

# ---------- Cards, first time: D  A/C#  Bm  G (bars 3 - 6) ----------
FIRST = [
    ([D2, A2], [D3, A3, Fs4, A4], [Fs3, A3, D4]),
    ([Cs3, A2 + 12], [Cs3, A3, E4, A4], [E3, A3, Cs4]),
    ([B2, Fs3], [B2, Fs3, D4, Fs4], [Fs3, B3, D4]),
    ([G2, D3], [G2, D3, B3, D4], [G3, B3, D4]),
]
for i, (bass, bed, broken) in enumerate(FIRST):
    b = 3 + i
    chord('keys', bar(b), bass, 56, 2 * BEAT)
    for k, x in enumerate(broken):
        n('keys', bar(b, 1 + k), x, 42, BEAT, wobble=0.008)
    chord('strings', bar(b), bed, 54 + 2 * i, 3.0)
    chord('pad', bar(b), bed[:3], 40, 3.0)

TUNE1 = [  # (bar, beat, note, beats long)
    (3, 0, A4, 2), (3, 2, D5, 1), (3, 3, E5, 1),
    (4, 0, E5, 2), (4, 2, Cs5, 2),
    (5, 0, D5, 2), (5, 2, Fs5, 1), (5, 3, E5, 1),
    (6, 0, B4, 3), (6, 3, Cs5, 1),
]
for b, beat, x, length in TUNE1:
    n('piano', bar(b, beat), x, 72, length * BEAT * 0.98, wobble=0.01)

# ---------- Cards, second time: G  D/F#  Em7  Bm7 (bars 7 - 10) ----------
SECOND = [
    (G2, [G2, D3, B3, D4], [G3, B3, D4, G4]),
    (Fs2, [Fs2, A3, D4, Fs4], [Fs3, A3, D4, Fs4]),
    (E2, [E3, B3, D4, G4], [E3, G3, B3, D4]),
    (B2 - 12, [B2, Fs3, A3, D4], [Fs3, A3, B3, D4]),
]
for i, (root, bed, arp) in enumerate(SECOND):
    b = 7 + i
    n('cello', bar(b), root, 70, 2.9)
    n('cello', bar(b), root + 12, 54, 2.9)
    chord('keys', bar(b), [root + 12, root + 19], 54, 2 * BEAT)
    chord('strings', bar(b), bed, 64 + 2 * i, 3.0)
    chord('pad', bar(b), bed[:3], 44, 3.0)
    for k in range(8):  # eighths, up and back down
        x = arp[[0, 1, 2, 3, 2, 3, 1, 2][k]] + 12
        n('harp', bar(b, k * 0.5), x, 46 if k % 2 else 54, BEAT, wobble=0.006)
    # heartbeat: lub-dub on beat 1
    n('timp', bar(b), D2, 54, 0.5)
    n('timp', bar(b, 0.5), D2, 36, 0.5)

TUNE2 = [
    (7, 0, D5, 1), (7, 1, G5, 2), (7, 3, Fs5, 1),
    (8, 0, A5, 2), (8, 2, Fs5, 1), (8, 3, D5, 1),
    (9, 0, E5, 2), (9, 2, G5, 1), (9, 3, Fs5, 1),
    (10, 0, D5, 3), (10, 3, Cs5, 1),
]
for b, beat, x, length in TUNE2:
    n('piano', bar(b, beat), x, 78, length * BEAT * 0.98, wobble=0.01)
    if length >= 2:  # the octave below on the long notes, for weight
        n('piano', bar(b, beat), x - 12, 54, length * BEAT * 0.98)

# ---------- "Stuck? Ask Dr. Smiley": G, Asus4, A, then home (bar 11) ----------
t_g, t_sus, t_a, HOME = bar(11), bar(11, 1), bar(11, 1.7), 36.65
chord('strings', t_g, [G2, D3, B3, D4], 70, t_sus - t_g)
chord('strings', t_sus, [A2, E3, D4, E4], 74, t_a - t_sus)
chord('strings', t_a, [A2, E3, Cs4, E4, G4], 78, HOME - t_a)
n('cello', t_g, G2, 72, t_sus - t_g)
n('cello', t_sus, A2, 76, HOME - t_sus)
n('timp', t_g, D2, 56, 0.4)
n('timp', t_a, A2, 50, 0.4)
n('piano', t_g, B4, 76, BEAT)
n('piano', t_sus, D5, 78, t_a - t_sus)
n('piano', t_a, Cs5, 80, HOME - t_a)
for k, x in enumerate([A3, Cs4, E4, A4, Cs5, E5]):  # the run up to the photo
    n('harp', t_a + k * (HOME - t_a) / 6, x, 50 + 4 * k, 0.8)

# ---------- The campus and the title (36.65 - 45) ----------
chord('strings', HOME, [D3, A3, D4, Fs4, A4], 76, 4.6)
chord('pad', HOME, [D3, A3, Fs4], 54, 8.0)
chord('cello', HOME, [D2, D3], 72, 4.6)
n('timp', HOME, D2, 74, 1.5)
chord('piano', HOME, [D2, A2, D3, Fs3, A3], 70, 4.0, roll=0.025)
chord('piano', HOME + 0.02, [D5, Fs5, A5, D6], 76, 4.0, roll=0.02)
for k, x in enumerate([A5, D6, Fs6, A6]):  # the title appears
    n('bells', 37.25 + k * 0.19, x, 58 - 3 * k, 1.6)
# the opening tune comes back, slower, over G/D
chord('strings', 41.25, [D3, B3, D4, G4], 66, 1.6)
n('cello', 41.25, D2, 62, 3.5)
for t, x in [(40.2, A4), (40.95, D5), (41.7, E5)]:
    n('piano', t, x, 64, 1.2, wobble=0.01)
# and settles on D, open and ringing to the end
chord('strings', 42.85, [D3, A3, Fs4, A4], 58, 2.15)
chord('piano', 42.85, [D3, A3, D4, Fs4], 56, 2.1, roll=0.04)
n('piano', 43.0, Fs5, 62, 2.0)
n('bells', 43.15, D6, 42, 1.8)

# ---------- write the MIDI file ----------
# A note struck again while still sounding: end the first one just before,
# or its note-off would cut the new one dead.
events.sort(key=lambda e: (e[1], e[2], e[0]))
for i in range(len(events) - 1):
    t, p, x, vel, dur = events[i]
    nt, np_, nx = events[i + 1][:3]
    if (p, x) == (np_, nx) and t + dur > nt - 0.01:
        events[i] = (t, p, x, vel, max(0.05, nt - t - 0.01))

mid = mido.MidiFile(ticks_per_beat=TPB)
meta = mido.MidiTrack()
mid.tracks.append(meta)
meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(80)))
meta.append(mido.MetaMessage('time_signature', numerator=4, denominator=4))


def ticks(s):
    return int(round(s / BEAT * TPB))


for part, (ch, prog) in PARTS.items():
    track = mido.MidiTrack()
    mid.tracks.append(track)
    msgs = [(0, mido.Message('program_change', channel=ch, program=prog))]
    msgs.append((0, mido.Message('control_change', channel=ch, control=91, value=70)))  # reverb send
    for t, p, x, vel, dur in events:
        if p != part:
            continue
        msgs.append((ticks(t), mido.Message('note_on', channel=ch, note=x, velocity=vel)))
        msgs.append((ticks(t + dur), mido.Message('note_off', channel=ch, note=x, velocity=0)))
    msgs.sort(key=lambda m: (m[0], m[1].type == 'note_on'))  # offs before ons
    now = 0
    for at, msg in msgs:
        track.append(msg.copy(time=at - now))
        now = at

here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, 'out'), exist_ok=True)
mid.save(os.path.join(here, 'out', 'built-here.mid'))
print(f'{len(events)} notes, {mid.length:.2f} s')
