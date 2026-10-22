"""The soundtrack, made entirely in code: build/sound.wav (48 kHz, stereo).
    python sound.py
A 120 BPM track that drops at 4.0 s, and one sound per action, each placed
on its frame from timeline.SOUNDS. Then the guide's two checks: loudness
every half second, and the true peak (kept under -1 dB so phones don't clip).
"""
import os

import numpy as np
import pyloudnorm
from pedalboard import (Compressor, HighpassFilter, HighShelfFilter, Limiter,
                        LowpassFilter, Pedalboard, Reverb)
from scipy.signal import butter, resample_poly, sosfilt

import timeline as T

SR = 48000
N = int(SR * T.SECONDS)
BEAT_S = 60 / T.BPM                       # 0.5 s
DROP_S = (T.DROP - 1) / T.FPS             # 4.0 s
rng = np.random.default_rng(7)


def sec(frame):
    return (frame - 1) / T.FPS


def t_of(n):
    return np.arange(n) / SR


def note(name):
    """'F3' -> Hz."""
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    semis = names[name[0]] + (1 if '#' in name else -1 if 'b' in name[1:] else 0)
    octave = int(name[-1])
    return 440 * 2 ** ((semis + (octave - 4) * 12) / 12)


def place(buf, sound, at_s, gain=1.0):
    i = int(at_s * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sound))
    buf[i:j] += sound[:j - i] * gain


def filt(x, kind, hz, order=2):
    sos = butter(order, hz, kind, fs=SR, output='sos')
    return sosfilt(sos, x)


def decay(n, tau):
    return np.exp(-t_of(n) / tau)


def saw(f, n, detune=0.0):
    ph = np.cumsum(np.full(n, f * (1 + detune)) / SR)
    return 2 * (ph % 1) - 1


# ---------- instruments ----------

def kick():
    n = int(0.42 * SR)
    t = t_of(n)
    f = 45 + 110 * np.exp(-t / 0.045)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(n, 0.16)
    click = filt(rng.standard_normal(n), 'highpass', 2500) * decay(n, 0.004) * 0.25
    return body + click


def clap():
    n = int(0.25 * SR)
    noise = filt(rng.standard_normal(n), 'bandpass', [900, 4000])
    env = np.zeros(n)
    for k, d in enumerate((0, 0.011, 0.022)):
        i = int(d * SR)
        env[i:] += decay(n - i, 0.012 if k < 2 else 0.07)
    return noise * env * 0.5


def hat(open_=False):
    n = int((0.18 if open_ else 0.06) * SR)
    return filt(rng.standard_normal(n), 'highpass', 7000) * decay(n, 0.05 if open_ else 0.012) * 0.35


def bass(f, dur):
    n = int(dur * SR)
    x = saw(f, n) + 0.5 * saw(f, n, 0.006)
    x = filt(x, 'lowpass', 420, 4)
    env = np.minimum(1, t_of(n) / 0.005) * decay(n, dur * 0.9)
    return x * env * 0.55


def pad(freqs, dur, cutoff=1800):
    n = int(dur * SR)
    x = sum(saw(f, n, d) for f in freqs for d in (-0.004, 0.0, 0.005)) / (3 * len(freqs))
    x = filt(x, 'lowpass', cutoff, 2)
    t = t_of(n)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.3).clip(0)
    return x * env


def pluck(f, dur=0.32):
    n = int(dur * SR)
    x = saw(f, n) * decay(n, 0.07) + np.sin(2 * np.pi * f * t_of(n)) * decay(n, 0.15) * 0.6
    return filt(x, 'lowpass', 3200) * 0.35


# ---------- one sound per action ----------

def glass():
    n = int(0.9 * SR)
    t = t_of(n)
    parts = [(1760, 1.0, 0.28), (2950, 0.55, 0.18), (4870, 0.3, 0.1), (6210, 0.18, 0.07)]
    x = sum(a * np.sin(2 * np.pi * f * t) * decay(n, d) for f, a, d in parts)
    knock = filt(rng.standard_normal(n), 'bandpass', [1200, 5000]) * decay(n, 0.003) * 0.5
    return (x + knock) * 0.45


