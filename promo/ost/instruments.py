"""Play the score through real recorded instruments and mix them: out/raw.wav.

Jose, 2026-10-22: "Swap the sound bank for real recorded instruments:
Salamander Grand Piano for the piano and VSCO 2 Community Edition for
strings, brass and percussion. Keep every note the same."

Reads out/built-here.mid (score.py; one track per part, named by PARTS in
score.py's order) and renders each part with sfizz_render through the
library that ROUTES gives it, then places each piece on a stage left to right,
balances them and puts them in two real recorded rooms (convolution). The three drum sounds an orchestra library
doesn't have (kick, clap, closed hi-hat: the electronic side of the track)
go to out/fx.json for synth.py to make.

Libraries (downloaded by render.sh, never in git):
  Salamander Grand Piano V3, Alexander Holm, CC BY 3.0: credit required
  VSCO 2 Community Edition, Versilian Studios, CC0: no conditions
  Two recorded rooms (a warehouse, a kitchen) from Google's Web Audio
    samples (GoogleChromeLabs/web-audio-samples), Apache 2.0
"""
import json
import os
import subprocess
import sys

import mido
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out')
LIBS = os.environ.get('OST_LIBS', os.path.join(here, 'libs'))
SFIZZ = os.environ.get('SFIZZ_RENDER', 'sfizz_render')
PIANO = os.path.join(LIBS, 'salamander', 'Salamander Grand Piano V3.sfz')
VSCO = os.path.join(LIBS, 'vsco')
IRS = os.path.join(LIBS, 'ir')  # recorded rooms: Google Web Audio samples, Apache 2.0

# Track order in the MIDI file: the order of PARTS in score.py.
TRACKS = ['piano', 'keys', 'strings', 'cello', 'guitar', 'bells', 'trem', 'pad',
          'bass', 'drums', 'stabs', 'brass', 'lead']


def v(name):
    return os.path.join(VSCO, name)


# part: [(library, lowest note, highest note, shortest, longest, place)]. A
# part can split by range (strings by section, the percussion by drum) or by
# length (trumpet: short notes from its staccato samples), and each piece
# sits in its own place left to right (-1 to 1), as on a stage (Jose,
# 2026-10-22, prompt 4): violins left, violas and cellos to the right, the
# trumpet in the middle with the horns and trombones right of it, congas
# left and bongos right, the small percussion spread out to the edges.
LOW, HIGH = 0, 127
SECTIONS = lambda kind: [(v(f'CelloEns{kind}.sfz'), LOW, 54, 0, 99, 0.40),
                         (v(f'ViolaEns{kind}.sfz'), 55, 66, 0, 99, 0.15),
                         (v(f'ViolinEns{kind}.sfz'), 67, HIGH, 0, 99, -0.45)]
