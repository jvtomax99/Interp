"""The rough cut's soundtrack, 45 s: build/animatic.wav.
The hook's own sound (build/brainhook.wav) for 0-5 s, then a 120 BPM track
in F (F - C - Dm - Bb) with one sound per action, timed to animatic.py's
SHOTS: a click and chime per app screen, the drop at 13.5 s with a deep hit
per body system, a build-up per CoreCHI building, a rising swell over the
campus, the music falling away to birds as it melts into the real photo,
one hit on "Safer Care.", a last chord.
    python animatic_sound.py
    ffmpeg -framerate 30 -i renders/animatic/f_%04d.png -i build/animatic.wav \\
      -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart -shortest build/animatic.mp4
"""
import os
import sys
import wave

import numpy as np
import pyloudnorm
from pedalboard import Compressor, HighpassFilter, HighShelfFilter, Limiter, LowpassFilter, Pedalboard, Reverb
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
import sound as S  # noqa: E402
from hook_sound import impact, swish  # noqa: E402

SR = S.SR
SEC = 45.0
N = int(SR * SEC)
BEAT = 0.5
rng = np.random.default_rng(12)


def bird(f0):
    n = int(0.16 * SR)
    t = S.t_of(n)
    f = f0 * (1 + 0.35 * np.sin(2 * np.pi * 14 * t)) * (1 + 0.2 * t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(n) * 0.25


def music():
    L = np.zeros(N)
    chords = [('F3', 'A3', 'C4'), ('C3', 'E3', 'G3'), ('D3', 'F3', 'A3'), ('Bb2', 'D3', 'F3')]
    roots = ['F2', 'C2', 'D2', 'Bb1']
    arps = [['F4', 'A4', 'C5', 'A4'], ['E4', 'G4', 'C5', 'G4'], ['D4', 'F4', 'A4', 'F4'], ['D4', 'F4', 'Bb4', 'F4']]
    t0 = 5.0
    b = 0
    while t0 < 40.5:
        c = b % 4
        full = 13.5 <= t0 + 2 or t0 >= 13.5          # the full beat from the drop on
        light = t0 < 11.0
        build = 11.0 <= t0 < 13.5
        place_pad = S.pad([S.note(x) for x in chords[c]], 2.2, 2000 if full else 1100)
        S.place(L, place_pad, t0, 0.24 if full else 0.2)
        for s_ in range(16):
            at = t0 + s_ * BEAT / 4
            if at >= 40.5:
                break
            S.place(L, S.pluck(S.note(arps[c][s_ % 4]) * (2 if s_ >= 8 and full else 1)), at, 0.22 if light else 0.3)
        for q in range(4):
            at = t0 + q * BEAT
            if at >= 40.5:
                break
            if at >= 13.5:
                S.place(L, S.kick(), at, 0.95)
                if q % 2:
                    S.place(L, S.clap(), at, 0.75)
                S.place(L, S.hat(open_=(q == 3)), at + BEAT / 2, 0.75)
                for e in range(2):
                    S.place(L, S.bass(S.note(roots[c]), BEAT / 2 - 0.01), at + e * BEAT / 2)
            elif light:
                S.place(L, S.kick() * 0.6, at, 0.6 if q % 2 == 0 else 0.0)
                S.place(L, S.hat(), at + BEAT / 2, 0.55)
            elif build:
                S.place(L, S.hat(), at, 0.5)
                S.place(L, S.hat(), at + BEAT / 2, 0.6)
        t0 += 4 * BEAT
        b += 1
    S.place(L, S.riser(2.5), 11.0, 0.9)                      # into the drop
    # Sidechain from the drop to the end of the city.
    duck = np.ones(N)
    for k in range(int(13.5 / BEAT), int(40.5 / BEAT)):
        i, n = int(k * BEAT * SR), int(0.2 * SR)
        duck[i:i + n] = np.minimum(duck[i:i + n], 0.5 + 0.5 * (S.t_of(n) / 0.2) ** 0.6)
    L *= duck
    # The music falls away as the campus melts into the real photo (40.5 s).
    t = S.t_of(N)
    L *= np.clip((41.2 - t) / 0.7, 0, 1) ** 1.5
    return L


def effects():
    L = np.zeros(N)
    screens = [(5.0, 4, 6.0), (20.5, 4, 6.0), (26.5, 3, 4.5)]
    notes = ['C6', 'D6', 'F6', 'G6']
    for start, n, dur in screens:
        for k in range(n):
            at = start + k * dur / n
            S.place(L, S.keyclick(), at, 0.8)
            S.place(L, S.ding(S.note(notes[k])), at + 0.04, 0.55)
    S.place(L, swish(0.6, 300, 4000), 10.7, 0.7)         # into the body
    for k in range(5):                                      # a system lands per beat
        S.place(L, impact() * 0.8, 13.5 + k * BEAT, 0.8)
    for k in range(10):                                     # every piece apart: glassy clicks
        S.place(L, S.ding(S.note('C7')) * 0.3, 17.0 + k * 0.33, 0.4)
    S.place(L, swish(0.5, 400, 6000), 20.3, 0.6)
    S.place(L, swish(0.4, 400, 6000), 26.3, 0.6)
    S.place(L, S.riser(1.5), 31.0, 0.6)                     # the dive into the campus card
    for k in range(5):                                      # a building tops out per beat
        S.place(L, S.thump(), 32.5 + k * 1.0, 0.9)
        S.place(L, S.ding(S.note(['F5', 'A5', 'C6', 'F6', 'A6'][k])), 32.5 + k * 1.0, 0.45)
    S.place(L, S.riser(1.5), 39.0, 0.9)                     # the rise over the campus
    S.place(L, S.sparkle(), 40.6, 0.35)
    for k in range(9):                                      # birds over the real place
        S.place(L, bird(rng.uniform(3200, 4800)), 40.9 + k * 0.4 + rng.uniform(0, 0.15), 0.6)
    S.place(L, impact(), 42.5, 1.0)                         # on "Safer Care."
    end = S.pad([S.note('F3'), S.note('A3'), S.note('C4'), S.note('F4')], 2.5, 2500)
    S.place(L, end, 42.5, 0.55)                             # the last chord
    S.place(L, S.ding(S.note('F6')), 42.5, 0.5)
    return L


def main():
    mus, fx = music(), effects()
    st = S.stereo(mus, width=0.35) * 0.8 + S.stereo(fx, width=0.15, delay_ms=7) * 0.9
    out = Pedalboard([HighpassFilter(28), HighShelfFilter(cutoff_frequency_hz=9000, gain_db=-3.0), LowpassFilter(16500),
                      Compressor(threshold_db=-12, ratio=1.8, attack_ms=10, release_ms=120),
                      Reverb(room_size=0.35, wet_level=0.1, dry_level=0.92), Limiter(threshold_db=-3.0)])(st.astype(np.float32), SR)
    # Level: the drop section at -13 LUFS, like the first film.
    seg = out[:, int(13.5 * SR):int(31 * SR)]
    out = out * 10 ** ((-13 - pyloudnorm.Meter(SR).integrated_loudness(seg.T)) / 20)
    # The hook's own sound for its 5 seconds, matched to the same level.
    with wave.open(os.path.join(HERE, 'build', 'brainhook.wav')) as w:
        hook = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).T / 32768
    hook = hook * 10 ** ((-14 - pyloudnorm.Meter(SR).integrated_loudness(hook.T)) / 20)
    n = min(hook.shape[1], int(5.0 * SR))
    fade = np.clip((np.arange(n) - (n - 2400)) / 2400, 0, 1)
    out[:, :n] = hook[:, :n] * (1 - fade) + out[:, :n] * fade
    tp = 20 * np.log10(np.abs(resample_poly(out, 4, 1, axis=1)).max() + 1e-12)
    if tp > -1.0:
        out = out * 10 ** ((-1.05 - tp) / 20)
        tp = -1.05
    t = np.arange(out.shape[1]) / SR
    out *= np.clip((SEC - t) / 1.2, 0, 1)                   # fade the last 1.2 s
    with wave.open(os.path.join(HERE, 'build', 'animatic.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out.T, -1, 1) * 32767).astype('<i2').tobytes())
    m = pyloudnorm.Meter(SR, block_size=0.4)
    rows = []
    for k in range(0, int(SEC), 3):
        try:
            rows.append('%ds %.0f' % (k, m.integrated_loudness(out[:, k * SR:(k + 1) * SR].T)))
        except ValueError:
            rows.append('%ds -inf' % k)
    print('wrote build/animatic.wav; true peak %.2f dBTP' % tp)
    print('loudness (LUFS):', '  '.join(rows))


if __name__ == '__main__':
    main()
