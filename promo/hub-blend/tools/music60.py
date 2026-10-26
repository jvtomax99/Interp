"""The 1-minute promo's music (Jose, 2026-10-25): v11's track with its narrator taken out, made
60 s long without touching its tempo. The narrator is removed first, outside this script
(BRIEF-60s.md, "Removing v11's narrator"): audio-separator with UVR-MDX-NET-Inst_HQ_3.onnx gives
the instrumental WAV this reads.

The extra time is six bars (24 beats) of the music's own steady middle played twice: the beats
before the one nearest 24.5 s repeat once, joined on that beat with a 60 ms crossfade. Then the
music starts late enough that its last notes, under "Safer Care." at 43.9 s in v11, land on the
60 s cut's "Safer Care." at 57.08 s (sfx.cjs). Its level is set at mix time, 12 dB under the
voice as in v11.
  <venv>/bin/python promo/hub-blend/tools/music60.py <instrumental.wav> <out.wav> [at] [beats]
For another song, give the join (seconds, a beat in its steady part) and how many beats before it
repeat: Jose's own track (2026-10-26) uses 34.78 16, its chorus played twice.
(the venv needs librosa, numpy, soundfile; audio-separator brings them)"""
import sys
import librosa
import numpy as np
import soundfile as sf

IN, OUT = sys.argv[1], sys.argv[2]
OLD_END, NEW_END, LEN = 43.9, 57.08, 60
AT = float(sys.argv[3]) if len(sys.argv) > 3 else 24.5
BEATS = int(sys.argv[4]) if len(sys.argv) > 4 else 24

y, sr = librosa.load(IN, sr=44100, mono=False)
_, beats = librosa.beat.beat_track(y=librosa.to_mono(y), sr=sr, units='samples')
i = int(np.argmin(abs(beats / sr - AT)))
P, Q = beats[i], beats[i - BEATS]
X = int(0.06 * sr)
f = np.linspace(0, 1, X)
a, b = y[:, :P + X].copy(), y[:, Q:]
a[:, -X:] = a[:, -X:] * (1 - f) + b[:, :X] * f
out = np.concatenate([a, b[:, X:]], axis=1)
lead = int(round((NEW_END - OLD_END - (P - Q) / sr) * sr))
out = np.concatenate([np.zeros((2, lead)), out], axis=1)
n = LEN * sr
out = out[:, :n] if out.shape[1] >= n else np.concatenate([out, np.zeros((2, n - out.shape[1]))], axis=1)
sf.write(OUT, out.T, sr)
print(f'repeat {Q / sr:.3f}-{P / sr:.3f} s ({(P - Q) / sr:.3f} s), starts at {lead / sr:.3f} s, join at {(lead + P) / sr:.2f} s')
