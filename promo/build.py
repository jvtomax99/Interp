"""HUMC Interpreter Hub team promo, v12 (v4's cut, more colour and motion): 45 s, 1080x1920, cut to a 120 BPM bed.
0-8.4 s    hook: "The doctor says: heart failure." A word barrage, a half-second
           countdown, the interpreter's voice (em_alex) tries "¿fallo
           cardíaco?", struck out ("Nope."), then "insuficiencia cardíaca"
           slams in on the drop at 6.0 s. "There it is."
8.3-10     title: Hub icon, Interpreter Hub
10-37      the phone: nine real screens, 3 s each. Each beat slides in its
           screen, pushes in on the one detail that proves the line, rings
           it, and pulls back out. Big masked headlines, a story bar on top.
37-45      end card: Dr. Smiley, the address, the three Add to Home Screen
           steps as they're said, "See you on the floor."
Voice: voice/ (voice.py). Music: sfx/music.wav (music.py)."""
import sys, json, wave, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
from PIL import ImageFont

P = HERE + '/edit/promo.tsrct'
WK = HERE + '/edit/.tesseract-work'
DUR = 45000
SW, SH = 600, int(600 * 2277 / 1179)
PX, PY = 540, 1190
BEATS = [10000 + i * 3000 for i in range(9)]
BEAT, END = 3000, 37000
DANGER = hexc('#FF5A6E')
# v12: one bright per phone beat (headline bar, ring, glow) over the hospital's blues
BRIGHT = ['#FF6B5A', '#FFC23D', '#2ED3A0', '#FF7AB6', '#9B8CFF', '#FF9142', '#4FD1FF', '#B8E34A', '#01B8E6']
BLUES = ['#0F5FA6', '#2E8BD0', '#01B8E6', '#3A4CB8']
INK = hexc('#06123A')
TTF = HERE + '/fonts/inter/extras/ttf/Inter-'

if not os.path.exists(TTF + 'Bold.ttf'):
    os.makedirs(HERE + '/fonts', exist_ok=True)
    os.system(f'curl -fsSL -o {HERE}/fonts/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip && unzip -q -o {HERE}/fonts/inter.zip -d {HERE}/fonts/inter')
os.makedirs(WK, exist_ok=True)

ids = iter(range(1, 10000))
nid = lambda: next(ids)
A = []                                              # keyframe actions
POP = {'type': 'cubicBezier', 'x1': .3, 'y1': 1.5, 'x2': .4, 'y2': 1}     # overshoot
SNAP = {'type': 'cubicBezier', 'x1': .1, 'y1': .9, 'x2': .1, 'y2': 1}     # fast settle
WHIP = {'type': 'cubicBezier', 'x1': .7, 'y1': 0, 'x2': .3, 'y2': 1}


def width(txt, size, face='ExtraBold'):
    return ImageFont.truetype(TTF + face + '.ttf', size).getlength(txt)


def wav_ms(f):
    with wave.open(f) as w: return int(w.getnframes() * 1000 / w.getframerate())


def part_gap_ms(f):
    """Where the second part of a two-part voice line starts (after its 120 ms join)."""
    with wave.open(f) as w:
        sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), '<i2')
    quiet = np.abs(a) < 30
    m = int(.1 * sr); quiet[:m] = False; quiet[-m:] = False      # not the edges
    best, run_, at = 0, 0, 0
    for i, q in enumerate(quiet):
        run_ = run_ + 1 if q else 0
        if run_ > best: best, at = run_, i
    return int((at + 1) * 1000 / sr)


# ---------- assets ----------
SHOTS = ['home', 'domain', 'translate', 'doctor', 'falsefriends', 'drill', 'practice', 'chat', 'ask']
SFX = {'whoosh1': ('air-whoosh', 1), 'impact': ('soft-impact', 3), 'whoosh2': ('air-whoosh', 4),
       'pop': ('soft-pop', 5), 'down': ('downlifter', 6), 'ping': ('clear-ping', 7),
       'click': ('dry-click', 8), 'tap': ('soft-tap', 9)}
if os.path.exists(P): os.remove(P)
run('project', 'create', '--project', P)
for f in ['Bold', 'ExtraBold', 'SemiBold', 'Medium']:
    run('project', 'import-font', '--project', P, '--file', TTF + f + '.ttf')
for s in SHOTS:
    run('project', 'import-asset', '--project', P, '--file', f'{HERE}/shots/{s}.png', '--asset-id', 'shot-' + s, '--kind', 'image')
run('project', 'import-asset', '--project', P, '--file', '/home/user/Interp/icon-512.png', '--asset-id', 'hub-icon', '--kind', 'image')
run('project', 'import-asset', '--project', P, '--file', '/home/user/Interp/drsmiley/base.webp', '--asset-id', 'smiley', '--kind', 'image')
run('project', 'import-asset', '--project', P, '--file', '/home/user/Interp/hero.jpg', '--asset-id', 'campus', '--kind', 'image')
SFXLEN = {}
for name, (preset, seed) in SFX.items():
    f = f'{HERE}/sfx/{name}.wav'
    if not os.path.exists(f):
        os.system(f'python3 ~/.claude/skills/tesseract-video/scripts/tesseract_sound.py make --preset {preset} --seed {seed} --output {f} >/dev/null')
    SFXLEN[name] = wav_ms(f)
    run('project', 'import-asset', '--project', P, '--file', f, '--asset-id', 'sfx-' + name, '--kind', 'audio')
if not os.path.exists(HERE + '/sfx/music.wav'):
    os.system(f'python3 {HERE}/music.py')
run('project', 'import-asset', '--project', P, '--file', HERE + '/sfx/music.wav', '--asset-id', 'music', '--kind', 'audio')

NARR = json.load(open(HERE + '/narration.json'))['lines']
# the voice's finishing chain (v7, Chatterbox). v5/v6 warmed Kokoro (Jose's pick): +2.5 dB
# at 180 Hz, -2 dB at 3 kHz, compression, a touch of room. Measured on Chatterbox: its
# 60-300 Hz already matches that warmed Kokoro (within 0.3 dB), its 1-5 kHz runs 5 dB
# hotter, its loud/soft spread is 15 dB against 11.5. So the low boost and the room go;
# the 3 kHz cut and the compression stay. Made from voice/ into voice/warm/.
WARM = ('highpass=f=70,equalizer=f=3000:t=q:w=1.2:g=-2,'
        'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120')