def peel():
    n = int(0.62 * SR)
    t = t_of(n)
    grains = (rng.random(n) < 0.012 + 0.05 * t / t[-1]).astype(float)
    crackle = filt(grains * rng.standard_normal(n), 'bandpass', [1500, 7000])
    hiss = filt(rng.standard_normal(n), 'bandpass', [2500, 9000]) * 0.15
    env = np.sin(np.pi * t / t[-1]) ** 0.7
    return (crackle * 1.4 + hiss) * env * 0.5


def keyclick():
    n = int(0.12 * SR)
    t = t_of(n)
    tick = filt(rng.standard_normal(n), 'highpass', 3500) * decay(n, 0.003)
    thock = np.sin(2 * np.pi * 190 * t) * decay(n, 0.025)
    return (tick * 0.7 + thock) * 0.6


def ding(f):
    n = int(1.1 * SR)
    t = t_of(n)
    x = sum(a * np.sin(2 * np.pi * f * m * t) * decay(n, d)
            for m, a, d in ((1, 1.0, 0.45), (2.76, 0.35, 0.18), (5.4, 0.15, 0.08)))
    return x * np.minimum(1, t / 0.002) * 0.32


def save_chime():
    x = np.zeros(int(1.6 * SR))
    place(x, ding(note('F6')), 0)
    place(x, ding(note('C7')), 0.09)
    whoosh = filt(rng.standard_normal(int(0.5 * SR)), 'bandpass', [600, 3000])
    place(x, whoosh * np.hanning(len(whoosh)) * 0.12, 0)
    return x


def thump():
    n = int(0.3 * SR)
    t = t_of(n)
    return np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.03)) * t) * decay(n, 0.09) * 0.7


def powerdown():
    n = int(0.55 * SR)
    t = t_of(n)
    f = 420 * np.exp(-t / 0.16) + 35
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + saw(1, n) * 0
    x = filt(x, 'lowpass', 1200, 2)
    buzz = filt(rng.standard_normal(n), 'bandpass', [80, 600]) * 0.2
    return (x + buzz) * decay(n, 0.2) * 0.32


def sparkle():
    x = np.zeros(int(1.2 * SR))
    for k in range(14):
        f = note(rng.choice(['C7', 'D7', 'F7', 'G7', 'A7', 'C8']))
        place(x, ding(f) * 0.35, 0.04 * k + rng.random() * 0.03)
    return x


def riser(dur):
    n = int(dur * SR)
    t = t_of(n)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    step = n // 16
    for k in range(16):
        lo = 400 + 5000 * (k / 16) ** 2
        seg = filt(noise[k * step:(k + 1) * step], 'bandpass', [lo, lo * 2.2])
        out[k * step:k * step + len(seg)] = seg
    return out * (t / t[-1]) ** 2 * 0.35


# ---------- the track ----------

def music():
    L = np.zeros(N)
    # F - C - Dm - Bb, one chord per bar (4 beats = 2 s).
    chords = [('F3', 'A3', 'C4'), ('C3', 'E3', 'G3'), ('D3', 'F3', 'A3'), ('Bb2', 'D3', 'F3')]
    roots = ['F2', 'C2', 'D2', 'Bb1']
    arps = [['F4', 'A4', 'C5', 'A4'], ['E4', 'G4', 'C5', 'G4'], ['D4', 'F4', 'A4', 'F4'], ['D4', 'F4', 'Bb4', 'F4']]
    bars = int(T.SECONDS / (4 * BEAT_S))
    for b in range(bars):
        t0 = b * 4 * BEAT_S
        c = b % 4
        intro, outro = t0 < DROP_S, t0 >= 10.0
        place(L, pad([note(x) for x in chords[c]], 4 * BEAT_S + 0.2, 900 if intro else 2200), t0,
              0.16 if intro else 0.2 if outro else 0.32)
        for s in range(16):                               # sixteenths
            at = t0 + s * BEAT_S / 4
            if intro and at < 1.0:
                continue
            place(L, pluck(note(arps[c][s % 4]) * (2 if s >= 8 and not intro else 1)), at,
                  0.09 if intro else 0.14 if outro else 0.35)
        if intro or outro:
            continue
        for q in range(4):                                # quarters
            at = t0 + q * BEAT_S
            place(L, kick(), at, 0.95)
            if q % 2:
                place(L, clap(), at, 0.8)
            place(L, hat(open_=(q == 3)), at + BEAT_S / 2, 0.8)
        for e in range(8):                                # eighths
            place(L, bass(note(roots[c]), BEAT_S / 2 - 0.01), t0 + e * BEAT_S / 2)
    place(L, riser(2.2), DROP_S - 2.2, 0.45)
    # Sidechain: everything ducks under each kick after the drop.
    duck = np.ones(N)
    for b in range(int(DROP_S / BEAT_S), int(10.0 / BEAT_S)):
        i = int(b * BEAT_S * SR)
        n = int(0.22 * SR)
        duck[i:i + n] = np.minimum(duck[i:i + n], 0.45 + 0.55 * (t_of(n) / 0.22) ** 0.6)
    L *= duck
    # The end: fade the last two seconds.
    t = t_of(N)
    L *= np.clip((T.SECONDS - t) / 2.0, 0, 1) ** 0.8 * np.where(t > 10, 1, 1)
    return L


