"""The reel's sound, made from numbers: a lo-fi beat at the timeline's tempo
and a sound for every moment in the timeline (the drop, each hop, each
tile, the title, the wink; in version 2 also the fall, each exit and the
birds over the campus). numpy only.
  python3 -I sound.py [timeline.json] [sound.wav]"""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'timeline.json')))
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'sound.wav')
# Version 2 lists moves (drop, hop, exit, fall) across four places; version 1, a drop and hops.
V2 = 'moves' in T
if V2:
    T['hops'] = [m for m in T['moves'] if m['kind'] == 'hop']
    T['dropIn'] = next(m for m in T['moves'] if m['kind'] == 'drop')
SR = 44100
N = int(SR * T['seconds'])
BEAT = 60 / T['bpm']
rng = np.random.default_rng(7)
music, sfx = np.zeros(N), np.zeros(N)

def t_(d): return np.arange(int(SR * d)) / SR
def put(bus, at, x, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    x = x[: N - i]
    bus[i:i + len(x)] += gain * x
def filt(x, lo=None, hi=None):
    """Smooth spectral low/high-pass (no scipy here)."""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if lo: g *= 1 / np.sqrt(1 + (f / lo) ** 4)
    if hi: g *= 1 / np.sqrt(1 + (hi / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * g, len(x))
def hz(midi): return 440 * 2 ** ((midi - 69) / 12)

# ---------- The beat ----------
def kick():
    t = t_(0.35); f = 45 + 85 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def snare():
    t = t_(0.25)
    return filt(rng.standard_normal(len(t)), lo=4000, hi=900) * np.exp(-t * 22) * 0.5 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.4
def hat():
    t = t_(0.06)
    return filt(rng.standard_normal(len(t)), hi=7000) * np.exp(-t * 70) * 0.25
def keys(notes, d):
    """A soft electric-piano chord: sine plus a little second harmonic, slow tremolo."""
    t = t_(d); env = (1 - np.exp(-t * 30)) * np.exp(-t * 0.9)
    x = sum(np.sin(2 * np.pi * hz(n) * t) + 0.18 * np.sin(4 * np.pi * hz(n) * t) for n in notes)
    return x * env * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)) / len(notes)
def bass(n, d):
    t = t_(d)
    return np.sin(2 * np.pi * hz(n) * t) * (1 - np.exp(-t * 60)) * np.exp(-t * 2.5)

BAR = 4 * BEAT
chords = [([53, 57, 60, 64], 41), ([52, 55, 59, 62], 40), ([50, 53, 57, 60], 38), ([48, 52, 55, 59], 36), ([53, 57, 60, 64], 41), ([48, 52, 55, 59, 62], 36)]
for b in range(int(np.ceil(T['seconds'] / BAR))):
    ch, root = chords[b % len(chords)]
    at = b * BAR
    put(music, at, keys(ch, BAR + 0.5), 0.5)
    for k, off in enumerate([0, 1.5, 2, 3.5]):
        put(music, at + off * BEAT, bass(root, BEAT * 0.9), 0.55 if k % 2 == 0 else 0.35)
drums_from = T['dropIn']['land']
beat = 0
while beat * BEAT < T['seconds']:
    at = beat * BEAT
    if at >= drums_from - 1e-6:
        if beat % 4 in (0, 2) or (beat % 4 == 3 and beat % 8 == 7): put(music, at + (0.25 * BEAT if beat % 8 == 7 else 0), kick(), 0.9)
        if beat % 4 in (1, 3): put(music, at, snare(), 0.6)
        for e in (0, 0.58):  # swung eighths
            put(music, at + e * BEAT, hat(), 0.7 if e == 0 else 0.45)
    beat += 1
music = filt(music, lo=3200)  # the lo-fi dullness
music += filt(rng.standard_normal(N), lo=1800, hi=300) * 0.008  # tape hiss
crackle = np.zeros(N); idx = rng.integers(0, N, 160); crackle[idx] = rng.uniform(-1, 1, 160)
music += filt(crackle, lo=5000, hi=1200) * 0.35
up = T['lightsUp']; tt = np.arange(N) / SR
music *= np.clip((tt - up[0]) / (up[1] - up[0]), 0.25, 1)