os.makedirs(HERE + '/voice/warm', exist_ok=True)
for i in range(len(NARR)):
    src, dst = f'{HERE}/voice/line{i:02d}.wav', f'{HERE}/voice/warm/line{i:02d}.wav'
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        os.system(f'ffmpeg -nostdin -loglevel error -y -i {src} -af "{WARM}" {dst}')
VOICE = [(L['start_ms'], wav_ms(f'{HERE}/voice/warm/line{i:02d}.wav')) for i, L in enumerate(NARR)]
# "heart failure" slams in after the pause in "The doctor says:"; the strike lands on "Nope"
T_HF = NARR[0]['start_ms'] + part_gap_ms(HERE + '/voice/line00.wav')
T_NOPE = NARR[3]['start_ms'] + 80


# ---------- helpers (times are on the layer's own clock) ----------
def blur(L):
    L['motionBlur'] = True
    return L


def scale_keys(L, keys):
    A.append(kf(L['id'], 'scaleX', keys)); A.append(kf(L['id'], 'scaleY', keys))


def fade(L, keys):
    A.append(kf(L['id'], 'opacity', keys))


def pop(L, t_in, t_out=None, s0=60, d=420):
    keys = [(t_in, s0, None), (t_in + d, 100, POP)]
    ok = [(t_in, 0, None), (t_in + 160, 100, LIN)]
    if t_out:
        keys += [(t_out, 100, LIN), (t_out + 220, 70, INOUT)]
        ok += [(t_out, 100, LIN), (t_out + 220, 0, LIN)]
    scale_keys(L, keys); fade(L, ok)


def mline(name, start, dur, txt, size, x, y, t_in, t_out, color=None, face='xbold', just='left', w=940, track=-30):
    """One headline line that rises out of a mask at t_in and up into it at t_out."""
    h = int(size * 1.3)
    T = blur(text(nid(), name, 0, dur, txt, size, (x, y + h), font=face, color=color, just=just, box=(w, h), tracking=track))
    M = rect(nid(), name + ' mask', 0, dur, (w + 40, h), WHITE, (x - 20, y))
    keys = [(t_in, y + h, None), (t_in + 520, y, SNAP)]
    if t_out: keys += [(t_out, y, LIN), (t_out + 320, y - h, WHIP)]
    A.append(kf(T['id'], 'positionY', keys))
    return group(nid(), name, start, dur, [T, M], matte=M['id'])


FACE = {'xbold': 'ExtraBold', 'semi': 'SemiBold', 'med': 'Medium', 'bold': 'Bold'}


def kline(name, start, dur, txt, size, x, y, t_in, t_out=None, color=None, face='xbold', just='left', track=-30,
          stagger=70, marker=None, ink=None):
    """A line of type, word by word: each word rises out of a mask with a small
    tilt, 70 ms after the one before. marker: a colour bar that wipes in behind
    the line first (the words then take ink). Exits the same way, upward."""
    words = txt.split(' ')
    ww = [width(wd, size, FACE[face]) + track / 1000 * size * len(wd) for wd in words]
    gap = width(' ', size, FACE[face])
    total = sum(ww) + gap * (len(words) - 1)
    x0 = x if just == 'left' else x - total / 2
    h = size * 1.3
    padx = size * .24 if marker else 10
    kids, cx = [], x0
    for j, (wd, wwd) in enumerate(zip(words, ww)):
        T = blur(text(nid(), f'{name}: {wd}', 0, dur, wd, size, (cx, y + h), font=face, color=ink if marker else color,
                      just='left', box=(wwd + size, h), tracking=track, anchor=(0, h)))
        t = t_in + j * stagger
        ky = [(t, y + h * 2.05, None), (t + 480, y + h, SNAP)]
        kr = [(t, 9, None), (t + 480, 0, SNAP)]
        if t_out:
            to = t_out + j * 40
            ky += [(to, y + h, LIN), (to + 300, y - h * .1, WHIP)]
        ko = [(0, 0, None)] + ([(t, 0, LIN)] if t > 0 else []) + [(t + 160, 100, LIN)]
        if t_out: ko += [(t_out + j * 40 + 120, 100, LIN), (t_out + j * 40 + 300, 0, LIN)]
        A.append(kf(T['id'], 'positionY', ky)); A.append(kf(T['id'], 'rotation', kr)); fade(T, ko)
        kids.append(T); cx += wwd + gap
    if marker:
        bh = size * 1.12
        B = rect(nid(), name + ' marker', 0, dur, (total + 2 * padx, bh), marker, (x0 - padx, y + (h - bh) / 2), roundness=bh * .22)
        A.append(kf(B['id'], 'scaleX', [(0, 0, None), (max(1, t_in - 120), 0, LIN), (t_in + 260, 100, SNAP)]))
        if t_out:
            A.append(kf(B['id'], 'positionY', [(t_out + 60, y + (h - bh) / 2, None), (t_out + 400, y - h, WHIP)]))
        kids.append(B)
    M = rect(nid(), name + ' mask', 0, dur, (total + 2 * padx + 40, h + 12), WHITE, (x0 - padx - 20, y - 6))
    return group(nid(), name, start, dur, kids + [M], matte=M['id'])


def stack(name, start, dur, lines, size, x, ytop, leading, t_in, stagger=110, color=None, pos=None, instant=False):
    """Big stacked words that slam in line by line (scale 135 -> 100)."""
    kids = []
    for j, ln in enumerate(lines):
        T = blur(text(nid(), f'{name}: {ln}', 0, dur, ln, size, (x, ytop + j * leading + leading / 2), font='xbold', color=color,
                      just='left', box=(1000, leading * 1.2), tracking=-40, anchor=(0, leading / 2)))
        t = t_in + j * stagger
        scale_keys(T, [(t, 135, None), (t + 380, 100, SNAP)])
        fade(T, [(t, 100 if instant and not j else 0, None), (t + 90, 100, LIN)])
        A.append(kf(T['id'], 'positionY', [(t, ytop + j * leading + leading / 2 + 40, None), (t + 380, ytop + j * leading + leading / 2, SNAP)]))
        kids.append(T)
    p = pos or (0, 0)
    return group(nid(), name, start, dur, kids[::-1], pos=p, anchor=p)


