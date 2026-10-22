"""The Hub's theme, "Built Here": the score for media/hub-promo.mp4.

Writes out/built-here.mid and out/fx.json (for synth.py). render.sh turns
them into audio and puts it under the video. Every time below is in seconds
on the video's own clock, measured from its cuts (ffmpeg scene detection,
2026-10-22):

    1.0   "Heart failure"            (the doctor's words)
    6.0   "¿Fallo cardíaco?"         (the wrong word, a question)
    7.9   "Insuficiencia cardíaca"   (the right word)
   10.73  "Built by our own interpreters", then a new card every 3.0 s
   36.65  the campus photo, then the Interpreter Hub title to the end (45)

A card every 3 s is one bar of 4/4 at 80, which is two bars at 160: the
music feels like 160 (its sixteenths, U, are 32 to a card) and sits on
that grid (bar(n, beat), unit(n, k)). Key: D major.

How it got here (Jose, 2026-10-22): warm and hopeful, then "more
exciting", then "a Latino flavor", then the energy of an anime fight track
he sent ("Delirious", Jujutsu Kaisen S2: measured, nothing taken from the
recording), then "the hook, the intro needs more refinement and a smoother
ending". So:

  The intro (after "I don't like the beginning... make it more like [the
  JJK track]"): built on the reference's measured shape. A low drone, the
  drop's groove behind a filter that opens, a climbing half-step cluster,
  the question as a wrong chord, a cut, and the drop on the right word.
  The hook: a trumpet line in 3-3-2 (the tresillo, the root of Latin
  rhythm and the pulse of that track), a call and an answer that comes
  back down to D. It carries the second half of the cards and the title,
  and the piano plays it slowly at the end.
  The Latin groove: clave, congas, bongos, cowbell, guiro, timbales,
  tumbao bass, piano montuno. The fight-track energy: string stabs in
  3-3-2, sixteenth hats with rolls, a backbeat, an 808 sub (synth.py),
  risers, drops into silence and slams.
"""
import json
import math
import os
import random

import mido

random.seed(7)  # the same small human wobble on every render

TPB = 480          # ticks per beat
BEAT = 0.75        # seconds per beat at 80 bpm
T0 = 1.7333        # where bar 0 would start; bar 3 is the first card cut
S16 = BEAT / 4     # a slot: 16 to a bar, one clave cycle
U = BEAT / 8       # a sixteenth at 160: 32 to a bar


def bar(n, beat=0.0):
    """Seconds at bar n, beat (0-based) of the card grid."""
    return T0 + 3.0 * n + BEAT * beat


def slot(b, k):
    return bar(b, k / 4)


def unit(b, k):
    return bar(b, k / 8)


# One channel per part. The General MIDI programs only matter for a quick
# preview in any MIDI player; instruments.py picks the recorded instruments.
PARTS = {
    'piano':   (0, 0),    # Acoustic Grand: the slow tune, and the hook at the end
    'keys':    (1, 0),    # the same piano: the montuno
    'strings': (2, 49),   # Slow Strings: the bed
    'cello':   (3, 42),   # Cello: under the campus photo and the ending
    'guitar':  (4, 24),   # Nylon Guitar: the right word
    'bells':   (5, 9),    # Glockenspiel: the right word, the title
    'trem':    (6, 44),   # Tremolo Strings: the tension under the question
    'pad':     (7, 89),   # Warm Pad: under everything, very low
    'bass':    (8, 33),   # Fingered Bass: the tumbao
    'drums':   (9, 0),    # the GM drum kit is always channel 10 (index 9)
    'stabs':   (10, 48),  # String Ensemble, played short and hard: the 3-3-2 hits
    'brass':   (11, 61),  # Brass Section: the hook an octave down, stabs
    'lead':    (12, 56),  # Trumpet: the hook
}
REVERB = {'drums': 28, 'bass': 20, 'lead': 50}  # reverb send per part (others 70)
# Channel volume per part (others 127), set from each part rendered alone so
# the tune on top leads: strings, bass and stabs are loud in this bank.
VOLUME = {'strings': 62, 'pad': 64, 'bass': 80, 'cello': 80, 'brass': 84,
          'guitar': 96, 'drums': 106, 'keys': 110, 'stabs': 80, 'trem': 84,
          'lead': 90}

events = []  # (seconds, part, note, velocity, length in seconds)
fx = {'sub': [], 'riser': [], 'impact': [], 'cut': []}  # made by synth.py