KIT_ROUTES = [  # (first drum note, last, place)
    (38, 38, 0.0), (49, 49, -0.1), (56, 56, 0.30), (60, 61, 0.45), (62, 64, -0.35),
    (65, 66, 0.20), (70, 70, -0.60), (73, 74, 0.60), (75, 75, -0.20),
]
ROUTES = {
    'piano':   [(PIANO, LOW, HIGH, 0, 99, 0.0)],
    'keys':    [(PIANO, LOW, HIGH, 0, 99, 0.2)],
    'strings': SECTIONS('SusVib'),
    'pad':     SECTIONS('SusVib-Quiet'),
    'trem':    SECTIONS('Trem'),
    'stabs':   SECTIONS('Spic'),
    'cello':   [(v('CelloEnsSusVib.sfz'), LOW, HIGH, 0, 99, 0.40)],
    'bass':    [(v('ContrabassPizz.sfz'), LOW, HIGH, 0, 99, 0.0)],
    'brass':   [(v('TromboneSus.sfz'), LOW, 56, 0, 99, 0.25), (v('FHornSus.sfz'), 57, HIGH, 0, 99, 0.45)],
    'lead':    [(v('TrumpetStac.sfz'), LOW, HIGH, 0, 0.25, 0.0), (v('TrumpetSus.sfz'), LOW, HIGH, 0.25, 99, 0.0)],
    'guitar':  [(v('Harp.sfz'), LOW, HIGH, 0, 99, -0.5)],
    'bells':   [(v('Glockenspiel.sfz'), LOW, HIGH, 0, 99, 0.5)],
    'drums':   [(v('hub-perc.sfz'), lo, hi, 0, 99, pan) for lo, hi, pan in KIT_ROUTES],
}
# Per part: balance (dB, set from each part rendered alone, the trumpet hook
# on top), how much goes to the hall and to the small room, and stereo width
# (1 keeps a part's own stereo, 0 makes it a point at its place).
MIX = {
    'piano':   (6, 0.22, 0.0, 1.0), 'keys': (-2, 0.15, 0.10, 0.4),
    'strings': (1, 0.40, 0.0, 0.5), 'pad': (-5, 0.50, 0.0, 0.8), 'trem': (0, 0.40, 0.0, 0.5),
    'stabs':   (3, 0.25, 0.10, 0.4), 'cello': (-2, 0.35, 0.0, 0.5),
    'bass':    (4, 0.0, 0.12, 0.2), 'brass': (-3, 0.30, 0.0, 0.5), 'lead': (1, 0.24, 0.05, 0.3),
    'guitar':  (-4, 0.35, 0.0, 0.6), 'bells': (-8, 0.40, 0.0, 0.6), 'drums': (10, 0.06, 0.22, 0.4),
}
# GM drum note -> VSCO samples: (sample, lowest velocity, highest velocity)
# with round robins picked at random. Kick, clap and hat are synthesized.
PERC = {
    38: ('snare', [('Percussion/Snare2-HitSN_v{}_rr{}_Sum.wav', [1, 3, 5, 7, 9], 2)]),
    49: ('crash', [('Percussion/cymbal-crash1_{}_rr{}.wav', ['pp', 'mp', 'mf', 'ff'], 2)]),
    60: ('hi bongo', [('VSCO 1 Percussion/drums/other/Bongos/HighBongo{}.wav', None, [1, 2])]),
    61: ('lo bongo', [('VSCO 1 Percussion/drums/other/Bongos/LowBongo{}.wav', None, [1, 2])]),
    62: ('muted conga', [('Percussion/Quinto-Tap1_v1_rr{}_Sum.wav', None, [1, 2])]),
    63: ('open conga', [('Percussion/Conga-HitN_v{}_rr{}_Sum.wav', [1, 2, 3], 2)]),
    64: ('low conga', [('Percussion/Tumba-HitN_v{}_rr{}_Sum.wav', [1, 2, 3], 2)]),
    65: ('hi timbale', [('VSCO 1 Percussion/drums/snare/drum1/snare1_nosnare_{}.wav',
                        ['ppp_1', 'pp_1', 'mp_1', 'mf_1', 'f_2', 'ff_1', 'fff_1'], None)]),
    66: ('lo timbale', [('Percussion/Snare2-HitNS_v{}_rr{}_Sum.wav', [1, 3, 5, 6], 2)]),
    56: ('cowbell', [('VSCO 1 Percussion/varMetal/various/cowbell_{}_{}.wav', ['mf', 'ff', 'fff'], 2)]),
    75: ('claves', [('Percussion/Claves1_Hit_v{}_rr{}_Sum.wav', [1, 2, 3], 2)]),
    70: ('shaker', [('VSCO 1 Percussion/varMetal/various/cabasa_{}.wav', None, [1, 2, 3, 4, 5, 6])]),
    73: ('guiro short', [('Percussion/Guiro-Hit_v1_rr{}_Sum.wav', None, [1, 2])]),
    74: ('guiro long', [('Percussion/Guiro-M_v1_Sum.wav', None, None)]),
}
SYNTH_KIT = {36: 'kick', 39: 'clap', 42: 'hat'}


def perc_sfz():
    """Write VSCO's percussion as one kit on the GM drum notes."""
    lines = ['<control> default_path=./', '<global> pitch_keytrack=0 loop_mode=one_shot ampeg_release=0.3']
    for key, (_, [(pattern, layers, rrs)]) in PERC.items():
        layers = layers or [None]
        rrs = rrs if isinstance(rrs, list) else list(range(1, (rrs or 1) + 1))
        for li, layer in enumerate(layers):
            lo = li * 128 // len(layers)
            hi = (li + 1) * 128 // len(layers) - 1
            for ri, rr in enumerate(rrs):
                args = [a for a in (layer, rr) if a is not None]
                name = pattern.format(*args) if '{}' in pattern else pattern
                lines.append(f'<region> key={key} lovel={lo} hivel={hi} '
                             f'lorand={ri / len(rrs):.3f} hirand={(ri + 1) / len(rrs):.3f} '
                             f'sample={name}')
    with open(v('hub-perc.sfz'), 'w') as f:
        f.write('\n'.join(lines) + '\n')


def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def notes_of(track):
    """(start tick, end tick, note, velocity) for every note in a track, and
    its phrasing: expression (CC11) and pitch bend, as (tick, message)."""
    t, on, found, shaping = 0, {}, [], []
    for msg in track:
        t += msg.time
        if msg.type == 'pitchwheel' or (msg.type == 'control_change' and msg.control == 11):
            shaping.append((t, msg.copy(channel=0, time=0)))
        elif msg.type == 'note_on' and msg.velocity > 0:
            on.setdefault(msg.note, []).append((t, msg.velocity))
        elif msg.type in ('note_off', 'note_on') and on.get(msg.note):
            start, vel = on[msg.note].pop(0)
            found.append((start, t, msg.note, vel))
    return found, shaping


def midi_with(meta, notes, shaping=()):
    m = mido.MidiFile(ticks_per_beat=src.ticks_per_beat)
    m.tracks.append(meta)
    tr = mido.MidiTrack()
    m.tracks.append(tr)
    msgs = []
    for a, b, x, vel in notes:
        msgs.append((a, 1, mido.Message('note_on', note=x, velocity=vel)))
        msgs.append((b, 0, mido.Message('note_off', note=x, velocity=0)))
    msgs += [(at, 0.5, msg) for at, msg in shaping]
    msgs.sort(key=lambda m: (m[0], m[1]))  # offs, then the phrasing, then ons
    now = 0
    for at, _, msg in msgs:
        tr.append(msg.copy(time=at - now))
        now = at
    return m