def sticker(label, x, y, start, dur, t_in, t_out=None, fill=WHITE, ink=None, rot=0, size=36):
    w = int(width(label, size, 'SemiBold') + 64); h = int(size * 2.3)
    pill = rect(nid(), 'Sticker pill', 0, dur, (w, h), fill, (0, 0), roundness=h / 2, shadow=shadow(40, 16, .35))
    t = text(nid(), 'Sticker label', 0, dur, label, size, (0, 0), font='semi', color=ink or NAVY, box=(w, h))
    t['sourceText']['verticalAlign'] = 'center'
    G = group(nid(), 'Sticker: ' + label, start, dur, [t, pill], pos=(x, y), anchor=(w / 2, h / 2))
    G['transform']['rotation'] = rot
    pop(G, t_in, t_out, s0=40)
    return G


def flash(at, peak=45):
    F = rect(nid(), 'Flash', at, 260, (1080, 1920), WHITE, (0, 0))
    fade(F, [(0, peak, None), (240, 0, OUT)])
    return F


def radial(id, name, cx, cy, r, color):
    return rect(id, name, 0, DUR, (r * 2, r * 2), color, (cx, cy), anchor=(r, r),
                paint={'type': 'gradient', 'gradientType': 'radial', 'start': [r, r], 'end': [r * 2, r],
                       'stops': [{'offset': 0, 'color': color}, {'offset': 1, 'color': color[:3] + [0]}]})


def shape(name, start, dur, size, color, pos, diamond=False):
    """A square, or a diamond (the square turned 45 degrees): the HMH mark's two pieces."""
    L = rect(nid(), name, start, dur, (size, size), color, pos, roundness=size * .08, anchor=(size / 2, size / 2))
    L['transform']['rotation'] = 45 if diamond else 0
    return L


def burst(at, cx, cy, n=12, dist=520, size=34, d=750):
    """Squares and diamonds flying out from a point, on a hit."""
    out = []
    for j in range(n):
        a = 2 * np.pi * j / n + .2
        r = dist * (.75 + .5 * ((j * 7) % 5) / 4)
        col = hexc(BRIGHT[j % len(BRIGHT)]) if j % 2 else hexc(BLUES[j % len(BLUES)])
        L = shape('Burst', at, d + 60, size * (1 + .5 * (j % 3) / 2), col, (cx, cy), diamond=j % 2)
        ex, ey = cx + r * np.cos(a), cy + r * np.sin(a)
        A.append(kf(L['id'], 'positionX', [(0, cx, None), (d, ex, OUT)]))
        A.append(kf(L['id'], 'positionY', [(0, cy, None), (d, ey, OUT)]))
        r0 = L['transform']['rotation']
        A.append(kf(L['id'], 'rotation', [(0, r0, None), (d, r0 + (200 if j % 2 else -200), OUT)]))
        scale_keys(L, [(0, 30, None), (180, 110, OUT), (d, 50, LIN)])
        fade(L, [(0, 100, None), (d * .55, 100, LIN), (d, 0, LIN)])
        out.append(L)
    return out


def wipe(cut, lead):
    """Five slanted bands sweep across and fully cover the frame at `cut`: a scene change."""
    cols = [lead, '#01B8E6', '#2E8BD0', '#0F5FA6', '#1E2A6E']
    out = []
    for k, c in enumerate(cols):
        L = rect(nid(), 'Wipe band', cut - 420, 900, (450, 2900), hexc(c), (0, 960), anchor=(225, 1450))
        L['transform']['rotation'] = 15
        off = -k * 330
        A.append(kf(L['id'], 'positionX', [(0, -600 + off, None), (400, 1200 + off, SNAP), (440, 1250 + off, LIN),
                                           (840, 3000 + off, WHIP)]))
        out.append(L)
    return out


def streak(at, y, color, rot=-18, d=480):
    """A thin light streak zipping across."""
    L = rect(nid(), 'Streak', at, d + 20, (900, 12), color, (0, y), roundness=6, anchor=(450, 6),
             paint={'type': 'gradient', 'gradientType': 'linear', 'start': [0, 0], 'end': [900, 0],
                    'stops': [{'offset': 0, 'color': color[:3] + [0]}, {'offset': .8, 'color': color},
                              {'offset': 1, 'color': hexc('#FFFFFF')}]})
    L['transform']['rotation'] = rot
    A.append(kf(L['id'], 'positionX', [(0, -700, None), (d, 1800, INOUT)]))
    return L


def glow(name, start, dur, cx, cy, r, color, fin=400, fout=400):
    G = radial(nid(), name, cx, cy, r, color)
    G['activeRange'] = rng(start, dur)
    fade(G, [(0, 0, None), (fin, 100, LIN), (dur - fout, 100, LIN), (dur, 0, LIN)])
    return G


layers = []                                       # built back to front, reversed at save
add = lambda L: layers.append(L) or L

# ---------- background: navy, two drifting glows, giant marquee type ----------
add(rect(nid(), 'Background', 0, DUR, (1080, 1920), DEEP, (0, 0),
         paint={'type': 'gradient', 'gradientType': 'linear', 'start': [0, 0], 'end': [1080, 1920],
                'stops': [{'offset': 0, 'color': hexc('#1E2A6E')}, {'offset': .55, 'color': hexc('#141C4C')}, {'offset': 1, 'color': DEEP}]}))
