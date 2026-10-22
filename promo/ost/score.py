"""The Hub's theme, "Built Here": the score for media/hub-promo.mp4.

Writes out/built-here.mid and out/fx.json (for synth.py). render.sh turns it into audio and puts it under
the video. Every time below is in seconds on the video's own clock, measured
from its cuts (ffmpeg scene detection, 2026-10-22):

    1.0   "Heart failure"            (the doctor's words)
    6.0   "¿Fallo cardíaco?"         (the wrong word, a question)
    7.9   "Insuficiencia cardíaca"   (the right word)
   10.73  "Built by our own interpreters", then a new card every 3.0 s
   36.65  the campus photo, then the Interpreter Hub title to the end (45)

A card every 3 s is one bar of 4/4 at 80 beats a minute, so from 10.73 the
music sits on that grid (bar(n, beat)). The intro and the ending follow
the cuts instead. Key: D major. Warm and hopeful, then (Jose, 2026-10-22)
"more exciting" and "a Latino flavor": a son/salsa groove under the cards.
One clave cycle is one card (a sixteenth of the bar is a salsa eighth, so
it moves like salsa at 160). Piano tune, piano montuno, tumbao bass, congas,
bongos, cowbell, guiro, timbales, nylon guitar, brass on the tune the
second time, and a soft kick that beats like a heart (lub-dub).
Then (Jose, 2026-10-22) inspired by an anime fight track he sent ("Delirious",
Jujutsu Kaisen S2): its energy measured and borrowed, nothing taken from the
recording. See "The anime energy" below.
"""
import json
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
    'guitar':  (4, 24),   # Nylon Guitar: the intro pulse, eighths in the second half
    'bells':   (5, 9),    # Glockenspiel: the right word, the title
    'timp':    (6, 47),   # Timpani: the heartbeat
    'pad':     (7, 89),   # Warm Pad: under everything, very low
    'bass':    (8, 33),   # Fingered Bass: the driving eighths
    'drums':   (9, 0),    # the GM drum kit is always channel 10 (index 9)
    'brass':   (11, 61),  # Brass Section: the tune, second time, stabs, the end
    'stabs':   (10, 48),  # String Ensemble, played short and hard: the 3-3-2 hits
    'trem':    (12, 44),  # Tremolo Strings: the dark intro
}
REVERB = {'drums': 28, 'bass': 20}  # reverb send per part (others 70)
# Channel volume per part (others 127), set from each part rendered alone so
# the piano tune sits on top: strings and bass are loud in this bank.
VOLUME = {'strings': 62, 'pad': 64, 'bass': 80, 'cello': 80,
          'brass': 90, 'guitar': 96, 'drums': 106, 'keys': 110,
          'stabs': 84, 'trem': 84}

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
    chord('strings', bar(b), bed, 64 + 2 * i, 3.0)
    chord('pad', bar(b), bed[:3], 44, 3.0)

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
    n('guitar', t_a + k * (HOME - t_a) / 6, x, 50 + 4 * k, 0.8)

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

# ---------- The groove: son/salsa (Jose, 2026-10-22) ----------
# GM drum-kit notes (channel 10).
KICK, CRASH = 36, 49
HI_BONGO, LO_BONGO = 60, 61
MUTE_CONGA, OPEN_CONGA, LO_CONGA = 62, 63, 64
HI_TIMB, LO_TIMB, COWBELL = 65, 66, 56
CLAVES, MARACAS, GUIRO_S, GUIRO_L = 75, 70, 73, 74
E8 = BEAT / 2
S16 = BEAT / 4     # one slot: a salsa eighth; 16 to a bar, one clave cycle


def hit(t, x, vel, dur=0.2):
    n('drums', t, x, vel, dur, wobble=0.004)


def slot(b, k):
    return bar(b, k / 4)


def roll(start, end, v0, v1, step):
    """A timbale roll, high and low drum in turn, swelling."""
    count = int((end - start) / step)
    for k in range(count):
        hit(start + k * step, HI_TIMB if k % 2 else LO_TIMB,
            int(v0 + (v1 - v0) * k / max(1, count - 1)), step)


def fill(b, start=12):
    """Timbales into the next bar: the last four slots."""
    for k, x in enumerate([HI_TIMB, HI_TIMB, LO_TIMB, LO_TIMB]):
        hit(slot(b, start + k), x, 76 + 6 * k)


CLAVE = [0, 3, 6, 10, 12]                       # son clave, 3-2
TUMBAO = [(0, MUTE_CONGA, 34), (2, MUTE_CONGA, 72), (4, MUTE_CONGA, 30),
          (6, OPEN_CONGA, 70), (7, LO_CONGA, 66)]  # one half bar