def impulse(name):
    """A recorded room, resampled to 48 kHz, as (L->L, L->R, R->L, R->R). A
    true-stereo file has those four channels; a stereo one, L->L and R->R."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(IRS, name), '-f', 'f32le',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    chans = int(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=channels',
                                '-of', 'csv=p=0', os.path.join(IRS, name)],
                               capture_output=True, text=True, check=True).stdout)
    ir = np.frombuffer(raw, np.float32).reshape(-1, chans).astype(float)
    if chans == 2:
        z = np.zeros(len(ir))
        ir = np.stack([ir[:, 0], z, z, ir[:, 1]], 1)
    return ir / np.abs(ir).sum(0).max() * 4


def reverb(x, ir, predelay):
    """x through the room: each output side hears both input sides."""
    p = int(predelay * SR)
    out_ = np.zeros_like(x)
    for (src_, dst), k in zip([(0, 0), (0, 1), (1, 0), (1, 1)], range(4)):
        if np.any(ir[:, k]):
            out_[p:, dst] += fftconvolve(x[:, src_], ir[:, k])[:len(x) - p]
    return out_


def place_at(audio, pan, width):
    """Pan an instrument to its place (constant power), narrowed to width."""
    mono = audio.mean(1, keepdims=True)
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return (audio * width + mono * (1 - width)) * np.sqrt(2) * np.array([left, right])


def seconds(tick):
    return mido.tick2second(tick, src.ticks_per_beat, mido.bpm2tempo(80))


src = mido.MidiFile(os.path.join(out, 'built-here.mid'))
meta = src.tracks[0]
perc_sfz()
stems = os.path.join(out, 'stems')
os.makedirs(stems, exist_ok=True)
length = int(46 * SR)
dry, hall_send, room_send = (np.zeros((length, 2)) for _ in range(3))
bass_dry, bass_room = np.zeros((length, 2)), np.zeros((length, 2))
kit = []
for name, track in zip(TRACKS, src.tracks[1:]):
    notes, shaping = notes_of(track)
    if name == 'drums':
        kit = [[round(seconds(a), 4), SYNTH_KIT[x], vel] for a, b, x, vel in notes if x in SYNTH_KIT]
        notes = [nt for nt in notes if nt[2] in PERC]
    part = np.zeros((length, 2))
    gain_db, hall, small, width = MIX[name]
    for i, (sfz, lo, hi, short, long_, pan) in enumerate(ROUTES[name]):
        chosen = [nt for nt in notes
                  if lo <= nt[2] <= hi and short <= seconds(nt[1] - nt[0]) < long_]
        if not chosen:
            continue
        mid_path, wav_path = os.path.join(stems, f'{name}{i}.mid'), os.path.join(stems, f'{name}{i}.wav')
        midi_with(meta, chosen, shaping).save(mid_path)
        subprocess.run([SFIZZ, '--sfz', sfz, '--midi', mid_path, '--wav', wav_path,
                        '-s', str(SR), '-q', '3'], check=True, capture_output=True)
        audio = read(wav_path)[:length]
        part[:len(audio)] += place_at(audio, pan, width)
    placed = part * 10 ** (gain_db / 20)
    if name == 'bass':  # kept apart so synth.py can duck it under the kick
        bass_dry, bass_room = placed, placed * small
    else:
        dry += placed
        hall_send += placed * hall
        room_send += placed * small
    if '-v' in sys.argv:
        def rms(a, b):
            return 20 * np.log10(np.sqrt((placed[int(a * SR):int(b * SR)] ** 2).mean()) + 1e-9)
        print(f'{name:8s} intro {rms(1, 6):6.1f}  cards {rms(11, 22):6.1f}  hook {rms(23, 34):6.1f}  end {rms(37.7, 44):6.1f} dB')

# Two real rooms, recorded (see IRS): a warehouse, heard from 35 ft, for the
# orchestra's space; a kitchen, close up, for the drums and bass. The hall
# hears nothing under 220 Hz, so the low end stays clean.
hall_send = sosfilt(butter(2, 220, 'highpass', fs=SR, output='sos'), hall_send, axis=0)
WAREHOUSE, KITCHEN = impulse('cardiod-35-10-spread.wav'), impulse('kitchen-true-stereo.wav')
small_room = reverb(room_send + bass_room, KITCHEN, 0.004)
mix = dry + reverb(hall_send, WAREHOUSE, 0.022) + small_room * 0.8


def save(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-',
                    path], input=x.astype(np.float32).tobytes(), check=True)


save(os.path.join(out, 'raw.wav'), mix)
save(os.path.join(out, 'bass.wav'), bass_dry)

fx_path = os.path.join(out, 'fx.json')
fx = json.load(open(fx_path))
fx['kit'] = kit
json.dump(fx, open(fx_path, 'w'))
print(f'out/raw.wav ({len(kit)} kit hits to synth.py)')