o1 = add(radial(nid(), 'Glow cyan', 160, 380, 760, hexc('#01B8E6', .30)))
o2 = add(radial(nid(), 'Glow blue', 980, 1560, 860, hexc('#2E8BD0', .34)))
A.append(kf(o1['id'], 'positionX', [(0, 160, None), (10000, 820, INOUT), (20000, 200, INOUT), (30000, 700, INOUT)]))
A.append(kf(o1['id'], 'positionY', [(0, 380, None), (10000, 700, INOUT), (20000, 1200, INOUT), (30000, 420, INOUT)]))
A.append(kf(o2['id'], 'positionX', [(0, 980, None), (10000, 300, INOUT), (20000, 900, INOUT), (30000, 400, INOUT)]))
A.append(kf(o2['id'], 'positionY', [(0, 1560, None), (10000, 1300, INOUT), (20000, 700, INOUT), (30000, 1500, INOUT)]))
add(glow('Glow wrong word', NARR[2]['start_ms'] - 200, 5900 - NARR[2]['start_ms'], 300, 1350, 820, hexc('#FF6B5A', .34)))
add(glow('Glow right word', 6000, 2450, 540, 1000, 900, hexc('#2ED3A0', .30), fin=120))
add(glow('Glow title', 8250, 1600, 540, 700, 800, hexc('#FFC23D', .24), fin=150, fout=300))
for i in range(9):
    add(glow(f'Glow beat {i + 1}', BEATS[i] - 400, BEAT + 400, 540, 1250, 1000, hexc(BRIGHT[i], .36)))
# squares and diamonds, the HMH mark's pieces, around the edges: dim until the drop, then pulse
# on every half bar
SHAPES = [(70, 180, 70, 1), (980, 150, 56, 0), (1010, 520, 90, 1), (60, 700, 48, 0), (130, 1050, 84, 1),
          (1000, 880, 44, 0), (950, 1280, 72, 0), (80, 1450, 60, 1), (1010, 1700, 96, 1), (180, 1820, 50, 0),
          (560, 90, 40, 1), (760, 1860, 58, 0), (300, 330, 36, 0), (840, 400, 30, 1), (240, 1620, 34, 1), (880, 1520, 38, 0)]
for j, (x, y, sz, dm) in enumerate(SHAPES):
    col = hexc(BRIGHT[(j * 3) % 9], .75) if j % 3 == 2 else hexc(BLUES[j % 4], .6)
    L = add(blur(shape(f'Shape {j + 1}', 0, DUR, sz, col, (x, y), diamond=dm)))
    A.append(kf(L['id'], 'positionY', [(0, y, None), (DUR, y - 160 - 60 * (j % 3), LIN)]))
    r0 = 45 if dm else 0
    A.append(kf(L['id'], 'rotation', [(0, r0, None), (6000, r0 + 20, LIN), (DUR, r0 + (110 if j % 2 else -110), LIN)]))
    fade(L, [(0, 35, None), (5900, 35, LIN), (6050, 100, LIN)])
    sk = [(0, 100, None), (6000, 100, LIN), (6200, 165, OUT), (6600, 100, INOUT)]
    for t in range(7000, DUR - 400, 1000):
        sk += [(t, 100, LIN), (t + 90, 122, OUT), (t + 420, 100, INOUT)]
    scale_keys(L, sk)
MQ = 'HEART FAILURE · INSUFICIENCIA CARDÍACA · HACKENSACK UNIVERSITY MEDICAL CENTER · '
for row, (y, x0, x1) in enumerate([(250, 0, -2600), (1640, -2600, 0)]):
    m = add(text(nid(), f'Marquee {row + 1}', 0, DUR, MQ * 2, 230, (x0, y), font='xbold', color=hexc('#FFFFFF', .045),
                 just='left', box=(9000, 300), tracking=-20))
    A.append(kf(m['id'], 'positionX', [(0, x0, None), (DUR, x1, LIN)]))

# ---------- A. hook ----------
# "The doctor says: heart failure." / "You've got half a second." / ES: "¿Fallo cardíaco?" /
# "Nope. Not with patients." / ES: "Insuficiencia cardíaca." (the drop) / "There it is."
HX = 90
DROP = 6000
OUT_HOOK = DROP - 260                               # everything whips out, a beat of silence, the drop
says = add(blur(stack('The doctor says', 0, T_HF + 400, ['The doctor', 'says:'], 150, HX, 810, 150, 0, instant=True, pos=(HX, 960))))
fade(says, [(T_HF - 120, 100, None), (T_HF + 120, 0, LIN)])
A.append(kf(says['id'], 'positionY', [(T_HF - 120, 960, None), (T_HF + 200, 700, WHIP)]))
# a barrage of the words a cardiology visit throws at you, one per beat behind the type
BARRAGE = [('dyspnea', 120, 300, -8), ('ejection fraction', 500, 1500, 5), ('BNP', 760, 380, -4), ('edema', 180, 1700, 6),
           ('diuretic', 560, 260, 3), ('echo', 820, 1350, -6), ('stent', 300, 1560, 4), ('NPO', 700, 520, -3),
           ('A-fib', 140, 1240, 7), ('beta-blocker', 520, 1720, -5)]
for j, (w, x, y, r) in enumerate(BARRAGE):
    at = j * 250
    b = add(text(nid(), 'Barrage ' + w, at, 520, w, 64, (x, y), font='bold', color=hexc('#9FD8FF'), just='left', box=(700, 90)))
    b['transform']['rotation'] = r
    fade(b, [(0, 0, None), (60, 34, LIN), (300, 22, LIN), (520, 0, LIN)])
    scale_keys(b, [(0, 120, None), (520, 96, OUT)])
tag_dr = add(text(nid(), 'DOCTOR tag', T_HF - 100, 3550 - T_HF, 'THE DOCTOR', 34, (HX, 560), font='semi', color=CYAN, just='left', box=(600, 50), tracking=300))
fade(tag_dr, [(0, 0, None), (200, 100, OUT), (3150 - T_HF, 100, LIN), (3400 - T_HF, 0, LIN)])
hf = add(blur(stack('heart failure', T_HF - 100, OUT_HOOK - T_HF + 100, ['Heart', 'failure'], 200, HX, 620, 190, 0, stagger=150, pos=(HX, 830))))
scale_keys(hf, [(0, 100, None), (1950 - T_HF, 103, LIN), (2250 - T_HF, 58, SNAP)])
A.append(kf(hf['id'], 'positionY', [(1950 - T_HF, 830, None), (2250 - T_HF, 520, SNAP)]))
A.append(kf(hf['id'], 'positionX', [(OUT_HOOK - T_HF - 200, HX, None), (OUT_HOOK - T_HF + 60, HX - 1300, WHIP)]))
add(flash(T_HF - 100, 30))