MARTILLO = [(0, HI_BONGO, 62), (2, HI_BONGO, 40), (4, LO_BONGO, 56),
            (6, HI_BONGO, 44)]
BELL = [(0, 84), (2, 50), (4, 70), (6, 50), (8, 84), (10, 50), (12, 70), (14, 50)]


def percussion(b, busy, until=99.0):
    """One bar of the groove. busy adds the cowbell and the heartbeat kick."""
    def h(k, x, v):
        if slot(b, k) < until:
            hit(slot(b, k), x, v)
    for k in CLAVE:
        h(k, CLAVES, 74)
    for half in (0, 8):
        for k, x, v in TUMBAO:
            h(half + k, x, v + (6 if busy else 0))
    for k in range(0, 16, 4):  # guiro: long, short, short
        h(k, GUIRO_L, 40)
        h(k + 2, GUIRO_S, 34)
        h(k + 3, GUIRO_S, 30)
    for k in range(16):
        h(k, MARACAS, 30 if k % 2 else 40)
    if busy:
        for k, v in BELL:
            h(k, COWBELL, v - 10)
        for beat, v in [(0, 88), (0.5, 60), (2, 84), (2.5, 58)]:  # lub-dub
            h(beat * 4, KICK, v)
    else:
        for half in (0, 8):
            for k, x, v in MARTILLO:
                h(half + k, x, v)
        h(0, KICK, 72)
        h(8, KICK, 64)


# Montuno: the piano's repeating syncopated figure, under the tune.
# 'O' = the top note in octaves, 'C' = the two notes under it.
MONTUNO = [(0, 'C'), (2, 'O'), (3, 'C'), (5, 'O'), (6, 'C'), (8, 'O'),
           (10, 'C'), (11, 'O'), (13, 'C'), (14, 'O')]


def montuno(b, triad, until=99.0, vel=58):
    lo, mid, top = triad
    for k, kind in MONTUNO:
        t = slot(b, k)
        if t >= until:
            break
        notes = [top - 12, top] if kind == 'O' else [lo, mid]
        chord('keys', t, notes, vel + (8 if k in CLAVE else 0), S16 * 0.9)


def tumbao(b, root, fifth, nxt, until=99.0):
    """The bass that pushes: on 2-and and 4 of the salsa bar, and the next
    chord's root arrives early, before the bar line."""
    for k, x, v, length in [(3, root, 92, 3), (6, fifth, 80, 2),
                            (11, root, 90, 3), (14, nxt, 96, 4)]:
        if slot(b, k) < until:
            n('bass', slot(b, k), x, v, S16 * length * 0.95, wobble=0.004)


# Intro: a nylon guitar ticks under the first word, then the string stabs
# take over (below), the maracas join, a timbale roll swells under the
# question, and everything lands on the right word.
t = bar(0, -1)
while t < 7.6:
    if t < 3.95:
        k = int(round((t - bar(0, -1)) / E8))
        n('guitar', t, [B3, Fs3 + 12, B3 + 12, Fs3 + 12][k % 4], int(52 + 6 * t), E8 * 1.6)
    else:
        hit(t, MARACAS, 30 + int(20 * (t - 4) / 4))
    t += E8
roll(6.0, 7.9, 24, 96, 0.0625)
for x, v in [(CRASH, 96), (KICK, 100), (LO_TIMB, 96)]:
    hit(7.9, x, v, 2.0)
chord('brass', 7.9, [D3, A3, D4, Fs4], 74, 0.5)   # a short stab
chord('brass', 8.43, [D3, A3, D4, Fs4], 64, 2.0)
n('bass', 7.9, D2, 90, 1.4)
for k in range(5, 16):  # the guitar and the clave start the groove early
    n('guitar', slot(2, k), [D3, A3, D4, A3][k % 4], 60, S16 * 1.8)
for k in CLAVE[3:]:
    hit(slot(2, k), CLAVES, 70)
for k, x, v in TUMBAO:
    hit(slot(2, 8 + k), x, v)
n('bass', slot(2, 14), D2, 90, S16 * 4)
fill(2, 12)

# Cards. First time: clave, congas, bongos, guiro, montuno, tumbao.
# Second time: cowbell, the heartbeat kick, brass on the tune.
CARDS = [  # bar: (montuno triad, bass root, fifth)
    (3, [D4, Fs4, A4], D2, A2), (4, [Cs4, E4, A4], Cs3 - 12, E2 + 12),
    (5, [B3, D4, Fs4], B2 - 12, Fs2), (6, [B3, D4, G4], G2, D3),
    (7, [B3, D4, G4], G2, D3), (8, [D4, Fs4, A4], Fs2, A2),
    (9, [E4, G4, B4], E2, B2 - 12), (10, [D4, Fs4, A4], B2 - 12, Fs2),
]
NEXT = [Cs3 - 12, B2 - 12, G2, G2, Fs2, E2, B2 - 12, G2]
for (b, triad, root, fifth), nxt in zip(CARDS, NEXT):
    busy = b >= 7
    percussion(b, busy)
    if not busy:  # the second time, the string stabs take its place
        montuno(b, triad, vel=56)
    tumbao(b, root, fifth, nxt)
