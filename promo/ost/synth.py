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
  sweep   a filter over everything that opens up as the intro builds (the
          cutoff moves through the points given, in Hz), so the groove is
          heard first as a muffled thump and then comes into the light
  ping    a soft monitor ping on each beat of the intro, outside the filter
  fade    the level easing down evenly, in dB, to silence: the end
  duck    the bass (out/bass.wav, kept apart by instruments.py) and the sub
          dip about 3 dB under each kick and come back in 140 ms, the way a
          studio "sidechains" them, so the kick punches through
  tape    a little tape warmth on the whole track: gentle saturation, the
          low "head bump", the softened top, and a trace of wow and flutter
"""
import json
import os
import subprocess

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out')
rng = np.random.default_rng(7)

SUB_GAIN, RISER_GAIN, IMPACT_GAIN = 0.17, 0.11, 0.22   # eased back for a softer mood
GRIT, GRIT_BAND = 1.1, butter(2, [150, 1200], 'bandpass', fs=SR, output='sos')
PING_GAIN = 0.15
DUCK, DUCK_RELEASE = 0.3, 0.14   # depth (0.3 is about -3 dB) and recovery (s)
KIT_GAIN = {'kick': 0.36, 'clap': 0.18, 'hat': 0.07}
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
    body = np.tanh(2.2 * wave) / np.tanh(2.2)
    # its grit: the same note driven hard, kept only where a phone speaker
    # plays (150 Hz - 1.2 kHz), so the bass is still felt on a phone
    grit = sosfilt(GRIT_BAND, np.tanh(7 * wave))
    return (body + GRIT * grit) * env * vel / 127


def ping(vel):
    """A soft monitor ping: A5 with a little of its octave, gone in a quarter second."""
    t = np.arange(int(0.25 * SR)) / SR
    tone = np.sin(2 * np.pi * 880 * t) + 0.3 * np.sin(2 * np.pi * 1760 * t)
    return tone * np.minimum(1, t / 0.003) * np.exp(-t / 0.07) * vel / 127


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
low = np.zeros_like(score)
bass = read(os.path.join(out, 'bass.wav'))[:len(score)]
low[:len(bass)] += bass
for t, note, dur, vel in fx['sub']:
    place(low, t, sub(note, dur, vel), SUB_GAIN)
# the duck: a dip under each kick, in 5 ms, back out over DUCK_RELEASE
env = np.zeros(len(score))
shape_t = np.arange(int(0.6 * SR)) / SR
shape = np.minimum(1, shape_t / 0.005) * np.exp(-np.maximum(0, shape_t - 0.005) / DUCK_RELEASE * 2.3)
for t, sound, vel in fx.get('kit', []):
    if sound == 'kick':
        i = int(t * SR)
        j = min(len(env), i + len(shape))
        env[i:j] = np.maximum(env[i:j], shape[:j - i] * min(1, vel / 100))
extra += low * (1 - DUCK * env)[:, None]
for a, b, gain in fx['riser']:
    r = riser(b - a)
    place(extra, a, r, RISER_GAIN * gain, width=0.3)
    place(extra, a + 0.011, r, RISER_GAIN * gain * 0.5, width=-0.6)  # spread it
for t, sound, vel in fx.get('kit', []):
    place(extra, t, KIT[sound](vel), KIT_GAIN[sound], width=KIT_PAN[sound])
mix = score + extra
for t0, t1, points in fx.get('sweep', []):
    i, j = int(t0 * SR), int(t1 * SR)
    times, hz = zip(*points)
    cutoff = np.exp(np.interp(np.arange(i, j) / SR, times, np.log(hz)))
    seg = mix[i:j]
    for _ in range(4):  # four poles: a steep, smooth slope
        seg = np.stack([lowpass(seg[:, c], cutoff) for c in (0, 1)], 1)
    mix[i:j] = seg
for t, vel in fx.get('ping', []):  # after the sweep: the ping is never muffled
    place(mix, t, ping(vel), PING_GAIN, width=0.15)
mix *= gate[:, None]  # the impacts land after the cuts
for t, gain in fx['impact']:
    place(mix, t, impact(), IMPACT_GAIN * gain)

def tape(x):
    """A little tape warmth (Jose, 2026-10-22, prompt 4)."""
    level = np.sqrt((x ** 2).mean()) / 0.12          # drive it at a fixed level
    y = x / level
    # wow (0.6 Hz) and flutter (7 Hz): the speed wavers by under 0.1 %
    t = np.arange(len(y)) / SR
    warp = t - (0.00025 * np.sin(2 * np.pi * 0.6 * t) + 0.00004 * np.sin(2 * np.pi * 7.0 * t))
    y = np.stack([np.interp(warp, t, y[:, c]) for c in (0, 1)], 1)
    # saturation, slightly uneven (that is what gives tape its warm overtones)
    y = np.tanh(1.5 * (y + 0.04 * y ** 2)) / 1.5
    y -= y.mean(0)
    # the head bump (+1.2 dB around 90 Hz) and a softened top (-2 dB by 16 kHz)
    spec = np.fft.rfft(y, axis=0)
    f = np.fft.rfftfreq(len(y), 1 / SR)
    db = 1.2 * np.exp(-np.log(f / 90 + 1e-9) ** 2 / 0.5) - 2.0 / (1 + (12000 / (f + 1e-9)) ** 4)
    y = np.fft.irfft(spec * (10 ** (db / 20))[:, None], len(y), axis=0)
    return y * level


mix = tape(mix)
for t0, t1, db in fx.get('fade', []):  # even in dB, so it sounds like a steady letting go
    i, j = int(t0 * SR), min(len(mix), int(t1 * SR))
    mix[i:j] *= (10 ** (np.linspace(0, db, j - i) / 20))[:, None]
    mix[j:] *= 10 ** (db / 20)
write(os.path.join(out, 'mix.wav'), mix)
print('out/mix.wav')
