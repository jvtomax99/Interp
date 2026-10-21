"""The remake's music, re-cut to follow its script (Jose, 2026-10-21).

v11's music was cut to v11's captions: the hook from 0, the logo at 8 s, one feature every 3 s
from 10 s, the end card at 37 s. The remake's features are 2.5 s, it adds the 3D Body (3.5 s) and
starts after a 2.5 s walk-in. Every caption must still land on the accent it had in v11, and the
music must not sound cut ("the audio seems to get cut off"), so:

- the music runs as v11 has it, continuously, from the words on;
- each 2.5 s feature drops one beat (0.5 s) of its 3 s, the beat that sounds most like the next
  one, so the skip is not heard; the hook drops one beat between the right word and the logo;
- the 3D Body (not in v11) is a 3.5 s stretch from elsewhere in the song, chosen so that both
  jumps (in and back out) land between moments that sound alike;
- the end card keeps v11's finale, jumping once from its first second;
- every jump is on the beat grid (one beat = 0.500 s, measured on .465/.965), crossfaded over 40 ms
  just before the beat's attack;
- before the words, an idle sound under the walk-in: soft air ("air") or a quiet open fifth on A
  ("pad"), swelling into the first words.

  python3 -I promo/hub-blend/tools/music.py <v11.mp4> <out.m4a> [air|pad]"""
import subprocess, sys
import numpy as np

V11, OUT = sys.argv[1], sys.argv[2]
IDLE = sys.argv[3] if len(sys.argv) > 3 else "air"
SR = 48000
WALK = 2.5           # the walk-in before the words
BEAT, PHASE = 0.5, 0.465
XF = 0.04            # crossfade at a jump
PRE = 0.012          # the crossfade ends this long before the beat's attack

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", V11, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                     check=True, capture_output=True).stdout
src = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
DUR = len(src) / SR

# ---- what each moment sounds like: spectrum bands and pitch classes, 50 ms frames ----
mono = src.mean(1)
HOP, N = 2400, 4096
frames = np.lib.stride_tricks.sliding_window_view(mono, N)[::HOP] * np.hanning(N)
spec = np.abs(np.fft.rfft(frames, axis=1))
freq = np.fft.rfftfreq(N, 1 / SR)
edges = np.geomspace(40, 12000, 25)
bands = np.log1p(np.stack([spec[:, (freq >= a) & (freq < b)].sum(1) for a, b in zip(edges[:-1], edges[1:])], 1))
m = (freq > 60) & (freq < 2000)
pc = ((np.round(12 * np.log2(freq[m] / 440)) + 9) % 12).astype(int)
chroma = np.stack([spec[:, m][:, pc == k].sum(1) for k in range(12)], 1)
chroma /= chroma.sum(1, keepdims=True) + 1e-9
feat = np.concatenate([bands / bands.max(), chroma * 4], 1)
FPS = SR / HOP

def around(t, w=0.5):
    a, b = int((t - w) * FPS), int((t + w) * FPS)
    v = feat[max(0, a):b].ravel()
    return (v - v.mean()) / (v.std() + 1e-9)

def sim(t1, t2):
    """How alike the music sounds around two moments (1 = the same)."""
    a, b = around(t1), around(t2)
    n = min(len(a), len(b))
    return float(np.dot(a[:n], b[:n]) / n)

def beats(a, b):
    k0 = int(np.ceil((a - PHASE) / BEAT))
    return [PHASE + k * BEAT for k in range(k0, 10**6) if PHASE + k * BEAT <= b]

# ---- the edit: a list of (v11 from, v11 to) runs, played back to back ----
runs = []
def drop_beat(s, e, lo, hi):
    """v11 [s, e) minus the one beat in [lo, hi) whose skip is least audible."""
    cands = [b for b in beats(lo, hi - BEAT)]
    b = max(cands, key=lambda b: sim(b, b + BEAT))
    return [(s, b), (b + BEAT, e)], b, sim(b, b + BEAT)

log = []
hook, b, q = drop_beat(0.0, 8.0, 6.05, 8.0)                 # hook: 8 s of v11 into 7.5
runs += hook; log.append(f"hook: drop beat {b:.3f} (alike {q:.2f})")
runs.append((8.0, 10.0))                                     # logo
FEAT_V11 = {"home": 10, "glossary": 13, "translate": 16, "physician": 19, "falsefriends": 22,
            "drills": 25, "cert": 28, "team": 31, "ask": 34}
