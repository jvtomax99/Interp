"""The music bed: synthesized here (numpy only, no samples, no service), so
it is ours to use. 120 BPM, 45 s, C - G - Am - F, one chord per bar (2 s).
0-6 s      intro: pad and a filtered pulse; a clock ticks under the
           "half a second" countdown (2-3.5 s); silence for 250 ms, then
6 s        the drop on "insuficiencia cardíaca": drums and bass come in
6-37       groove under the nine screens (a beat every 500 ms; cuts land on them),
           a clap fill into 25
37-44      end card: kick and hats only
44-45      last hit, on "floor",, the chord rings out
Writes sfx/music.wav (48 kHz stereo). Mixed and ducked in build.py."""
import os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR, DUR, BPM = 48000, 45.0, 120
DROP, END, LAST = 6.0, 37.0, 44.0
BEAT = 60 / BPM
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
L, R = np.zeros(N), np.zeros(N)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
CHORDS = [(48, [60, 64, 67, 71]), (43, [59, 62, 67, 74]), (45, [60, 64, 69, 72]), (41, [60, 65, 69, 72])]  # Cmaj7 G Am F

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i + n] += sig[:n] * gain * (1 - pan) ** .5
    R[i:i + n] += sig[:n] * gain * (1 + pan) ** .5

# ---- pad: soft detuned saws, low-passed, one chord per bar
for bar in range(23):
    root, notes = CHORDS[bar % 4]
    n = int(2.2 * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / .25) * np.minimum(1, (2.2 - tt) / .35)
    for j, m in enumerate(notes):
        for det, pan in ((-.08, -.6), (.08, .6)):
            f = hz(m + det)
            s = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 7))
            add(s * env, bar * 2.0, .018, pan)
pad_l, pad_r = lowpass(L, 1800), lowpass(R, 1800)
L[:], R[:] = pad_l, pad_r

def kick():
    n = int(.32 * SR); tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt / .035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .12)
    click = rng.standard_normal(n) * np.exp(-tt / .004) * .25
    return np.tanh(1.6 * (body + click)) * .9

def clap():
    n = int(.22 * SR); tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    band = lowpass(noise, 2500) - lowpass(noise, 900)
    env = np.exp(-tt / .06) * (1 + .6 * np.exp(-((tt - .012) / .003) ** 2) + .6 * np.exp(-((tt - .024) / .003) ** 2))
    return band * env * 1.6

def hat(open_=False):
    n = int((.12 if open_ else .04) * SR); tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    return (noise - lowpass(noise, 7000)) * np.exp(-tt / (.04 if open_ else .012))

def bass(m, d=.22):
    n = int(d * SR); tt = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt)
    return np.tanh(1.4 * s) * np.minimum(1, tt / .006) * np.exp(-tt / .14)

K, C = kick(), clap()
for b in range(int(DUR / BEAT)):
    at = b * BEAT
    bar = int(at // 2); root = CHORDS[bar % 4][0]
    if at < DROP:
        # intro: a muted pulse on the beat, rising toward the drop
        if at < DROP - .5: add(bass(root + 12, .12), at, .10 + .10 * at / DROP)
        continue
    if at >= LAST:
        continue
    end = at >= END
    add(K, at, .85)
    if not end and b % 2 == 1: add(C, at, .32, .1)
    add(hat(), at + BEAT / 2, .16 if not end else .12, -.3)
    if b % 4 == 3 and not end: add(hat(True), at + BEAT * .75, .08, .3)
    if not end:
        add(bass(root), at + BEAT / 2, .32)
        add(bass(root + 12, .12), at + BEAT * .75, .12)
# the countdown clock: a tick every 250 ms, 2.0-3.5 s
for i in range(6): add(hat(), 2.0 + i * .25, .30 if i % 2 else .45, .4 if i % 2 else -.4)
# a clap roll into 25 s
for i in range(8): add(C, 24.0 + i * .125, .10 + .03 * i, .1)
# the drop, the end card, the last hit
add(K, DROP, .5); add(K, END, .4); add(K, LAST, .9)
# riser: filtered noise swelling into the drop, cut 250 ms early for a beat of silence
n = int(1.5 * SR); tt = np.arange(n) / SR
noise = rng.standard_normal(n)
sw = (noise - lowpass(noise, 1500)) * (tt / 1.5) ** 2.5 * .22
add(sw, DROP - .25 - 1.5, 1, -.2)
i0, i1 = int((DROP - .25) * SR), int(DROP * SR)
for ch in (L, R): ch[i0:i1] *= np.linspace(1, 0, i1 - i0) ** 8   # the gap before the drop

mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) / .5                   # peak -6 dBFS; level set in the mix
fade = np.minimum(1, (N - np.arange(N)) / (SR * 1.2))[:, None]
mix *= fade
os.makedirs(HERE + '/sfx', exist_ok=True)
with wave.open(HERE + '/sfx/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote sfx/music.wav', DUR, 's')