def n(part, t, note, vel, dur, wobble=0.0):
    if wobble:
        t += random.uniform(-wobble, wobble)
        vel += random.randint(-4, 4)
    events.append((max(0.0, t), part, note, max(1, min(127, vel)), dur))


def chord(part, t, notes, vel, dur, roll=0.0):
    for i, x in enumerate(notes):
        n(part, t + i * roll, x, vel, dur)


def sub(t, note, dur, vel=100):
    fx['sub'].append([round(t, 4), note, round(dur, 4), vel])


# Note numbers.
A1 = 33
D2, E2, Fs2, G2, A2, B2 = 38, 40, 42, 43, 45, 47
Cs3, D3, E3, Fs3, G3, A3, B3 = 49, 50, 52, 54, 55, 57, 59
Cs4, D4, E4, Fs4, G4, A4, B4 = 61, 62, 64, 66, 67, 69, 71
Cs5, D5, E5, Fs5, G5, A5, B5 = 73, 74, 76, 78, 79, 81, 83
D6, Fs6, A6 = 86, 90, 93

# Chords by name: (bass root, triad for stabs and montuno, bed for strings).
CH = {
    'D':    (D2, [D4, Fs4, A4], [D3, A3, Fs4, A4]),
    'A/C#': (Cs3 - 12, [Cs4, E4, A4], [Cs3, A3, E4, A4]),
    'A':    (A1, [Cs4, E4, A4], [A2, E3, Cs4, E4]),
    'Asus': (A1, [D4, E4, A4], [A2, E3, D4, E4]),
    'Bm':   (B2 - 12, [B3, D4, Fs4], [B2, Fs3, D4, Fs4]),
    'G':    (G2, [B3, D4, G4], [G2, D3, B3, D4]),
}

# ---------- The hook ----------
# In sixteenths at 160 (units), lengths in units: the call 3-3-2-2-3-3,
# the answer 3-3-2-2-6, coming back down to D.
HOOK = [(0, D5, 3), (3, A5, 3), (6, Fs5, 2), (8, E5, 2), (10, Fs5, 3), (13, A5, 3),
        (16, B5, 3), (19, A5, 3), (22, Fs5, 2), (24, E5, 2), (26, D5, 6)]


def hook(t0, vel=96, upto=32, start=0, step=U, piano=False):
    """The hook from t0: trumpet on top, the brass an octave down (or the
    piano alone, in octaves)."""
    for k, x, length in HOOK:
        if not start <= k < upto:
            continue
        t, dur = t0 + (k - start) * step, length * step * 0.92
        if k in (13, 26):  # a phrase ends: the player breathes before the next
            dur = length * step * 0.7
        accent = 8 if k in (0, 16) else 0
        if piano:
            n('piano', t, x, vel + accent, dur * 1.6, wobble=0.008)
            n('piano', t, x - 12, vel - 24, dur * 1.6)
        else:
            n('lead', t, x, vel + accent, dur, wobble=0.004)
            n('brass', t, x - 12, vel - 16 + accent, dur)


# ---------- The percussion ----------
# GM drum-kit notes (channel 10).
KICK, SNARE, CLAP, HAT, CRASH = 36, 38, 39, 42, 49
HI_BONGO, LO_BONGO = 60, 61
MUTE_CONGA, OPEN_CONGA, LO_CONGA = 62, 63, 64
HI_TIMB, LO_TIMB, COWBELL = 65, 66, 56
CLAVES, MARACAS, GUIRO_S, GUIRO_L = 75, 70, 73, 74


def hit(t, x, vel, dur=0.2):
    n('drums', t, x, vel, dur, wobble=0.004)


def roll(start, end, v0, v1, step):
    """A timbale roll, high and low drum in turn, swelling."""
    count = int((end - start) / step)
    for k in range(count):
        hit(start + k * step, HI_TIMB if k % 2 else LO_TIMB,
            int(v0 + (v1 - v0) * k / max(1, count - 1)), step)


def fill(b, start=12):
    """Timbales into the next bar: four slots."""
    for k, x in enumerate([HI_TIMB, HI_TIMB, LO_TIMB, LO_TIMB]):
        hit(slot(b, start + k), x, 76 + 6 * k)


CLAVE = [0, 3, 6, 10, 12]                       # son clave, 3-2, in slots
TUMBAO = [(0, MUTE_CONGA, 34), (2, MUTE_CONGA, 72), (4, MUTE_CONGA, 30),
          (6, OPEN_CONGA, 70), (7, LO_CONGA, 66)]  # one half bar