hit(bar(3), CRASH, 84, 2.0)
hit(bar(7), CRASH, 100, 2.0)
fill(6, 12)
fill(10, 12)
for b, beat, x, length in TUNE2:  # brass sings the tune the second time
    n('brass', bar(b, beat), x - 12, 70, length * BEAT * 0.95)

# "Stuck?": brass stabs on the clave, a timbale roll swelling into the photo
for k in (0, 3, 6):
    chord('brass', slot(11, k), [B3, D4, G4] if k == 0 else [Cs4, E4, A4], 84, S16 * 1.4)
roll(slot(11, 7), HOME, 60, 112, 0.0625)
hit(slot(11, 0), CRASH, 80, 1.5)
n('bass', t_g, G2, 96, t_sus - t_g)
n('bass', t_sus, A2, 100, HOME - t_sus)

# The campus: one big landing, then the groove comes back under the title
# with the cowbell, and a last hit where the music settles.
for x, v in [(CRASH, 112), (KICK, 112), (LO_TIMB, 104)]:
    hit(HOME, x, v, 2.5)
n('bass', HOME, D2, 104, 1.0)
chord('brass', HOME, [D3, A3, D4, Fs4], 92, 0.45)
chord('brass', HOME + 0.56, [D3, A3, D4, Fs4], 84, 2.6)
END = 42.8
percussion(12, True, until=END)
percussion(13, True, until=END)
tumbao(12, D2, A2, D2, until=END)
tumbao(13, D2, A2, D2, until=END)
chord('brass', 41.25, [D3, B3, D4], 70, 1.55)
fill(13, 4)
for x, v in [(CRASH, 100), (KICK, 104), (LO_TIMB, 100), (HI_TIMB, 92)]:
    hit(42.85, x, v, 2.0)
n('bass', 42.85, D2, 92, 2.0)
chord('brass', 42.85, [D3, A3, Fs4, D5], 80, 2.1)

# ---------- The anime energy (Jose, 2026-10-22) ----------
# Inspired by "Delirious" (Jujutsu Kaisen S2), measured, not copied: it runs
# at 144 with a sub-bass under nearly everything, hard short stabs spaced
# 3-3-2 (the tresillo, which is also the root of Latin rhythm), a rise into
# each hit, and drops where it all cuts out before it slams back. Here it
# is 160, so a card is exactly two of its bars. synth.py makes the sounds
# the bank can't: the sub, the risers, the impacts and the cuts (fx).
SNARE, CLAP, HAT = 38, 39, 42
U = BEAT / 8                        # a sixteenth at 160: 32 to a bar
fx = {'sub': [], 'riser': [], 'impact': [], 'cut': []}


def unit(b, k):
    return bar(b, k / 8)


def sub(t, note, dur, vel=100):
    fx['sub'].append([round(t, 4), note, round(dur, 4), vel])


def stab(t, notes, vel):
    chord('stabs', t, notes, vel, U * 1.6)


def stabs(b, notes, vel, beats=range(4), since=0.0, until=99.0):
    """3-3-2 in every beat: three hard hits, the first one accented."""
    for beat in beats:
        for i, k in enumerate((0, 3, 6)):
            t = unit(b, beat * 8 + k)
            if since <= t < until:
                stab(t, notes, vel + (12 if i == 0 else 0))


def hats(b, vel=1.0, since=0.0, until=99.0, roll=False):
    """Sixteenths at 160; roll ends the bar in thirty-seconds, trap style."""
    for k in range(32):
        t = unit(b, k)
        if not since <= t < until:
            continue
        if roll and k >= 28:
            for j in range(2):
                hit(t + j * U / 2, HAT, int((44 + 8 * (k - 28)) * vel), 0.05)
        else:
            hit(t, HAT, int((60 if k % 4 == 0 else 44 if k % 2 == 0 else 30) * vel), 0.08)


def backbeat(b, vel, until=99.0):
    for beat in (1, 3):
        if bar(b, beat) < until:
            hit(bar(b, beat), SNARE, vel)
            hit(bar(b, beat), CLAP, vel - 22)


def drop(d0, d1, keep=()):
    """Everything not in keep stops at d0 and nothing new starts before d1."""
    for i in range(len(events) - 1, -1, -1):
        t, p, x, vel, dur = events[i]
        if p in keep:
            continue
        if d0 <= t < d1:
            del events[i]
        elif t < d0 < t + dur:
            events[i] = (t, p, x, vel, d0 - t)