def effects():
    L = np.zeros(N)
    dings = iter(['C6', 'D6', 'F6', 'G6', 'A6'])
    for frame, kind in T.SOUNDS:
        at = sec(frame)
        if kind == 'glass':
            place(L, glass(), at, 0.3)
        elif kind == 'peel':
            place(L, peel(), at, 0.6)
        elif kind == 'key':
            place(L, keyclick(), at, 0.55 if at < DROP_S else 1.0)
        elif kind == 'ding':
            place(L, ding(note(next(dings))), at + 0.04, 0.55 if at < DROP_S else 1.0)
        elif kind == 'save':
            place(L, save_chime(), at)
        elif kind == 'land':
            place(L, thump(), at)
        elif kind == 'powerdown':
            place(L, powerdown(), at)
        elif kind == 'sparkle':
            place(L, sparkle(), at, 0.35)
    return L


def stereo(mono, width=0.0, delay_ms=11):
    d = int(delay_ms * SR / 1000)
    right = np.concatenate([np.zeros(d), mono[:-d]]) if width else mono
    return np.stack([mono, mono * (1 - width) + right * width])


def report(x):
    """Loudness every half second (momentary, LUFS) and the true peak."""
    meter = pyloudnorm.Meter(SR, block_size=0.4)
    rows = []
    for k in range(int(T.SECONDS / 0.5)):
        a = int(k * 0.5 * SR)
        seg = x[:, max(0, a - int(0.2 * SR)):a + int(0.3 * SR)].T
        try:
            rows.append(meter.integrated_loudness(seg))
        except ValueError:
            rows.append(float('-inf'))
    over = resample_poly(x, 4, 1, axis=1)                 # between-sample peaks
    tp = 20 * np.log10(np.abs(over).max() + 1e-12)
    return rows, tp


def main():
    mus = music()
    fx = effects()
    mus_st = stereo(mus, width=0.35)
    fx_st = stereo(fx, width=0.15, delay_ms=7)
    mix = mus_st * 0.8 + fx_st * 0.9
    # Finish: tidy lows, roll off the sharp highs, glue, reverb, limit.
    board = Pedalboard([
        HighpassFilter(28),
        HighShelfFilter(cutoff_frequency_hz=9000, gain_db=-3.0),
        LowpassFilter(16500),
        Compressor(threshold_db=-12, ratio=1.8, attack_ms=10, release_ms=120),
        Reverb(room_size=0.35, wet_level=0.10, dry_level=0.92, width=0.9),
        Limiter(threshold_db=-3.0, release_ms=80),
    ])
    out = board(mix.astype(np.float32), SR)
    # Level set by the drop (4.0-9.5 s) at -13 LUFS, so the intro stays
    # quiet next to it; then the true-peak ceiling at -1 dB.
    drop = out[:, int(DROP_S * SR):int(9.5 * SR)]
    loud = pyloudnorm.Meter(SR).integrated_loudness(drop.T)
    out = out * 10 ** ((-13 - loud) / 20)
    rows, tp = report(out)
    if tp > -1.0:
        out = out * 10 ** ((-1.0 - tp - 0.05) / 20)
        rows, tp = report(out)
    import wave
    os.makedirs(T.BUILD, exist_ok=True)
    pcm = (np.clip(out.T, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(T.BUILD, 'sound.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote build/sound.wav')
    print('loudness every half second (LUFS):')
    print('  ' + '  '.join('%.1fs %5.1f' % (k * 0.5, v) for k, v in enumerate(rows)))
    print('true peak: %.2f dBTP (ceiling -1.0)' % tp)


if __name__ == '__main__':
    main()