MARTILLO = [(0, HI_BONGO, 62), (2, HI_BONGO, 40), (4, LO_BONGO, 56),
            (6, HI_BONGO, 44)]
BELL = [(0, 84), (2, 50), (4, 70), (6, 50), (8, 84), (10, 50), (12, 70), (14, 50)]


def latin(b, busy, since=0.0, until=99.0, scale=1.0):
    """One bar of the Latin groove. busy: cowbell and the lub-dub kick
    instead of bongos."""
    def h(k, x, v):
        if since <= slot(b, k) < until:
            hit(slot(b, k), x, int(v * scale))
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


def hats(b, vel=1.0, since=0.0, until=99.0, roll_end=False):
    """Sixteenths at 160; roll_end ends the bar in thirty-seconds."""
    for k in range(32):
        t = unit(b, k)
        if not since <= t < until:
            continue
        if roll_end and k >= 28:
            for j in range(2):
                hit(t + j * U / 2, HAT, int((44 + 8 * (k - 28)) * vel), 0.05)
        else:
            hit(t, HAT, int((60 if k % 4 == 0 else 44 if k % 2 == 0 else 30) * vel), 0.08)


def backbeat(b, vel, since=0.0, until=99.0):
    for beat in (1, 3):
        if since <= bar(b, beat) < until:
            hit(bar(b, beat), SNARE, vel)
            hit(bar(b, beat), CLAP, vel - 22)


# ---------- Harmony helpers ----------
def stab(t, notes, vel):
    chord('stabs', t, notes, vel, U * 1.6)


def stabs_at(t0, name, beats, vel):
    """3-3-2 in each beat from t0 on one chord, the first hit accented."""
    lo, mid, top = CH[name][1]
    for beat in range(beats):
        for i, k in enumerate((0, 3, 6)):
            stab(t0 + beat * BEAT + k * U, [lo - 12, mid - 12, top - 12, lo], vel + (12 if i == 0 else 0))