# Intro, dark: tremolo strings and a low sub under the doctor's words, the
# stabs come in and climb, a riser under the question, a cut, and the
# right word slams in bright.
chord('trem', 1.0, [B2, Fs3, B3, D4], 46, 2.98)
chord('trem', 3.98, [G2, D3, B3, D4], 56, 2.02)
chord('trem', 6.0, [A2, E3, A3, D4], 70, 1.6)
sub(1.0, B2 - 12, 2.9, 48)
sub(3.98, G2 - 12, 2.0, 62)
sub(6.0, A2 - 12, 1.6, 80)
for beat in range(4):  # bar 1 (4.73 - 7.73): the stabs arrive, G then Asus
    for i, k in enumerate((0, 3, 6)):
        t = unit(1, beat * 8 + k)
        if t >= 7.6:
            break
        notes = [G2 + 12, B3, D4] if t < 5.95 else [A3, D4, E4]
        stab(t, notes, 50 + 6 * beat + (10 if i == 0 else 0))
stabs(0, [B2 + 12, D4, Fs4 - 12], 44, beats=(2, 3), since=3.98)
fx['riser'].append([4.6, 7.6, 0.9])
fx['cut'].append([7.6, 7.9])
fx['impact'].append([7.9, 1.0])
sub(7.9, D2, 1.4, 110)
stabs(2, [D3, A3, D4, Fs4], 64, beats=(1, 2, 3))
hats(2, vel=0.7, since=8.4)

# Cards, first time: the Latin groove leads; the sub holds the roots and a
# light backbeat keeps it moving.
for b, triad, root, fifth in CARDS[:4]:
    sub(bar(b), root, 1.45, 84)
    sub(bar(b, 2), root, 0.7 if b == 6 else 1.45, 76)  # bar 6: clear of the drop
    backbeat(b, 62)
# the drop before the second time: everything stops but the piano's pick-up
# note, a riser fills the gap, and bar 7 slams in.
drop(bar(6, 3), bar(7), keep=('piano',))
fx['riser'].append([bar(6, 1), bar(7), 0.8])
fx['impact'].append([bar(7), 0.9])

# Cards, second time: full energy. Stabs on every beat, sixteenth hats with
# trap rolls, a hard backbeat, the sub doubling the tumbao.
for b, triad, root, fifth in CARDS[4:]:
    lo, mid, top = triad
    stabs(b, [lo - 12, mid - 12, top - 12, lo], 72)
    hats(b, roll=b in (8, 10))
    backbeat(b, 96)

# "Stuck? Ask Dr. Smiley": the big drop. It all falls away but the piano and
# the timbale roll, stabs stutter faster and faster, a riser, half a breath
# of silence, and the campus slams in.
drop(t_sus, HOME, keep=('piano', 'drums'))
gap, t = 0.26, t_sus
while t < HOME - 0.25:
    stab(t, [A2 + 12, E3 + 12, A3 + 12, Cs4 + 12], int(70 + 40 * (t - t_sus) / (HOME - t_sus)))
    t += gap
    gap = max(0.07, gap * 0.8)
fx['riser'].append([bar(11), HOME - 0.2, 1.0])
fx['cut'].append([HOME - 0.2, HOME])
fx['impact'].append([HOME, 1.1])
sub(HOME, D2, 1.4, 112)

# The title: the groove with everything, then a last cut and a final hit.
for b in (12, 13):
    hats(b, since=bar(12), until=42.62, roll=b == 13)
    backbeat(b, 94, until=END)
stabs(12, [D3, A3, D4, Fs4], 72)
stabs(13, [D3, A3, D4, Fs4], 72, until=41.25)
stabs(13, [D3, B3, D4, G4], 72, since=41.25, until=END)
fx['cut'].append([42.62, 42.85])
fx['impact'].append([42.85, 1.0])
sub(42.85, D2, 2.0, 110)

# The sub doubles the tumbao wherever the energy is full.
for t, p, x, vel, dur in list(events):
    if p == 'bass' and (bar(7) <= t < bar(11) or bar(12) <= t < END):
        sub(t, x, dur, 100)

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
    msgs.append((0, mido.Message('control_change', channel=ch, control=91, value=REVERB.get(part, 70))))  # reverb send
    msgs.append((0, mido.Message('control_change', channel=ch, control=7, value=VOLUME.get(part, 127))))
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
with open(os.path.join(here, 'out', 'fx.json'), 'w') as f:
    json.dump(fx, f)
print(f"{len(fx['sub'])} sub notes, {len(fx['riser'])} risers, {len(fx['impact'])} impacts, {len(fx['cut'])} cuts")
