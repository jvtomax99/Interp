"""The sounds the sound bank can't make, mixed under the rendered score.

Reads out/raw.wav (the score through the recorded instruments,
instruments.py) and out/fx.json (written by score.py and instruments.py),
and writes out/mix.wav:

  sub     an 808-style bass: a sine that drops from an octave up in its
          first moments, saturated so its overtones carry on a phone
          speaker, which can't play the fundamental (D2 is 73 Hz)
  riser   noise that opens up and swells into a hit, with a rising tone
  impact  the hit itself: a falling boom and a burst of noise
  kit     the electronic drums: an 808-style kick, a clap and a closed
          hi-hat, the sounds an orchestra library doesn't have
  cut     a stretch where everything goes silent (the drops), with short
          fades so it doesn't click; the impact after it lands on silence
"""
import json
import os
import subprocess

import numpy as np

SR = 48000
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out')
rng = np.random.default_rng(7)

SUB_GAIN, RISER_GAIN, IMPACT_GAIN = 0.19, 0.12, 0.30
KIT_GAIN = {'kick': 0.42, 'clap': 0.30, 'hat': 0.10}
KIT_PAN = {'kick': 0.0, 'clap': 0.0, 'hat': 0.25}


def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def write(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR),
                    '-i', '-', path], input=x.astype(np.float32).tobytes(), check=True)


def lowpass(x, cutoff):
    """One-pole lowpass whose cutoff (Hz, one per sample) can move."""
    a = np.exp(-2 * np.pi * np.asarray(cutoff) / SR) * np.ones(len(x))
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def sub(note, dur, vel):
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    f = 440 * 2 ** ((note - 69) / 12) * (1 + np.exp(-t / 0.018))  # the drop
    wave = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(1, t / 0.003) * (0.6 + 0.4 * np.exp(-t / 0.25))
    env *= np.clip((dur + 0.08 - t) / 0.08, 0, 1)                   # release
    return np.tanh(2.2 * wave) / np.tanh(2.2) * env * vel / 127


def riser(dur):
    n = int(dur * SR)
    p = np.linspace(0, 1, n)
    noise = lowpass(rng.standard_normal(n), 300 + 9000 * p ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * p)) / SR) * 0.25
    return (noise * 0.6 + tone) * p ** 2.2


def impact():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t / 0.06)) / SR) * np.exp(-t / 0.45)
    burst = lowpass(rng.standard_normal(n), 2500) * np.exp(-t / 0.12)
    return np.tanh(1.8 * (boom + 0.5 * burst))


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def kick(vel):
    t = np.arange(int(0.5 * SR)) / SR
    body = np.sin(2 * np.pi * np.cumsum(45 + 105 * np.exp(-t / 0.035)) / SR) * np.exp(-t / 0.28)
    click = lowpass(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.004) * 0.6
    return np.tanh(1.5 * (body + click)) * vel / 127


def hat(vel):
    t = np.arange(int(0.09 * SR)) / SR
    return highpass(highpass(rng.standard_normal(len(t)), 7000), 7000) * np.exp(-t / 0.022) * vel / 127


def clap(vel):
    t = np.arange(int(0.4 * SR)) / SR
    noise = lowpass(rng.standard_normal(len(t)), 2600) - lowpass(rng.standard_normal(len(t)), 600)
    env = sum(np.where(t >= d, np.exp(-(t - d) / 0.006), 0) for d in (0, 0.011, 0.022))
    env = env + np.where(t >= 0.022, 0.6 * np.exp(-(t - 0.022) / 0.12), 0)
    return noise * env * vel / 127


KIT = {'kick': kick, 'clap': clap, 'hat': hat}


def place(track, t, sound, gain, width=0.0):
    i = int(t * SR)
    j = min(len(track), i + len(sound))
    if j <= i:
        return
    s = sound[:j - i] * gain
    track[i:j, 0] += s * (1 - width)
    track[i:j, 1] += s * (1 + width)


score = read(os.path.join(out, 'raw.wav'))
fx = json.load(open(os.path.join(out, 'fx.json')))

# The cuts: the score goes silent (fades of 8 ms either side).
gate = np.ones(len(score))
ramp = int(0.008 * SR)
for a, b in fx['cut']:
    i, j = int(a * SR), int(b * SR)
    gate[i:j] = 0
    gate[max(0, i - ramp):i] = np.minimum(gate[max(0, i - ramp):i], np.linspace(1, 0, i - max(0, i - ramp)))
    gate[j:j + ramp] = np.minimum(gate[j:j + ramp], np.linspace(0, 1, len(gate[j:j + ramp])))

extra = np.zeros_like(score)
for t, note, dur, vel in fx['sub']:
    place(extra, t, sub(note, dur, vel), SUB_GAIN)
for a, b, gain in fx['riser']:
    r = riser(b - a)
    place(extra, a, r, RISER_GAIN * gain, width=0.3)
    place(extra, a + 0.011, r, RISER_GAIN * gain * 0.5, width=-0.6)  # spread it
for t, sound, vel in fx.get('kit', []):
    place(extra, t, KIT[sound](vel), KIT_GAIN[sound], width=KIT_PAN[sound])
mix = (score + extra) * gate[:, None]  # the impacts land after the cuts
for t, gain in fx['impact']:
    place(mix, t, impact(), IMPACT_GAIN * gain)

write(os.path.join(out, 'mix.wav'), mix)
print('out/mix.wav')