def stabs(b, halves, vel, beats=4):
    for beat in range(beats):
        stabs_at(bar(b, beat), halves[beat // 2], 1, vel)


MONTUNO = [(0, 'C'), (2, 'O'), (3, 'C'), (5, 'O'), (6, 'C'), (8, 'O'),
           (10, 'C'), (11, 'O'), (13, 'C'), (14, 'O')]


def montuno(b, name, vel=56):
    """The piano's syncopated figure: the top note in octaves ('O') and the
    two notes under it ('C')."""
    lo, mid, top = CH[name][1]
    for k, kind in MONTUNO:
        notes = [top - 12, top] if kind == 'O' else [lo, mid]
        chord('keys', slot(b, k), notes, vel + (8 if k in CLAVE else 0), S16 * 0.9)


def tumbao(b, halves, nxt, since=0.0, doubled=False):
    """The bass that pushes: in each half bar, the root on 2-and and the
    next chord's root early, on 4. doubled: the 808 plays it too."""
    roots = [CH[h][0] for h in halves] + [CH[nxt][0]]
    for half in (0, 1):
        for k, x, v, length in [(3, roots[half], 92, 3), (6, roots[half + 1], 96, 5)]:
            t = slot(b, half * 8 + k)
            if t >= since:
                n('bass', t, x, v, S16 * length * 0.95, wobble=0.004)
                if doubled:
                    sub(t, x, S16 * length * 0.95, 100)


def bed(t0, name, vel, dur=1.5):
    chord('strings', t0, CH[name][2], vel, dur - 0.05)  # a breath for the bow change
    chord('pad', t0, CH[name][2][:3], 42, dur - 0.05)


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
    for i in range(len(fx['sub']) - 1, -1, -1):
        t, x, dur, vel = fx['sub'][i]
        if d0 <= t < d1:
            del fx['sub'][i]
        elif t < d0 < t + dur:
            fx['sub'][i][2] = round(d0 - t, 4)


# ---------- Intro (0 - 10.73): built on the shape of Jose's reference ----------
# Jose, 2026-10-22: "I don't like the beginning... make it more like [the
# JJK track]." Measured from his reference, nothing taken from it: a dark,
# low drone almost alone (all its energy near 54 Hz), then the sound opening
# up (its brightness climbing from ~80 Hz to ~1 kHz over about 3.5 s, about
# 13 dB louder, a clashing cluster of notes), then a drop onto a heavy bass
# moving by half steps. Here: a drone on A from the first frame; the drop's
# own groove playing behind a filter that opens from the first title to the
# question (synth.py, fx 'sweep'); strings in a half-step cluster that
# climbs; the question hits; a cut; and the right word drops it all in.
OPEN = bar(0, -1)                     # 0.983: on the grid, with the first title
QUESTION, CUT, RIGHT = 6.0, 7.6, 7.9
DROP = unit(2, 2)                     # 7.92: the drop's grid, 20 ms after the cut
C2, Eb2, Eb3, Bb3, Eb4, F4, Bb4, C5 = 36, 39, 51, 58, 63, 65, 70, 72

# the drone: low cellos on A and E, an 808 under them, rising all the way
chord('cello', 0.15, [A2, E3], 60, CUT - 0.15)
for t0, t1, v in [(0.15, 2.5, 36), (2.5, 4.5, 46), (4.5, QUESTION, 58), (QUESTION, CUT, 72)]:
    sub(t0, A1, t1 - t0 - 0.02, v)
fx['impact'].append([OPEN, 0.35])     # "Heart failure": a deep boom, nothing bright
hit(OPEN, LO_TIMB, 70)


def dark_groove(t0, t1, scale=lambda t: 1.0, bass_from=0.0, kick_from=0.0, low=lambda t: 1.0):
    """The drop's groove, in 16-unit cycles from t0: kick in 3-3-2, the
    backbeat at 160, sixteenth hats, congas, the 808 moving by half steps
    around D (from bass_from on; the kick from kick_from), and low string stabs on D with the half
    step above. scale(t) sets how hard it plays at each moment, low(t) the
    kick and the bass on top of that."""
    BASSLINE = [(0, D2, 3), (3, D2, 3), (6, Eb2, 2), (8, D2, 2), (10, C2, 3), (13, D2, 3)]
    cycle = 16 * U
    m = 0
    while t0 + m * cycle < t1:
        c = t0 + m * cycle
        def at(k):
            return c + k * U
        for k, x, length in BASSLINE:
            if bass_from <= at(k) < t1:
                sub(at(k), x, length * U * 0.95, int(104 * scale(at(k)) * low(at(k))))
                n('bass', at(k), x, int(86 * scale(at(k)) * low(at(k))), length * U * 0.9)
        for k, v in [(0, 104), (6, 86), (10, 92)]:
            if kick_from <= at(k) < t1:
                hit(at(k), KICK, int(v * scale(at(k)) * low(at(k))))
        if at(8) < t1:
            hit(at(8), SNARE, int(94 * scale(at(8))))
            hit(at(8), CLAP, int(72 * scale(at(8))))
        for k in range(16):
            if at(k) < t1:
                hit(at(k), HAT, int((58 if k % 4 == 0 else 42 if k % 2 == 0 else 28) * scale(at(k))), 0.08)
        for half in (0, 8):
            for k, x, v in TUMBAO:
                if at(half + k) < t1:
                    hit(at(half + k), x, int(v * scale(at(half + k))))
        for k, notes in [(0, [D3, A3, D4]), (3, [D3, A3, D4]), (6, [Eb3, Bb3, Eb4]),
                         (10, [D3, A3, D4]), (13, [D3, A3, D4])]:
            if at(k) < t1:
                stab(at(k), notes, int((78 if k in (0, 10) else 64) * scale(at(k))))
        m += 1


# from the first title to the question: the groove behind the closing filter
# it plays soft at first and grows; the kick joins at 3.0 and the 808 at 4.0
dark_groove(OPEN, CUT, scale=lambda t: 0.4 + 0.45 * (t - OPEN) / (CUT - OPEN), bass_from=4.0, kick_from=3.0,
            low=lambda t: 0.35 + 0.35 * max(0.0, t - 3.0) / (CUT - 3.0))   # the drop keeps the full weight
fx['sweep'] = [[0.0, CUT, [[0.0, 150], [OPEN, 200], [3.0, 450], [4.5, 900],
                           [QUESTION, 2500], [7.0, 6000], [CUT, 14000]]]]
# the cluster: violins in tremolo on two notes a half step apart, climbing
for t0, t1, pair in [(3.0, 4.6, (A4, Bb4)), (4.6, QUESTION, (Bb4, B4)),
                     (QUESTION, 6.8, (B4, C5)), (6.8, CUT, (C5, Cs5))]:
    chord('trem', t0, list(pair), 84, t1 - t0)
fx['riser'].append([3.0, CUT, 2.2])   # louder than the others: it is what opens up

# 6.0 "¿Fallo cardíaco?": a wrong chord, hit hard, and the roll takes over
chord('brass', QUESTION, [Bb3, D4, F4], 96, 0.4)
chord('stabs', QUESTION, [Bb3, D4, F4], 96, U * 1.6)
hit(QUESTION, CRASH, 70, 1.0)
roll(QUESTION + 0.2, CUT, 40, 108, 0.0625)
fx['cut'].append([CUT, RIGHT])

# 7.9 "Insuficiencia cardíaca": the drop. Everything, open, on D.
fx['impact'].append([RIGHT, 1.1])
for x, v in [(CRASH, 108), (KICK, 112), (LO_TIMB, 100)]:
    hit(RIGHT, x, v, 2.0)
chord('brass', RIGHT, [D3, A3, D4, A4], 100, 0.5)
dark_groove(DROP, bar(2, 3))
chord('strings', RIGHT, [D3, A3, D4, A4], 72, bar(3) - RIGHT)
n('bells', RIGHT + 0.05, A5, 60, 1.5)  # the right word still shines
n('bells', RIGHT + 0.3, D6, 56, 1.5)
fill(2, 12)
n('piano', bar(2, 3), Fs4, 70, BEAT)   # pick-up into the slow tune
n('piano', bar(2, 3.5), G4, 70, BEAT)

# ---------- Cards, first time: the Latin groove and the slow tune (bars 3 - 6) ----------
FIRST = ['D', 'A/C#', 'Bm', 'G']
for i, name in enumerate(FIRST):
    b = 3 + i
    latin(b, False)
    montuno(b, name)
    tumbao(b, (name, name), FIRST[i + 1] if i < 3 else 'Bm')
    bed(bar(b), name, 54 + 2 * i, 3.0)
    backbeat(b, 62)
    sub(bar(b), CH[name][0], 1.45, 84)
    sub(bar(b, 2), CH[name][0], 0.7 if b == 6 else 1.45, 76)
hit(bar(3), CRASH, 84, 2.0)

TUNE1 = [  # (bar, beat, note, beats long)
    (3, 0, A4, 2), (3, 2, D5, 1), (3, 3, E5, 1),
    (4, 0, E5, 2), (4, 2, Cs5, 2),
    (5, 0, D5, 2), (5, 2, Fs5, 1), (5, 3, E5, 1),
    (6, 0, B4, 3), (6, 3, Cs5, 1),
]
for b, beat, x, length in TUNE1:
    n('piano', bar(b, beat), x, 96, length * BEAT * 0.98, wobble=0.01)

# the drop before the second time: all but the piano's pick-up stops, a
# riser fills the gap, and bar 7 slams in with the hook.
drop(bar(6, 3), bar(7), keep=('piano',))
fx['riser'].append([bar(6, 1), bar(7), 0.8])

# ---------- Cards, second time: the hook, full energy (bars 7 - 10) ----------
SECOND = [('Bm', 'G'), ('D', 'A'), ('Bm', 'G'), ('D', 'A')]
fx['impact'].append([bar(7), 0.9])
hit(bar(7), CRASH, 100, 2.0)
for i, halves in enumerate(SECOND):
    b = 7 + i
    hook(bar(b), vel=96 + 3 * i)
    latin(b, True)
    stabs(b, halves, 66)
    hats(b, roll_end=b in (8, 10))
    backbeat(b, 96)
    tumbao(b, halves, SECOND[i + 1][0] if i < 3 else 'G', doubled=True)
    for half, name in enumerate(halves):
        bed(bar(b, 2 * half), name, 62 + 2 * i)
    if b == 9:  # the second pair: the piano sparkles an octave up
        for k, x, length in HOOK:
            n('piano', unit(b, k), x + 12, 58, length * U * 0.9)
fill(8, 12)
fill(10, 12)

# ---------- "Stuck? Ask Dr. Smiley": the big drop (bar 11) ----------
t_g, t_sus, HOME = bar(11), bar(11, 1), 36.65
chord('strings', t_g, CH['G'][2], 70, t_sus - t_g)
n('bass', t_g, G2, 96, t_sus - t_g)
sub(t_g, G2, t_sus - t_g, 100)
for k in (0, 3, 6):  # brass stabs on the clave
    chord('brass', slot(11, k), [B3, D4, G4] if k == 0 else [Cs4, E4, A4], 84, S16 * 1.4)
hit(t_g, CRASH, 80, 1.5)
n('piano', t_g, B4, 92, BEAT)
n('piano', t_sus, D5, 94, 0.5)
n('piano', t_sus + 0.5, Cs5, 96, HOME - t_sus - 0.5)
drop(t_sus, HOME, keep=('piano', 'drums'))
roll(slot(11, 7), HOME - 0.2, 60, 112, 0.0625)
gap, t = 0.26, t_sus  # the stabs stutter faster and faster
while t < HOME - 0.25:
    stab(t, [A3, E4, A4, Cs5], int(70 + 40 * (t - t_sus) / (HOME - t_sus)))
    t += gap
    gap = max(0.07, gap * 0.8)
fx['riser'].append([t_g, HOME - 0.2, 1.0])
fx['cut'].append([HOME - 0.2, HOME])

# ---------- The campus and the title (36.65 - 45) ----------
# The slam, the groove under the title with the hook one last time, and
# then a soft landing: the drums fall away, the piano plays the hook's call
# slowly and it rings out on D.
fx['impact'].append([HOME, 1.1])
for x, v in [(CRASH, 112), (KICK, 112), (LO_TIMB, 104)]:
    hit(HOME, x, v, 2.5)
sub(HOME, D2, 1.0, 112)
n('bass', HOME, D2, 104, 1.0)
chord('brass', HOME, [D3, A3, D4, Fs4], 92, 0.45)
chord('strings', HOME, [D3, A3, D4, Fs4, A4], 76, bar(12) - HOME)
chord('cello', HOME, [D2, D3], 72, bar(12) - HOME)
chord('piano', HOME + 0.02, [D5, Fs5, A5, D6], 90, 1.0, roll=0.02)
for k, x in enumerate([A5, D6, Fs6, A6]):  # the title appears
    n('bells', 37.25 + k * 0.19, x, 58 - 3 * k, 1.6)
hats(11, since=HOME + 0.4, vel=0.8)
for k, x, v in TUMBAO:                     # congas carry into the last hook
    hit(HOME + 0.375 + 2 * k * U, x, v)

hook(bar(12), vel=100)                     # 37.73 - 40.73, over D | G, then Asus
latin(12, True)
stabs(12, ('D', 'G'), 62, beats=3)
hats(12)
backbeat(12, 90)
tumbao(12, ('D', 'G'), 'D', doubled=True)
bed(bar(12), 'D', 64)
bed(bar(12, 2), 'G', 64, 0.75)
bed(bar(12, 3), 'Asus', 66, 0.75)          # the last D of the hook hangs on A

# 40.73: home. The drums fall away (congas and maracas fading out), strings
# and cello hold D, then G over D, then D; the piano plays the call at
# half speed, and the last chord rings out under the fade.
OUT, LAST = bar(13), bar(13) + 2.4
# Jose, 2026-10-22: "a better transition at the end. Like the sound gets
# lower and lower before it ends." From OUT the sound closes, the mirror of
# the intro opening: a filter darkening from 14 kHz to 300 Hz, and the
# level easing down evenly (in dB) to silence at the end (synth.py).
fx['sweep'].append([OUT, 45.1, [[OUT, 14000], [42.0, 5000], [43.3, 1600], [44.3, 700], [45.1, 300]]])
fx['fade'] = [[OUT + 0.3, 45.1, -30]]
fx['impact'].append([OUT, 0.5])
hit(OUT, CRASH, 72, 3.0)
sub(OUT, D2, 2.4, 78)
n('bass', OUT, D2, 80, 2.4)
latin(13, False, until=42.6, scale=0.7)
for i in range(len(events)):               # ... and fading
    t, p, x, vel, dur = events[i]
    if p == 'drums' and OUT < t < 42.6:
        events[i] = (t, p, x, max(1, int(vel * (1 - (t - OUT) / 2.0))), dur)
chord('strings', OUT, CH['D'][2], 66, 1.2)
chord('strings', OUT + 1.2, [D3, B3, D4, G4], 62, 1.2)
chord('strings', LAST, CH['D'][2], 58, 45.1 - LAST)
chord('pad', OUT, CH['D'][2][:3], 50, 45.1 - OUT)
chord('cello', OUT, [D2, D3], 66, 45.1 - OUT)
hook(OUT, vel=74, upto=16, step=U * 1.5, piano=True)   # the call, slowly
chord('piano', LAST, [D3, A3, D4, Fs4], 58, 45.1 - LAST, roll=0.04)
n('piano', LAST + 0.05, D5, 70, 45.1 - LAST)
n('lead', LAST + 0.05, D5, 60, 1.4)
n('bells', LAST + 0.2, D6, 44, 1.6)

# ---------- The human feel (Jose, 2026-10-22: prompt 2) ----------
# "Make the playing human: notes slightly ahead or behind the beat, the
# congas and bongos a little loose, and every hit at a slightly different
# loudness, so no two in a row are identical." Every note stays; only when
# it lands and how hard it's played move. Each part has a feel, like a
# player's: (lean in ms, + is behind the beat; spread in ms; loudness spread).
FEEL = {
    'piano': (6, 7, 5), 'keys': (-3, 6, 6), 'strings': (10, 6, 3), 'pad': (12, 4, 2),
    'trem': (8, 6, 3), 'stabs': (0, 5, 6), 'cello': (8, 6, 3), 'bass': (-6, 5, 5),
    'brass': (6, 6, 5), 'lead': (8, 6, 5), 'guitar': (0, 8, 5), 'bells': (0, 4, 4),
}
DRUM_FEEL = {  # by drum note; the clave is the anchor, the hand drums loosest
    CLAVES: (0, 3, 4), COWBELL: (-3, 4, 6), MUTE_CONGA: (4, 10, 8),
    OPEN_CONGA: (4, 10, 8), LO_CONGA: (4, 10, 8), HI_BONGO: (2, 9, 8),
    LO_BONGO: (2, 9, 8), GUIRO_S: (5, 10, 6), GUIRO_L: (5, 10, 6),
    MARACAS: (0, 6, 6), HAT: (0, 4, 7), KICK: (0, 2, 4), SNARE: (6, 3, 5),
    CLAP: (6, 3, 5), CRASH: (0, 2, 3), HI_TIMB: (0, 6, 7), LO_TIMB: (0, 6, 7),
}
SWING = {HAT: 6, MARACAS: 10}  # ms late on the off sixteenths
# The slams stay exactly on the cut: hits there don't move.
SYNC = [OPEN, RIGHT, bar(7), HOME, OUT]


def feel(part, note):
    return DRUM_FEEL.get(note, (0, 4, 5)) if part == 'drums' else FEEL.get(part, (0, 4, 4))


def offset(part, t, note):
    """Seconds this note moves. Seeded by part and time, so the 808 under the
    bass moves exactly with the bass."""
    if any(abs(t - s) < 0.003 for s in SYNC):
        return 0.0
    lean, spread, _ = feel(part, note)
    r = random.Random(f'{part}:{round(t, 3)}')
    ms = lean + max(-2.5, min(2.5, r.gauss(0, 1))) * spread
    k = round((t - T0) / U)
    if part == 'drums' and k % 2 and abs(t - (T0 + k * U)) < 0.004:
        ms += SWING.get(note, 0)
    return ms / 1000


human = random.Random(11)
drift = {p: [human.uniform(0, 6.28) for _ in range(2)] for p in PARTS}
last = {}
events.sort(key=lambda e: (e[1], e[0]))
for i, (t, p, x, vel, dur) in enumerate(events):
    _, _, vel_spread = feel(p, x)
    a, b = drift[p]
    swell = 3 * math.sin(t / 3.1 + a) + 2 * math.sin(t / 1.3 + b)  # a player's slow ebb
    new = int(round(vel + swell + human.gauss(0, vel_spread)))
    new = max(1, min(127, new))
    if last.get((p, x)) == new:                   # never the same twice in a row
        new += 1 if new < 127 else -1
    last[(p, x)] = new
    events[i] = (max(0.0, t + offset(p, t, x)), p, x, new, dur)
for s in fx['sub']:
    s[0] = round(max(0.0, s[0] + offset('bass', s[0], 0)), 4)

# ---------- Phrasing (Jose, 2026-10-22: prompt 3) ----------
# "Shape the trumpet and strings like a real player: notes that swell and
# fade, a small scoop into the long hook notes, short breaths between
# phrases, and less loudness on the weaker beats." Still every note kept.
# Swells and fades are expression (CC11) curves through each held note or
# chord; the scoop is a pitch bend from just under the note (bend range
# +-200 cents); the breaths are in hook() and bed(); the weaker beats are
# played softer by where each note falls in the bar at 160.
controls = []  # (seconds, part, 'cc11' or 'bend', value)
SHAPED = {  # part: (start, peak, end) of the expression curve, peak at 40%
    'lead': (84, 118, 96), 'strings': (72, 112, 84), 'pad': (80, 104, 86),
    'trem': (62, 118, 104), 'cello': (74, 112, 86),
}
LONG = 0.25        # seconds: notes this long or longer swell (and on the trumpet, scoop)
SCOOP = -60        # cents below the note it starts from (a third of a semitone)
METRIC = {'lead': 1.0, 'brass': 1.0, 'stabs': 0.6, 'strings': 0.5}


def weight(t):
    """Velocity change by beat strength at 160: downbeats up, offbeats down."""
    k = round((t - T0) / U) % 32
    return 6 if k % 16 == 0 else 3 if k % 8 == 0 else 0 if k % 4 == 0 else -4 if k % 2 == 0 else -7


def curve(t, dur, part, values):
    """Expression from start to peak (at 40%) to end, a point every 30 ms."""
    a, peak, z = values
    steps = max(2, int(dur / 0.03))
    for i in range(steps + 1):
        f = i / steps
        if f < 0.4:
            x = a + (peak - a) * math.sin(f / 0.4 * math.pi / 2)
        else:
            x = peak + (z - peak) * ((f - 0.4) / 0.6) ** 1.5
        controls.append((t + f * dur * 0.95, part, 'cc11', int(round(x))))


# Jose, 2026-10-22: "make the sound more softer in mood": the hits are
# played gentler (a softer stroke sounds rounder, not just quieter).
SOFT = {'drums': 0.85, 'stabs': 0.85, 'brass': 0.88, 'lead': 0.9}
for i, (t, p, x, vel, dur) in enumerate(events):
    if p in SOFT:
        events[i] = (t, p, x, max(1, int(round(vel * SOFT[p]))), dur)

for i, (t, p, x, vel, dur) in enumerate(events):
    if p in METRIC:
        events[i] = (t, p, x, max(1, min(127, vel + int(round(weight(t) * METRIC[p])))), dur)

for part, values in SHAPED.items():
    groups = {}  # a chord is shaped as one: notes that start together
    for t, p, x, vel, dur in events:
        if p == part:
            key = round(t, 2)
            groups[key] = (min(t, groups.get(key, (t, 0))[0]), max(dur, groups.get(key, (t, 0))[1]))
    for t, dur in sorted(groups.values()):
        if part in ('cello', 'trem') and t < CUT:  # the intro: one rise, all the way to the cut
            steps = max(2, int(dur / 0.03))
            for j in range(steps + 1):
                tt = t + j / steps * dur * 0.97
                controls.append((tt, part, 'cc11', int(30 + 97 * min(1, max(0, (tt - 0.15) / (CUT - 0.15))) ** 1.4)))
        elif dur >= LONG:
            curve(t, dur, part, values)
        else:  # short notes: no swell, played at a steady, full expression
            controls.append((t - 0.002, part, 'cc11', values[1] - 6))
        if part == 'lead' and dur >= LONG:  # the scoop: up into the note in 100 ms
            for j in range(9):
                cents = SCOOP * (1 - j / 8) ** 1.5
                controls.append((max(0.0, t - 0.002 + j * 0.0125), part, 'bend', int(cents / 200 * 8191)))

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
    for t, p, kind, value in controls:
        if p == part:
            msg = (mido.Message('control_change', channel=ch, control=11, value=value) if kind == 'cc11'
                   else mido.Message('pitchwheel', channel=ch, pitch=value))
            msgs.append((ticks(t), msg))
    order = {'program_change': 0, 'note_off': 0, 'control_change': 1, 'pitchwheel': 1, 'note_on': 2}
    msgs.sort(key=lambda m: (m[0], order[m[1].type]))  # offs, then controls, then ons
    now = 0
    for at, msg in msgs:
        track.append(msg.copy(time=at - now))
        now = at

here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, 'out'), exist_ok=True)
mid.save(os.path.join(here, 'out', 'built-here.mid'))
with open(os.path.join(here, 'out', 'fx.json'), 'w') as f:
    json.dump(fx, f)
print(f'{len(events)} notes, {mid.length:.2f} s; '
      f"{len(fx['sub'])} sub notes, {len(fx['riser'])} risers, "
      f"{len(fx['impact'])} impacts, {len(fx['cut'])} cuts")