# ---------- The moments ----------
def boing(up=True, big=False):
    t = t_(0.32); f0, f1 = (230, 700) if up else (700, 230)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 9)); f *= 1 + 0.06 * np.sin(2 * np.pi * 26 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (6 if big else 9)) * (1 - np.exp(-t * 400))
def knock():
    t = t_(0.18)
    body = np.sin(2 * np.pi * 150 * t) * np.exp(-t * 35)
    tick = filt(rng.standard_normal(len(t)), lo=3000, hi=800) * np.exp(-t * 120)
    return body + 0.5 * tick
def bell(midi, d=1.4):
    t = t_(d); f = hz(midi)
    parts = [(1, 1, 3.2), (2.0, 0.35, 4.5), (2.76, 0.22, 6), (5.4, 0.1, 9)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k) for r, a, k in parts) * (1 - np.exp(-t * 800))
def whoosh(d):
    t = t_(d); env = np.sin(np.pi * t / d) ** 2
    return filt(rng.standard_normal(len(t)), lo=2500, hi=400) * env

def chirp(at, f0):
    t = t_(0.09); f = f0 * (1 + 0.5 * np.sin(np.pi * t / 0.09)) * (1 + 0.04 * np.sin(2 * np.pi * 60 * t))
    put(sfx, at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.09) ** 2, 0.08)

drops = [m for m in T['moves'] if m['kind'] == 'drop'] if V2 else [T['dropIn']]
for d in drops:
    put(sfx, d['from'], whoosh(d['land'] - d['from']), 0.35)
    put(sfx, d['land'], knock(), 1.0)
    put(sfx, d['land'], kick(), 0.6)
if V2:
    for m in T['moves']:
        if m['kind'] == 'exit': put(sfx, m['off'] - 0.03, boing(True, True), 0.5); put(sfx, m['off'] + 0.1, whoosh(0.45), 0.3)
        if m['kind'] == 'fall': put(sfx, m['from'], whoosh(m['to'] - m['from']), 0.45)
    # Birds over the campus while the aerial plays, and the cut flashes.
    for k in range(9):
        at = 0.4 + k * 0.37 + rng.uniform(0, 0.15)
        chirp(at, rng.uniform(2600, 3800)); chirp(at + 0.11, rng.uniform(2600, 3800))
    for sh in T['shots'][1:]:
        put(sfx, sh['from'] - 0.05, filt(rng.standard_normal(int(SR * 0.3)), lo=6000, hi=1500) * np.exp(-t_(0.3) * 14), 0.25)
for h in T['hops']:
    put(sfx, h['off'] - 0.03, boing(True, h.get('big')), 0.45)
    put(sfx, h['land'], knock(), 0.9)
    if isinstance(h['to'], int):
        put(sfx, h['land'], bell(84 + T['tiles'][h['to']]['note']), 0.5)
if V2:  # Before the beat: a soft pad over the aerial, so the place breathes before he arrives.
    pad = keys([53, 57, 60, 64, 67], drops[0]['land'] + 0.5)
    put(music, 0, pad * np.clip(t_(len(pad) / SR) / 1.5, 0, 1), 0.6)
for k, n in enumerate([72, 76, 79, 84, 88]):  # the title: a rising arpeggio of the tiles' notes
    put(sfx, T['titleIn'] + k * 0.09, bell(n, 2.0), 0.32)
wink = next(at for at, f in T['faces'] if f == 'wink')
for k, n in enumerate([96, 100, 103]):
    put(sfx, wink + k * 0.05, bell(n, 0.8), 0.18)

mix = music * 0.55 + sfx * 0.6
fo = T['fadeOut']; mix *= np.clip((fo[1] - tt) / (fo[1] - fo[0]), 0, 1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # soft limit
mix = mix / max(1e-9, np.abs(mix).max()) * 0.89
pcm = (np.stack([mix, mix], 1) * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(os.path.basename(OUT), T['seconds'], 's')