# the countdown: half a second, slowed down so you can watch it run out
CD0, CD1 = 2050, 3250
cd = text(nid(), 'Countdown', 0, CD1 - CD0 + 200, '0.50s', 260, (HX, 900), font='xbold', just='left', box=(1000, 320), tracking=-30)
cdl = text(nid(), 'Countdown label', 0, CD1 - CD0 + 200, 'TO FIND THE WORD', 34, (HX + 8, 840), font='semi', color=hexc('#FFFFFF', .7), just='left', box=(800, 50), tracking=300)
cdb0 = rect(nid(), 'Countdown track', 0, CD1 - CD0 + 200, (900, 14), hexc('#FFFFFF', .18), (HX, 1250), roundness=7)
cdb = rect(nid(), 'Countdown bar', 0, CD1 - CD0 + 200, (900, 14), CYAN, (HX, 1250), roundness=7)
A.append(kf(cdb['id'], 'scaleX', [(0, 100, None), (CD1 - CD0, 0, LIN)]))
cdG = add(blur(group(nid(), 'Countdown', CD0, CD1 - CD0 + 200, [cdb, cdb0, cdl, cd], pos=(540, 1000), anchor=(540, 1000))))
scale_keys(cdG, [(0, 70, None), (300, 100, POP), (CD1 - CD0, 100, LIN), (CD1 - CD0 + 200, 40, WHIP)])
fade(cdG, [(0, 0, None), (120, 100, LIN), (CD1 - CD0, 100, LIN), (CD1 - CD0 + 200, 0, LIN)])
A.append({'type': 'setFxPropertyAnimator', 'compositionId': 'main', 'property': {'layerId': cd['id'], 'propertyType': 'textContent'},
          'animator': {'type': 'jsScript', 'layerTimeJsCode':
                       f'var v=Math.max(0,0.5-input.time.milliseconds/{CD1 - CD0}*0.5);return v.toFixed(2)+"s";'}, 'dependencies': []})
A.append({'type': 'setFxPropertyAnimator', 'compositionId': 'main', 'property': {'layerId': cd['id'], 'propertyType': 'fillColor'},
          'animator': {'type': 'jsScript', 'layerTimeJsCode':
                       f'var p=Math.min(1,Math.max(0,(input.time.milliseconds-{(CD1 - CD0) * .6:.0f})/{(CD1 - CD0) * .4:.0f}));'
                       f'return [1,1-p*0.65,1-p*0.57,1];'}, 'dependencies': []})

# "¿fallo cardíaco?" (the wrong word, in the interpreter's voice), then "Nope."
FA0 = NARR[2]['start_ms'] - 80
FY = 1140
tag_es = text(nid(), 'YOU tag', 0, OUT_HOOK - FA0, 'THE INTERPRETER', 34, (HX, FY - 130), font='semi', color=DANGER, just='left', box=(700, 50), tracking=300)
fallo = stack('fallo cardiaco', 0, OUT_HOOK - FA0, ['¿Fallo', 'cardíaco?'], 170, HX, FY, 165, 60, stagger=120)
ts = T_NOPE - FA0                                  # strike on "Nope", on the fallo block's clock
bars = []
for j, word in enumerate(['¿Fallo', 'cardíaco?']):
    w = width(word, 170) + 30
    b = rect(nid(), 'Strike ' + word, 0, OUT_HOOK - FA0, (w, 20), DANGER, (HX - 15, FY + 98 + j * 165), roundness=10)
    A.append(kf(b['id'], 'scaleX', [(ts + j * 110, 0, None), (ts + j * 110 + 240, 100, SNAP)]))
    bars.append(b)
fade(fallo, [(ts, 100, None), (ts + 250, 45, LIN)])
fade(tag_es, [(0, 0, None), (200, 100, OUT)])
nope = sticker('Not for patients.', 640, FY + 470, 0, OUT_HOOK - FA0, ts + 40, rot=-5, fill=DANGER, ink=WHITE, size=56)
fb = add(blur(group(nid(), 'Fallo block', FA0, OUT_HOOK - FA0 + 300, [nope] + bars + [fallo, tag_es])))
A.append(kf(fb['id'], 'positionY', [(0, 110, None), (380, 0, SNAP)]))
A.append(kf(fb['id'], 'positionX', [(OUT_HOOK - FA0 - 200, 0, None), (OUT_HOOK - FA0 + 60, -1300, WHIP)]))

# the answer, on the drop
ANS = DROP
AD = 8450 - ANS
ins = stack('insuficiencia cardiaca', 0, AD, ['Insuficiencia', 'cardíaca'], 150, HX, 880, 150, 0, stagger=140, instant=True)
tag_ok = text(nid(), 'YOU, AGAIN tag', 0, AD, 'THE RIGHT WORD', 34, (HX, 770), font='semi', color=CYAN, just='left', box=(600, 50), tracking=300)
ul = rect(nid(), 'Answer underline', 0, AD, (width('Insuficiencia', 150) * .72, 16), CYAN, (HX, 1220), roundness=8)
there = sticker('There it is.', 760, 1340, 0, AD, NARR[5]['start_ms'] - ANS, rot=-6, fill=CYAN, ink=hexc('#06123A'), size=56)
A.append(kf(ul['id'], 'scaleX', [(150, 0, None), (550, 100, SNAP)]))
fade(tag_ok, [(80, 0, None), (300, 100, OUT)])
ansG = add(blur(group(nid(), 'Hook answer', ANS, AD, [there, ul, tag_ok, ins], pos=(540, 960), anchor=(540, 960))))
A.append(kf(ansG['id'], 'positionX', [(0, 1140, None), (380, 540, SNAP)]))
scale_keys(ansG, [(0, 125, None), (450, 100, POP), (AD - 300, 104, LIN), (AD, 190, WHIP)])
fade(ansG, [(AD - 300, 100, None), (AD, 0, LIN)])
add(flash(ANS, 55))
for L in burst(ANS, 540, 960, n=14, dist=620, size=38): add(L)
for L in burst(T_HF - 100, 540, 900, n=10, dist=480, size=28, d=650): add(L)

