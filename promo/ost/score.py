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
the cuts instead. Key: D major. Warm and hopeful, and driving (Jose,
2026-10-22: "more exciting"): piano tune and strings, with drums, bass and
fast strings under the cards, horns on the tune the second time, and a
kick that beats like a heart (lub-dub) in the second half.
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
    'bass':    (8, 33),   # Fingered Bass: the driving eighths
    'drums':   (9, 0),    # the GM drum kit is always channel 10 (index 9)
    'stacc':   (10, 48),  # String Ensemble, played short: the pulse
    'horns':   (11, 60),  # French Horns: the tune, second time, and the end
}
REVERB = {'drums': 28, 'bass': 20}  # reverb send per part (others 70)
# Channel volume per part (others 127), set from each part rendered alone so
# the piano tune sits on top: strings and bass are loud in this bank.
VOLUME = {'strings': 72, 'pad': 64, 'bass': 80, 'stacc': 96, 'cello': 80,
          'horns': 80, 'drums': 106, 'keys': 110}

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
n('piano', 1.0, B4, 74, 1.6)
n('piano', 1.75, D5, 70, 1.6)
n('piano', 2.5, Fs5, 76, 2.0)
n('keys', 1.0, B2, 50, 3.0)
chord('strings', 4.0, [G2, D3, B3, D4], 50, 2.1)
n('keys', 4.0, G2, 50, 2.0)
n('piano', 4.0, E5, 68, 1.0)
n('piano', 4.75, D5, 66, 1.2)
# 6.0 "¿Fallo cardíaco?": left hanging on a suspended chord
chord('strings', 6.0, [A2, E3, D4, E4], 52, 1.95)
chord('pad', 6.0, [A2, E3, D4], 44, 1.95)
chord('piano', 6.0, [A3, D4, E4], 48, 1.9, roll=0.03)
n('piano', 6.75, B4, 62, 1.1)
# 7.9 "Insuficiencia cardíaca": it resolves, and the bells say so
chord('strings', 7.9, [D3, A3, Fs4, A4], 62, 2.9)
chord('pad', 7.9, [D3, A3, Fs4], 48, 2.9)
chord('piano', 7.9, [D3, A3, D4, Fs4, A4], 60, 2.8, roll=0.035)
n('piano', 8.08, D5, 84, 2.6)
n('bells', 7.95, A5, 52, 1.5)
n('bells', 8.2, D6, 48, 1.5)
# pick-up into the first card
n('piano', bar(2, 3), Fs4, 70, BEAT)
n('piano', bar(2, 3.5), G4, 70, BEAT)

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
    n('piano', bar(b, beat), x, 96, length * BEAT * 0.98, wobble=0.01)

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

TUNE2 = [
    (7, 0, D5, 1), (7, 1, G5, 2), (7, 3, Fs5, 1),
    (8, 0, A5, 2), (8, 2, Fs5, 1), (8, 3, D5, 1),
    (9, 0, E5, 2), (9, 2, G5, 1), (9, 3, Fs5, 1),
    (10, 0, D5, 3), (10, 3, Cs5, 1),
]
for b, beat, x, length in TUNE2:
    n('piano', bar(b, beat), x, 104, length * BEAT * 0.98, wobble=0.01)
    if length >= 2:  # the octave below on the long notes, for weight
        n('piano', bar(b, beat), x - 12, 70, length * BEAT * 0.98)

# ---------- "Stuck? Ask Dr. Smiley": G, Asus4, A, then home (bar 11) ----------
t_g, t_sus, t_a, HOME = bar(11), bar(11, 1), bar(11, 1.7), 36.65
chord('strings', t_g, [G2, D3, B3, D4], 70, t_sus - t_g)
chord('strings', t_sus, [A2, E3, D4, E4], 74, t_a - t_sus)
chord('strings', t_a, [A2, E3, Cs4, E4, G4], 78, HOME - t_a)
n('cello', t_g, G2, 72, t_sus - t_g)
n('cello', t_sus, A2, 76, HOME - t_sus)
n('timp', t_g, D2, 56, 0.4)
n('timp', t_a, A2, 50, 0.4)
n('piano', t_g, B4, 92, BEAT)
n('piano', t_sus, D5, 94, t_a - t_sus)
n('piano', t_a, Cs5, 96, HOME - t_a)
for k, x in enumerate([A3, Cs4, E4, A4, Cs5, E5]):  # the run up to the photo
    n('harp', t_a + k * (HOME - t_a) / 6, x, 50 + 4 * k, 0.8)

