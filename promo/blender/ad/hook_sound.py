"""The hook's 5 seconds of sound, timed to hook.py's frames: build/hook.wav.
Reuses the first film's synthesizers (../sound.py). Then the same two
checks: loudness and the true peak (under -1 dB).
    python hook_sound.py
"""
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
import sound as S  # noqa: E402

FPS, SECONDS = 30, 5.0
N = int(S.SR * SECONDS)
rng = np.random.default_rng(3)


def at(frame):
    return (frame - 1) / FPS


def impact():
    """A slam: a deep kick, a noise burst, a short metallic ring."""
    k = S.kick() * 1.2
    n = int(0.25 * S.SR)
    burst = S.filt(rng.standard_normal(n), 'bandpass', [300, 6000]) * S.decay(n, 0.03) * 0.5
    ring = np.sin(2 * np.pi * 1320 * S.t_of(n)) * S.decay(n, 0.08) * 0.12
    out = np.zeros(max(len(k), n))
    out[:len(k)] += k
    out[:n] += burst + ring
    return out


def heartbeat():
    out = np.zeros(int(0.6 * S.SR))
    S.place(out, S.thump(), 0, 1.0)
    S.place(out, S.thump(), 0.18, 0.7)
    return out


def glitch(dur=0.22):
    n = int(dur * S.SR)
    gate = (rng.random(n // 400 + 1) > 0.4).repeat(400)[:n]
    buzz = np.sign(np.sin(2 * np.pi * 160 * S.t_of(n))) * 0.4 + S.filt(rng.standard_normal(n), 'highpass', 2000) * 0.5
    return buzz * gate * 0.5


def swish(dur=0.25, lo=800, hi=6000):
    n = int(dur * S.SR)
    x = S.filt(rng.standard_normal(n), 'bandpass', [lo, hi])
    return x * np.hanning(n) * 0.5


def tick():
    n = int(0.03 * S.SR)
    return S.filt(rng.standard_normal(n), 'highpass', 4000) * S.decay(n, 0.004) * 0.6


def main():
    L = np.zeros(N)
    S.place(L, heartbeat(), at(1), 1.0)
    S.place(L, swish(0.4, 300, 3000), at(1), 0.6)          # the whip in
    S.place(L, impact(), at(16), 1.0)                       # HEART
    S.place(L, impact(), at(31), 1.1)                       # FAILURE
    for f in range(37, 59, 7):
        S.place(L, tick(), at(f), 0.8)                      # the clock
    S.place(L, swish(0.3, 1500, 8000), at(52), 0.5)         # the words blow away
    S.place(L, glitch(), at(60), 1.0)                       # ¿FALLO CARDÍACO?
    S.place(L, swish(0.18, 2000, 9000), at(72), 0.8)        # the slash
    S.place(L, impact() * 0.6, at(78), 1.0)                 # NOT FOR PATIENTS
    S.place(L, S.glass(), at(84), 0.6)                      # cracking
    for k in range(6):
        S.place(L, S.keyclick() * 0.5, at(86 + k * 2), 0.7)  # the letters hitting the floor
    S.place(L, swish(0.35, 400, 4000), at(90), 0.7)         # the phone shoots up
    for k, nm in enumerate(['C6', 'E6', 'G6', 'C7', 'E7']):
        S.place(L, S.ding(S.note(nm)), at(104 + k * 3), 0.5)  # the right word, letter by letter
    S.place(L, S.sparkle(), at(122), 0.4)
    S.place(L, S.riser(0.5), at(135), 0.9)                  # into the flash
    # a low pad under it all, the room's hum
    pad = S.pad([S.note('F2'), S.note('C3')], SECONDS, 500) * 0.25
    L[:len(pad)] += pad[:N]
    st = S.stereo(L, width=0.25)
    from pedalboard import HighpassFilter, Limiter, LowpassFilter, Pedalboard, Reverb
    out = Pedalboard([HighpassFilter(28), LowpassFilter(16500), Reverb(room_size=0.3, wet_level=0.12, dry_level=0.9),
                      Limiter(threshold_db=-3.0)])(st.astype(np.float32), S.SR)
    import pyloudnorm
    loud = pyloudnorm.Meter(S.SR).integrated_loudness(out.T)
    out = out * 10 ** ((-14 - loud) / 20)
    from scipy.signal import resample_poly
    over = resample_poly(out, 4, 1, axis=1)                 # between-sample peaks
    tp = 20 * np.log10(np.abs(over).max() + 1e-12)
    if tp > -1.0:
        out = out * 10 ** ((-1.05 - tp) / 20)
        tp = -1.05
    import wave
    pcm = (np.clip(out.T, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(HERE, 'build', 'hook.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(S.SR)
        w.writeframes(pcm.tobytes())
    print('wrote build/hook.wav; true peak %.2f dBTP' % tp)


if __name__ == '__main__':
    main()