# ---------- B. title ----------
T0 = 8300
TD = BEATS[0] - T0 + 100
IC = (540, 680)
icon = image(nid(), 'Hub icon', 0, TD, 'hub-icon', (240, 240), IC, anchor=(120, 120), radius=58, shadow=shadow(60, 24, .45))
ringk = []
for j in range(12):
    a = 2 * np.pi * j / 12 - np.pi / 2
    col = hexc(BRIGHT[j // 2 % 9]) if j % 4 == 3 else hexc(BLUES[j % 4])
    L = shape('Mark piece', 0, TD, 46, col, IC, diamond=j % 2)
    fx, fy = IC[0] + 215 * np.cos(a), IC[1] + 215 * np.sin(a)
    sx_, sy_ = IC[0] + 700 * np.cos(a + 1), IC[1] + 700 * np.sin(a + 1)
    t = 60 + j * 35
    A.append(kf(L['id'], 'positionX', [(t, sx_, None), (t + 520, fx, SNAP)]))
    A.append(kf(L['id'], 'positionY', [(t, sy_, None), (t + 520, fy, SNAP)]))
    fade(L, [(t, 0, None), (t + 150, 100, LIN)])
    ringk.append(L)
markG = blur(group(nid(), 'Mark ring', 0, TD, ringk, pos=IC, anchor=IC))
A.append(kf(markG['id'], 'rotation', [(0, -40, None), (700, 0, SNAP), (TD, 18, LIN)]))
pop(icon, 0, s0=10, d=520)
A.append(kf(icon['id'], 'rotation', [(0, -120, None), (600, 0, SNAP)]))
t_meet = NARR[5]['start_ms'] + 700 - T0              # "Meet Interpreter Hub"
tl = kline('Title', 0, TD, 'Interpreter Hub', 124, 540, 960, t_meet, None, just='center', track=-35, stagger=110)
tsub = kline('Title sub', 0, TD, 'for the HUMC interpreter team', 46, 540, 1140, t_meet + 300, None, face='med', just='center',
             track=0, stagger=40, color=hexc('#FFFFFF', .75))
titleG = add(blur(group(nid(), 'Title', T0, TD, [tsub, tl, icon, markG], pos=(540, 960), anchor=(540, 960))))
scale_keys(titleG, [(TD - 650, 100, None), (TD - 300, 70, WHIP)])
A.append(kf(titleG['id'], 'positionY', [(TD - 650, 960, None), (TD - 300, 520, WHIP)]))
fade(titleG, [(TD - 600, 100, None), (TD - 300, 0, LIN)])

# ---------- C. the phone ----------
PH0 = BEATS[0] - 350
PHD = END + 400 - PH0
WIDE, WY = 88, 1250
# (focus x, focus y as a fraction of the screen, push scale, ring box x0, y0, x1, y1)
FOCUS = [(.5, .80, 145, .02, .755, .98, .875), (.5, .60, 150, .03, .545, .97, .675),
         (.5, .815, 150, .03, .74, .97, .865), (.5, .38, 145, .02, .24, .98, .53),
         (.5, .54, 150, .04, .42, .96, .655), (.5, .72, 148, .02, .585, .98, .9),
         (.5, .40, 145, .03, .245, .97, .545), (.5, .52, 140, .02, .30, .98, .71),
         (.5, .58, 150, .05, .47, .95, .69)]
HEAD = [('Built by our', 'own interpreters.'), ('One glossary.', 'Every specialty.'), ('Glossary first.', 'AI second.'),
        ('Ready for', 'every physician.'), ('101 false friends.', 'Flagged.'), ('Daily drills.', 'Sharp skills.'),
        ('National certification.', 'Prep built in.'), ('One team.', 'One channel.'), ('Stuck?', 'Ask Dr. Smiley.')]

pid = nid()
body = rect(nid(), 'Phone body', 0, PHD, (SW + 34, SH + 34), hexc('#060918'), (PX, PY), roundness=84,
            anchor=((SW + 34) / 2, (SH + 34) / 2), stroke=(hexc('#3A4790'), 3), shadow=shadow(90, 46, .55, '#02040F'))
matte = rect(nid(), 'Screen matte', 0, PHD, (SW, SH), WHITE, (PX, PY), roundness=66, anchor=(SW / 2, SH / 2))
strip = []
for i, s in enumerate(SHOTS):
    fx, fy, sc, x0, y0, x1, y1 = FOCUS[i]
    t = BEATS[i] - PH0
    ring = rect(nid(), 'Ring ' + s, 0, PHD, ((x1 - x0) * SW, (y1 - y0) * SH), hexc(BRIGHT[i], .12),
                (i * SW + (x0 + x1) / 2 * SW, (y0 + y1) / 2 * SH), roundness=22,
                anchor=((x1 - x0) * SW / 2, (y1 - y0) * SH / 2), stroke=(hexc(BRIGHT[i]), 6))
    scale_keys(ring, [(t + 1150, 112, None), (t + 1500, 100, SNAP), (t + 2550, 100, LIN), (t + 2800, 106, LIN)])
    fade(ring, [(0, 0, None), (t + 1150, 0, LIN), (t + 1300, 100, LIN), (t + 2550, 100, LIN), (t + 2800, 0, LIN)])
    strip.append(ring)
for i, s in enumerate(SHOTS):
    strip.append(image(nid(), 'Screen ' + s, 0, PHD, 'shot-' + s, (SW, SH), (i * SW, 0)))
stid = nid()
stripG = blur(group(stid, 'Screen strip', 0, PHD, strip, pos=(PX - SW / 2, PY - SH / 2)))
scr = group(nid(), 'Screens', 0, PHD, [stripG], matte=matte['id'])
sx, keys = PX - SW / 2, [(0, PX - SW / 2, None)]
for i in range(1, len(SHOTS)):
    t = BEATS[i] - PH0
    keys += [(t - 260, sx - (i - 1) * SW, LIN), (t + 200, sx - i * SW, WHIP)]
A.append(kf(stid, 'positionX', keys))
phone = add(blur(group(pid, 'Phone', PH0, PHD, [scr, matte, body], pos=(PX, WY), anchor=(PX, PY))))
# camera: arrive, then per beat: wide -> push in on the detail -> pull back out
px, py, ps, rx, ry = [(0, PX, None)], [(0, WY + 1500, None), (650, WY, SNAP)], [(0, WIDE, None)], \
    [(0, 35, None), (800, 0, SNAP)], [(0, -16, None), (800, -6, SNAP)]
for i in range(len(SHOTS)):
    fx, fy, sc, *_ = FOCUS[i]
    t = BEATS[i] - PH0
    tx, ty = 540 - sc / 100 * (fx - .5) * SW, 1210 - sc / 100 * (fy - .5) * SH
    side = 6 if i % 2 else -6
    px += [(t + 700, PX, LIN), (t + 1250, tx, SNAP), (t + 2500, tx, LIN)]
    py += [(t + 700, WY, LIN), (t + 1250, ty, SNAP), (t + 2500, ty - 12, LIN)]
    ps += [(t + 700, WIDE, LIN), (t + 1250, sc, SNAP), (t + 2500, sc + 4, LIN), (t + 2900, WIDE, INOUT)]
    ry += [(t + 700, side, LIN), (t + 1250, 0, SNAP), (t + 2500, 0, LIN), (t + 2900, -side, INOUT)]
    px += [(t + 2900, PX, INOUT)]; py += [(t + 2900, WY, INOUT)]
te = END - PH0
py += [(te - 50, WY, LIN), (te + 380, 2700, WHIP)]
ps += [(te - 50, WIDE, LIN), (te + 380, 60, WHIP)]
A.append(kf(pid, 'positionX', px)); A.append(kf(pid, 'positionY', py)); scale_keys(phone, ps)
A.append(kf(pid, 'rotationX', rx)); A.append(kf(pid, 'rotationY', ry))
A.append(kf(pid, 'rotation', [(te - 50, 0, None), (te + 380, -18, WHIP)]))

# Dr. Smiley pops up out of the Ask beat, and says the joke
ta = BEATS[8]
sm = add(image(nid(), 'Smiley peek', ta, BEAT, 'smiley', (360, 450), (870, 1960), anchor=(180, 450), fit='contain'))
pop(sm, 300, 2650, s0=30, d=520)
A.append(kf(sm['id'], 'positionY', [(300, 2200, None), (800, 1900, SNAP)]))
A.append(kf(sm['id'], 'rotation', [(300, -16, None), (900, 5, OUT), (1600, -3, INOUT), (2300, 3, INOUT)]))
add(sticker('Available 24/7.', 520, 1600, ta, BEAT, 1500, 2650, rot=-4, size=44))
# the false friend everyone knows, on the False Friends beat
add(sticker('constipado = a cold', 700, 1640, BEATS[4], BEAT, 1650, 2650, fill=WHITE, ink=hexc('#B3263B'), rot=-5, size=40))

# top scrim keeps the headlines readable over the pushed-in screen
scrim = add(rect(nid(), 'Top scrim', BEATS[0] - 300, END - BEATS[0] + 400, (1080, 640), DEEP, (0, 0),
                 paint={'type': 'gradient', 'gradientType': 'linear', 'start': [0, 0], 'end': [0, 640],
                        'stops': [{'offset': 0, 'color': hexc('#0E1438', .96)}, {'offset': .62, 'color': hexc('#0E1438', .9)},
                                  {'offset': 1, 'color': hexc('#0E1438', 0)}]}))
fade(scrim, [(0, 0, None), (400, 100, LIN), (END - BEATS[0], 100, LIN), (END - BEATS[0] + 300, 0, LIN)])
for i, (l1, l2) in enumerate(HEAD):
    add(kline(f'Head {i + 1}a', BEATS[i], BEAT, l1, 84, 80, 118, 100, 2600, face='semi', track=-20, color=hexc('#FFFFFF', .92)))
    add(kline(f'Head {i + 1}b', BEATS[i], BEAT, l2, 96, 92, 232, 330, 2660, marker=hexc(BRIGHT[i]), ink=INK))
for i in range(1, len(SHOTS)):
    for k, (y, rot) in enumerate([(820, -18), (1380, -14), (1720, -20)]):
        add(blur(streak(BEATS[i] - 330 + k * 60, y, hexc(BRIGHT[i]) if k != 1 else hexc('#FFFFFF', .8), rot)))
# story bar: one segment per screen, each fills over its beat
NS = len(SHOTS)
SEGW = (920 - (NS - 1) * 10) / NS
for i in range(NS):
    x = 80 + i * (SEGW + 10)
    bg = add(rect(nid(), f'Story bar {i + 1}', BEATS[0], END - BEATS[0], (SEGW, 8), hexc('#FFFFFF', .22), (x, 64), roundness=4))
    fl = add(rect(nid(), f'Story fill {i + 1}', BEATS[0], END - BEATS[0], (SEGW, 8), WHITE, (x, 64), roundness=4))
    t = BEATS[i] - BEATS[0]
    A.append(kf(fl['id'], 'scaleX', ([(0, 0, None)] if t else []) + [(t, 0, LIN), (t + BEAT, 100, LIN)]))
    for L in (bg, fl):
        fade(L, [(0, 0, None), (300, 100, LIN), (END - BEATS[0] - 300, 100, LIN), (END - BEATS[0], 0, LIN)])
# layers were added back to front; the story bar and headlines must sit above the phone: they do (added later)

# ---------- D. end card ----------
# "Interpreter Hub. Built here, for our patients." / "It's live today, on any phone." /
# "Better words. Safer care."
ED = DUR - END
L15, L16, L17 = (NARR[i]['start_ms'] - END for i in (15, 16, 17))
PH_H = 1114                                       # hero.jpg at full width
photo = image(nid(), 'Campus', 0, ED, 'campus', (1080, PH_H), (0, PH_H), anchor=(0, PH_H))
scale_keys(photo, [(0, 112, None), (ED, 100, OUT)])     # slow pull back from the sign's corner
band = []
for k, c in enumerate(BLUES + ['#FF6B5A', '#FFC23D']):
    band.append(rect(nid(), 'Brand band', 0, ED, (180, 12), hexc(c), (k * 180, PH_H)))
bandG = group(nid(), 'Brand band', 0, ED, band, pos=(0, PH_H), anchor=(0, PH_H))
A.append(kf(bandG['id'], 'scaleX', [(250, 0, None), (750, 100, SNAP)]))
cw = int(width('HACKENSACK UNIVERSITY MEDICAL CENTER', 28, 'SemiBold') + 28 * .2 * 36 + 70)
cap = group(nid(), 'Campus caption', 0, ED, [
    text(nid(), 'Campus caption text', 0, ED, 'HACKENSACK UNIVERSITY MEDICAL CENTER', 28, (0, 0), font='semi', color=WHITE,
         box=(cw, 64), tracking=200),
    rect(nid(), 'Campus caption pill', 0, ED, (cw, 64), hexc('#0E1438', .72), (0, 0), roundness=32)],
    pos=(540, 96), anchor=(cw / 2, 32))
cap['layers'][0]['sourceText']['verticalAlign'] = 'center'
pop(cap, L15 + 900, s0=70)
big = image(nid(), 'Smiley end', 0, ED, 'smiley', (300, 375), (880, PH_H), anchor=(150, 375), fit='contain')
pop(big, 500, s0=20, d=560)
A.append(kf(big['id'], 'rotation', [(500, -10, None), (1200, 3, OUT), (1900, 0, INOUT), (4000, 2, INOUT), (ED, -1, INOUT)]))
TY = 1160
et = kline('End title', 0, ED, 'Interpreter Hub', 112, 540, TY, 350, None, just='center', track=-35, stagger=110)
es = kline('End sub', 0, ED, 'Built here, for our patients.', 46, 540, TY + 148, L15 + 1150, None, face='med', just='center',
           track=0, stagger=45, color=hexc('#FFFFFF', .8))
uw = 640
url = group(nid(), 'Address', 0, ED, [
    text(nid(), 'Address text', 0, ED, 'interp-six.vercel.app', 44, (0, 0), font='semi', color=NAVY, box=(uw, 96)),
    rect(nid(), 'Address pill', 0, ED, (uw, 96), WHITE, (0, 0), roundness=48, shadow=shadow(50, 20, .4))],
    pos=(540, TY + 285), anchor=(uw / 2, 48))
url['layers'][0]['sourceText']['verticalAlign'] = 'center'
pop(url, L16, s0=70)
live = kline('Live', 0, ED, 'Live today, on any phone.', 38, 540, TY + 345, L16 + 350, None, face='med', just='center',
             track=0, stagger=40, color=hexc('#FFFFFF', .72))
tag1 = kline('Tagline 1', 0, ED, 'Better words.', 96, 540, TY + 420, L17, None, just='center', track=-35, stagger=110)
tag2 = kline('Tagline 2', 0, ED, 'Safer care.', 96, 540, TY + 540, L17 + 620, None, just='center', track=-35, stagger=110,
             marker=CYAN, ink=INK)
logo = text(nid(), 'Made at HUMC', 0, ED, 'MADE BY THE HUMC INTERPRETER TEAM', 26, (540, TY + 695), font='semi',
            color=hexc('#01B8E6', .9), box=(1000, 50), anchor=(500, 0), tracking=240)
fade(logo, [(L17 + 900, 0, None), (L17 + 1400, 100, OUT)])
add(group(nid(), 'End card', END, ED, [logo, tag2, tag1, live, url, es, et, big, cap, bandG, photo]))
for L in burst(END + L17 + 620, 540, TY + 610, n=12, dist=460, size=30): add(L)
# colour wipes over everything at the two scene changes
for L in wipe(T0, '#FFC23D'): add(L)
for L in wipe(END + 40, '#FF7AB6'): add(L)

# ---------- sound ----------
for i, (st, n) in enumerate(VOICE):
    run('project', 'import-asset', '--project', P, '--file', f'{HERE}/voice/warm/line{i:02d}.wav', '--asset-id', f'voice-{i:02d}', '--kind', 'audio')
    add(audio(nid(), f'Voice {i + 1}', st, n, f'voice-{i:02d}', vol=1.0))
cues = [('impact', T_HF - 120, .55), ('click', T_NOPE + 40, .8), ('pop', T_NOPE + 40, .5),
        ('whoosh1', OUT_HOOK - 250, .55), ('impact', DROP - 20, .85), ('pop', NARR[5]['start_ms'] - 20, .45),
        ('whoosh2', ANS + AD - 300, .5),
        ('whoosh1', PH0 - 100, .5), ('down', END - 60, .7), ('ping', END + L16, .45),
        ('pop', BEATS[8] + 300, .45), ('tap', BEATS[4] + 1650, .5), ('tap', END + L17 + 620, .5)]
cues += [('whoosh2' if i % 2 else 'whoosh1', BEATS[i] - 300, .35) for i in range(1, len(SHOTS))]
cues += [('tap', BEATS[i] + 1150, .3) for i in range(len(SHOTS))]
for name, at, v in cues:
    add(audio(nid(), 'SFX ' + name, at, SFXLEN[name], 'sfx-' + name, vol=v))

# music under everything, ducked about 6 dB while the voice talks
BED, DUCK = 0.7, 0.35
spans = []
for st, n in VOICE:
    if spans and st - spans[-1][1] < 450: spans[-1][1] = st + n
    else: spans.append([st, st + n])
mus = add(audio(nid(), 'Music bed', 0, DUR, 'music', vol=BED))
js = ('var t=input.time.milliseconds;var S=' + json.dumps(spans) + ';var g=' + str(BED) + ';'
      'for(var i=0;i<S.length;i++){var a=S[i][0]-80,b=S[i][1]+250;'
      'if(t>=a-60&&t<a){g=Math.min(g,' + str(BED) + '-(' + str(BED - DUCK) + ')*(t-(a-60))/60);}'
      'else if(t>=a&&t<=b){g=' + str(DUCK) + ';}'
      'else if(t>b&&t<b+300){g=Math.min(g,' + str(DUCK) + '+(' + str(BED - DUCK) + ')*(t-b)/300);}}'
      'return g;')
A.append({'type': 'setFxPropertyAnimator', 'compositionId': 'main',
          'property': {'layerId': mus['id'], 'propertyType': 'volume'},
          'animator': {'type': 'jsScript', 'layerTimeJsCode': js}, 'dependencies': []})

save(P, WK, DUR / 1000, layers[::-1], A,
     comp={'motionBlur': {'enabled': True, 'shutterAngle': 180, 'samplesPerFrame': 12, 'shutterPhase': -90}})
print('built', len(layers), 'layers,', len(A), 'actions; heart failure at', T_HF)