# ---------- The campus and the title (36.65 - 45) ----------
chord('strings', HOME, [D3, A3, D4, Fs4, A4], 76, 4.6)
chord('pad', HOME, [D3, A3, Fs4], 54, 8.0)
chord('cello', HOME, [D2, D3], 72, 4.6)
n('timp', HOME, D2, 74, 1.5)
chord('piano', HOME, [D2, A2, D3, Fs3, A3], 70, 4.0, roll=0.025)
chord('piano', HOME + 0.02, [D5, Fs5, A5, D6], 96, 4.0, roll=0.02)
for k, x in enumerate([A5, D6, Fs6, A6]):  # the title appears
    n('bells', 37.25 + k * 0.19, x, 58 - 3 * k, 1.6)
# the opening tune comes back, slower, over G/D
chord('strings', 41.25, [D3, B3, D4, G4], 66, 1.6)
n('cello', 41.25, D2, 62, 3.5)
for t, x in [(40.2, A4), (40.95, D5), (41.7, E5)]:
    n('piano', t, x, 80, 1.2, wobble=0.01)
# and settles on D, open and ringing to the end
chord('strings', 42.85, [D3, A3, Fs4, A4], 58, 2.15)
chord('piano', 42.85, [D3, A3, D4, Fs4], 56, 2.1, roll=0.04)
n('piano', 43.0, Fs5, 78, 2.0)
n('bells', 43.15, D6, 42, 1.8)

# ---------- The drive (Jose, 2026-10-22: "more exciting") ----------
KICK, SNARE, CLAP, HAT, OHAT, CRASH, RIDE = 36, 38, 39, 42, 46, 49, 51
TOM_L, TOM_M, TOM_H, SHAKER = 45, 47, 50, 70
E8 = BEAT / 2


def hit(t, x, vel, dur=0.25):
    n('drums', t, x, vel, dur, wobble=0.004)


def roll(start, end, x, v0, v1, step):
    k, count = 0, int((end - start) / step)
    while k < count:
        hit(start + k * step, x, int(v0 + (v1 - v0) * k / max(1, count - 1)), step)
        k += 1


# Intro: strings tick in eighths from the first word and grow; a snare roll
# under the question; everything lands on the right word.
t = bar(0, -1)
while t < 7.85:
    root = B2 if t < 3.95 else G2 if t < 5.95 else A2
    v = int(38 + 40 * t / 7.9)
    n('stacc', t, root + 12, v, E8 * 0.6)
    n('stacc', t, root + 19, v - 8, E8 * 0.6)
    if t >= 3.95:
        hit(t, SHAKER, 30 + int(20 * (t - 4) / 4))
    t += E8
roll(6.0, 7.9, SNARE, 26, 92, 0.0625)
roll(6.9, 7.9, TOM_L, 30, 70, 0.125)
for x, v in [(CRASH, 96), (KICK, 100), (TOM_L, 80)]:
    hit(7.9, x, v, 2.0)
chord('horns', 7.9, [D3, A3, D4, Fs4], 70, 2.6)
n('bass', 7.9, D2, 90, 1.4)
t = 8.65
while t < bar(3) - 0.75:  # the pulse keeps going on D
    n('stacc', t, D3, 60, E8 * 0.6)
    n('stacc', t, A3, 52, E8 * 0.6)
    hit(t, HAT, 44 if (t - 8.65) % BEAT < 0.01 else 30)
    t += E8
hit(bar(2, 2), KICK, 84)
for k, x in enumerate([TOM_H, TOM_H, TOM_M, TOM_L]):  # fill into the first card
    hit(bar(2, 3) + k * E8 / 2, x, 70 + 6 * k)

