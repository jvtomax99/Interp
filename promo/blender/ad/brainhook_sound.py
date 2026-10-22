"""Sound for the brain hook (brainhook.py), timed to its frames:
build/brainhook.wav. A low hum inside the brain, crackling signals, a pulse
on every beat, the rush out, two taps as the brain lands in Dr. Smiley's
head, the title's two hits, a rise into the flash.
    python brainhook_sound.py
"""
import os
import sys
import wave

import numpy as np
import pyloudnorm
from pedalboard import HighpassFilter, Limiter, LowpassFilter, Pedalboard, Reverb
from scipy.signal import resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
import sound as S  # noqa: E402
from hook_sound import at, impact, swish, tick  # noqa: E402

SECONDS = 5.0
N = int(S.SR * SECONDS)
rng = np.random.default_rng(9)


def hum(dur):
    n = int(dur * S.SR)
    t = S.t_of(n)
    x = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.5 * t) + 0.25 * np.sin(2 * np.pi * 110 * t * (1 + 0.002 * np.sin(t * 3))))
    return x * 0.18 * np.minimum(1, t / 0.4)


def crackle(dur, density=0.004):
    n = int(dur * S.SR)
    grains = (rng.random(n) < density).astype(float) * rng.uniform(0.3, 1, n)
    return S.filt(grains, 'bandpass', [2500, 11000]) * 1.6


def pulse(f0=220):
    n = int(0.35 * S.SR)
    t = S.t_of(n)
    return np.sin(2 * np.pi * f0 * t * (1 + 0.5 * np.exp(-t / 0.02))) * S.decay(n, 0.09) * 0.45


def main():
    L = np.zeros(N)
    # Timed to brainhook.py as revised after the review: no silent gaps
    # before the landing or the title, taps exactly on the rings.
    S.place(L, impact() * 0.7, at(1), 1.0)              # frame 1: a hit on the first frame
    S.place(L, swish(0.5, 400, 6000), at(1), 0.8)      # ripping back from his nucleus
    S.place(L, hum(2.8), 0, 1.0)
    S.place(L, crackle(2.8), 0, 0.35)
    for k, f in enumerate(range(16, 84, 15)):           # a pulse on every beat
        S.place(L, pulse(196 if k % 2 else 262), at(f), 0.9)
    for f in range(22, 36, 2):                           # the caption typing on
        S.place(L, tick(), at(f), 0.35)
    S.place(L, swish(1.1, 200, 5000), at(50), 0.9)     # the pull-back
    S.place(L, swish(0.8, 300, 4000), at(84), 0.8)     # the phone rises
    S.place(L, swish(0.7, 1500, 9000), at(88), 0.6)    # the brain shrinking into his head
    S.place(L, S.keyclick(), at(106), 0.9)             # tap
    S.place(L, S.ding(S.note('C7')), at(106), 0.4)
    S.place(L, S.keyclick(), at(110), 0.9)             # tap
    S.place(L, S.riser(1.0), at(114), 0.7)             # rising into the title and the flash
    S.place(L, impact(), at(121), 1.0)                 # INTERPRETER
    S.place(L, impact(), at(128), 1.1)                 # HUB
    S.place(L, S.sparkle(), at(140), 0.35)
    st = S.stereo(L, width=0.3)
    out = Pedalboard([HighpassFilter(28), LowpassFilter(16500), Reverb(room_size=0.5, wet_level=0.16, dry_level=0.88),
                      Limiter(threshold_db=-3.0)])(st.astype(np.float32), S.SR)
    out = out * 10 ** ((-14 - pyloudnorm.Meter(S.SR).integrated_loudness(out.T)) / 20)
    tp = 20 * np.log10(np.abs(resample_poly(out, 4, 1, axis=1)).max() + 1e-12)   # between-sample peaks
    if tp > -1.0:
        out = out * 10 ** ((-1.05 - tp) / 20)
        tp = -1.05
    with wave.open(os.path.join(HERE, 'build', 'brainhook.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(S.SR)
        w.writeframes((np.clip(out.T, -1, 1) * 32767).astype('<i2').tobytes())
    print('wrote build/brainhook.wav; true peak %.2f dBTP' % tp)


if __name__ == '__main__':
    main()