ORDER = ["home", "glossary", "body", "translate", "physician", "falsefriends", "drills", "cert", "team", "ask"]
for g in ORDER:
    if g == "body":
        # 3.5 s from elsewhere: in from v11 16.0 (where glossary ends), out back to 16.0
        best = None
        for x in beats(9.0, 33.0):
            x0 = x + 0.035  # caption grid (.0/.5) vs beat grid
            if abs(x0 - 16.0) < 3.5:
                continue
            score = sim(16.0, x0) + sim(x0 + 3.5, 16.0)
            if best is None or score > best[0]:
                best = (score, x0)
        x0 = best[1]
        runs.append((x0, x0 + 3.5)); log.append(f"3D Body: v11 {x0:.2f}-{x0 + 3.5:.2f} (alike {best[0] / 2:.2f})")
        continue
    s = FEAT_V11[g]
    if g == "cert":                                          # 3 s in both
        runs.append((s, s + 3.0)); continue
    r, b, q = drop_beat(s, s + 3.0, s + 0.3, s + 2.9)
    runs += r; log.append(f"{g}: drop beat {b:.3f} (alike {q:.2f})")
# end card: v11 37-45 into 4.5 s, one jump of 3.5 s, keeping the finale whole
cands = [b for b in beats(37.3, 38.6)]
b = max(cands, key=lambda b: sim(b, b + 3.5))
runs += [(37.0, b), (b + 3.5, min(45.0, DUR))]; log.append(f"end: jump {b:.3f} -> {b + 3.5:.3f} (alike {sim(b, b + 3.5):.2f})")

# merge runs that continue each other (a dropped-beat edit is two runs; a feature ends where the next begins)
merged = []
for a, b in runs:
    if merged and abs(merged[-1][1] - a) < 1e-6:
        merged[-1] = (merged[-1][0], b)
    else:
        merged.append((a, b))

# ---- render: each jump crossfaded (equal power) over XF, ending PRE before the beat ----
def seg(a, b):
    return src[int(round(a * SR)):int(round(b * SR))]

nx = int(XF * SR)
fade_out = np.cos(np.linspace(0, np.pi / 2, nx))[:, None]
fade_in = np.sin(np.linspace(0, np.pi / 2, nx))[:, None]
out = seg(*merged[0])
for a, b in merged[1:]:
    # the previous run ends at its own end; shift the crossfade so it finishes PRE before the attack
    shift = int(PRE * SR)
    head = out[:len(out) - shift - nx]
    tail_a = out[len(out) - shift - nx:len(out) - shift]
    nxt = src[int(round(a * SR)) - shift - nx:int(round(b * SR))]
    mid = tail_a * fade_out + nxt[:nx] * fade_in
    out = np.concatenate([head, mid, nxt[nx:]])

# ---- the idle sound under the walk-in ----
n = int(WALK * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(7)
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y
if IDLE == "pad":
    # a quiet open fifth on A (A2, E3, A3), slightly detuned voices, a slow swell
    voice = sum(np.sin(2 * np.pi * f * t + p) * g for f, g, p in
                [(110, 0.5, 0), (110.4, 0.35, 1), (164.81, 0.32, 2), (165.2, 0.22, 3), (220, 0.18, 4), (220.6, 0.12, 5)])
    air = lowpass(rng.standard_normal(n), 900) * 0.06
    idle = voice * 0.5 + air
else:
    # soft air: filtered noise that breathes, a low hum under it
    air = lowpass(rng.standard_normal(n), 1400) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.6 * t))
    hum = lowpass(lowpass(rng.standard_normal(n), 120), 120) * 2.0
    idle = air * 0.5 + hum
env = np.clip(t / 1.4, 0, 1) ** 1.5                  # swell in
env *= np.clip((WALK + 0.15 - t) / 0.35, 0, 1)        # give way to the words
idle = idle * env
idle = idle / (np.abs(idle).max() + 1e-9) * (0.06 if IDLE == "pad" else 0.12)  # well under the song (a pure tone reads louder than air)
idle = np.stack([idle, idle], 1).astype(np.float32)
song = out
total = np.concatenate([idle, song])
# a 30 ms fade at the very start of the song so its first attack lands clean on the words
total[n:n + int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))[:, None]

subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "aac", "-b:a", "192k", OUT], input=total.astype(np.float32).tobytes(), check=True)
print("\n".join(log))
print(f"{OUT}: {len(total) / SR:.3f} s")