# Cards: bass and strings in eighths, a groove that gets busier each half.
ROOTS = [D2, Cs3 - 12, B2 - 12, G2, G2, Fs2, E2, B2 - 12]
for i, root in enumerate(ROOTS):
    b = 3 + i
    second = i >= 4
    for k in range(8):
        t = bar(b, k * 0.5)
        up = 12 if second and k % 4 == 3 else 0  # an octave jump to push it
        n('bass', t, root + up, 92 if k % 2 == 0 else 74, E8 * 0.85, wobble=0.004)
        n('stacc', t, root + 24, 58 if k % 2 == 0 else 46, E8 * 0.55)
        n('stacc', t, root + 31, 50 if k % 2 == 0 else 40, E8 * 0.55)
    if second:
        # the heart: lub-dub on beats 1 and 3
        for beat, v in [(0, 104), (0.5, 72), (2, 100), (2.5, 70)]:
            hit(bar(b, beat), KICK, v)
        for k in range(16):  # sixteenth hats
            hit(bar(b, k * 0.25), HAT, 54 if k % 2 == 0 else 34, 0.1)
    else:
        for beat in (0, 1.5, 2):
            hit(bar(b, beat), KICK, 96 if beat != 1.5 else 76)
        for k in range(8):
            hit(bar(b, k * 0.5), OHAT if k == 7 else HAT, 50 if k % 2 == 0 else 36, 0.15)
    for beat in (1, 3):
        hit(bar(b, beat), SNARE, 86 if second else 78)
        hit(bar(b, beat), CLAP, 60 if second else 44)
hit(bar(3), CRASH, 84, 2.0)
hit(bar(7), CRASH, 100, 2.0)
for k, x in enumerate([SNARE, SNARE, TOM_H, TOM_M, TOM_M, TOM_L, TOM_L, TOM_L]):
    hit(bar(6, 3) + k * E8 / 2, x, 62 + 4 * k)  # fill into the second time
# horns sing the tune with the piano the second time
for b, beat, x, length in TUNE2:
    n('horns', bar(b, beat), x - 12, 70, length * BEAT * 0.95)

# "Stuck?": a snare roll that speeds up and swells into the campus photo
roll(t_g, t_a, SNARE, 52, 80, 0.125)
roll(t_a, HOME, SNARE, 80, 110, 0.0625)
roll(t_g, HOME, TOM_L, 40, 90, 0.1875)
n('bass', t_g, G2, 96, t_sus - t_g)
n('bass', t_sus, A2, 100, HOME - t_sus)
chord('horns', t_sus, [A2 + 12, E3, Cs4], 80, HOME - t_sus)

# The campus: one big landing, then a half-time groove under the title,
# and a last hit where the music settles.
for x, v in [(CRASH, 112), (KICK, 112), (TOM_L, 90)]:
    hit(HOME, x, v, 2.5)
n('bass', HOME, D2, 104, 1.0)
chord('horns', HOME, [D3, A3, D4, Fs4], 92, 3.5)
for b in (12, 13):
    root = D2
    for k in range(8):
        t = bar(b, k * 0.5)
        if t >= 42.8:
            break
        n('bass', t, root + (12 if k % 4 == 3 else 0), 84 if k % 2 == 0 else 66, E8 * 0.85)
        hit(t, RIDE, 52 if k % 2 == 0 else 38, 0.3)
    for beat, x, v in [(0, KICK, 96), (1.5, KICK, 70), (2, SNARE, 84)]:
        if bar(b, beat) < 42.8:
            hit(bar(b, beat), x, v)
chord('horns', 41.25, [D3, B3, D4], 70, 1.55)
for x, v in [(CRASH, 96), (KICK, 100)]:
    hit(42.85, x, v, 2.0)
n('bass', 42.85, D2, 90, 2.0)
chord('horns', 42.85, [D3, A3, Fs4], 66, 2.1)

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
    msgs.append((0, mido.Message('control_change', channel=ch, control=91, value=REVERB.get(part, 70))))
    msgs.append((0, mido.Message('control_change', channel=ch, control=7, value=VOLUME.get(part, 127))))  # reverb send
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
